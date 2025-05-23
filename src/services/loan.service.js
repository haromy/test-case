const { Loan, LoanSchedule, LoanTransaction, LoanTransactionDetail, connection } = require('../models');
const { roundTo2Decimal, distributeAmount } = require('../libs/accounting');
const { formatDate } = require('../libs/date');
const { Op } = require('sequelize');

class LoanService {
  static async createLoan(loanData) {
    const t = await connection.transaction();

    try {
      console.log(loanData);

      let scheduleResult;
      if (loanData.interest_type === 'FLAT') {
        // For FLAT interest type
        const totalInterest = roundTo2Decimal(loanData.principal_amount * (loanData.interest_rate / 100));

        // Distribute principal and interest separately
        const principalDistribution = distributeAmount(loanData.principal_amount, loanData.tenor, 'FLAT-LAST');
        const interestDistribution = distributeAmount(totalInterest, loanData.tenor, 'FLAT-LAST');

        scheduleResult = {
          principal: principalDistribution.principal,
          interest: interestDistribution.principal, // Use principal array since interest was distributed as a total
          totalInterest: totalInterest
        };
      } else {
        // For REDUCING interest type
        scheduleResult = distributeAmount(loanData.principal_amount, loanData.tenor, 'REDUCING', {
          annualRate: loanData.interest_rate
        });
      }

      const totalInterest = roundTo2Decimal(scheduleResult.interest.reduce((sum, amount) => sum + amount, 0));
      const totalRepayable = roundTo2Decimal(loanData.principal_amount + totalInterest);

      // Generate loan schedule
      const schedules = [];
      let next_date = new Date(loanData.start_date);

      for (let schedule = 1; schedule <= loanData.tenor; schedule++) {
        const dueDate = new Date(next_date);

        switch (loanData.tenor_type) {
          case 'WEEK':
            dueDate.setDate(dueDate.getDate() + 7);
            break;
          case 'MONTH':
            dueDate.setMonth(dueDate.getMonth() + 1);
            break;
        }

        const principal_amount = scheduleResult.principal[schedule - 1];
        const interest_amount = scheduleResult.interest[schedule - 1];
        const installment_amount = roundTo2Decimal(principal_amount + interest_amount);

        schedules.push({
          installment_number: schedule,
          from_date: formatDate(next_date),
          to_date: formatDate(dueDate),
          principal_amount,
          interest_amount,
          principal_paid: 0,
          interest_paid: 0,
          principal_outstanding: principal_amount,
          interest_outstanding: interest_amount,
          total_outstanding: installment_amount,
          is_completed: false
        });

        next_date = new Date(dueDate);
        next_date.setDate(next_date.getDate() + 1); // Add 1 day to avoid overlapping dates
      }

      // Create loan with schedules
      const loan = await Loan.create({
        status: 'ACTIVE',
        principal_amount: roundTo2Decimal(loanData.principal_amount),
        interest_amount: totalInterest,
        interest_rate: loanData.interest_rate,
        interest_type: loanData.interest_type,
        tenor: loanData.tenor,
        tenor_type: loanData.tenor_type,
        approval_date: loanData.start_date,
        principal_paid: 0,
        interest_paid: 0,
        principal_outstanding: loanData.principal_amount,
        interest_outstanding: totalInterest,
        total_outstanding: totalRepayable,
        schedules: schedules
      }, {
        include: [{
          model: LoanSchedule,
          as: 'schedules'
        }],
        transaction: t
      });

      await t.commit();
      return loan;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async getLoanById(loanId) {
    const loan = await Loan.findByPk(loanId);
    return loan;
  }

  static async getLoanSchedule(loanId) {
    const schedule = await LoanSchedule.findAll({
      where: { loan_id: loanId },
      order: [['installment_number', 'ASC']],
      attributes: [
        'schedule_id',
        'installment_number',
        'from_date',
        'to_date',
        'principal_amount',
        'interest_amount',
        'principal_paid',
        'interest_paid',
        'principal_outstanding',
        'interest_outstanding',
        'total_outstanding',
        'is_completed'
      ]
    });

    if (!schedule.length) {
      throw new Error('Loan schedule not found');
    }

    return schedule;
  }

  static async getOutstandingBalance(loanId) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      const error = new Error('Loan not found');
      error.status = 404;
      throw error;
    }
    return {
      principal_outstanding: loan.principal_outstanding,
      interest_outstanding: loan.interest_outstanding,
      total_outstanding: loan.total_outstanding
    };
  }

  static async makeRepayment(loanId, amount, transactionDate) {
    const t = await connection.transaction();

    try {
      // Verify if the loan exists
      const loan = await Loan.findByPk(loanId, { transaction: t });

      if (!loan) {
        const error = new Error('Loan not found');
        error.status = 404;
        throw error;
      }

      // Get due schedules
      const dueSchedules = await LoanSchedule.findAll({
        where: {
          loan_id: loanId,
          is_completed: false,
          to_date: {
            [Op.lte]: transactionDate
          }
        },
        order: [['installment_number', 'ASC']],
        transaction: t
      });

      if (!dueSchedules.length) {
        const error = new Error('No due installments found');
        error.status = 400;
        throw error;
      }

      // Calculate total due amount
      dueSchedules.forEach((dt)=> console.log(dt.toJSON().total_outstanding));
      const totalDueAmount = dueSchedules.reduce((sum, schedule) => sum + Number(schedule.toJSON().total_outstanding), 0);

      const roundedTotalDue = roundTo2Decimal(totalDueAmount);
      const roundedAmount = roundTo2Decimal(amount);

      // Validate payment amount
      if (roundedAmount !== roundedTotalDue) {  
        const error = new Error(`Payment amount must exactly match total due amount: ${roundedTotalDue}`);
        error.status = 400;
        throw error;
      }

      // Create transaction
      const transaction = await LoanTransaction.create({
        loan_id: loanId,
        transaction_date: transactionDate,
        total_amount: roundedAmount,
        transaction_type: 'REPAYMENT',
        status: 'COMPLETED'
      }, { transaction: t });

      // Create transaction details and update schedules
      const transactionDetails = [];
      for (const schedule of dueSchedules) {
        // Create transaction detail
        const detail = await LoanTransactionDetail.create({
          transaction_id: transaction.transaction_id,
          schedule_id: schedule.schedule_id,
          principal_amount: parseFloat(schedule.principal_outstanding),
          interest_amount: parseFloat(schedule.interest_outstanding)
        }, { transaction: t });

        transactionDetails.push(detail);

        // Update schedule
        await schedule.update({
          principal_paid: roundTo2Decimal(parseFloat(schedule.principal_paid) + parseFloat(schedule.principal_outstanding)),
          interest_paid: roundTo2Decimal(parseFloat(schedule.interest_paid) + parseFloat(schedule.interest_outstanding)),
          principal_outstanding: 0,
          interest_outstanding: 0,
          total_outstanding: 0,
          is_completed: true
        }, { transaction: t });
      }

      // Update loan totals
      const totalPrincipalPaid = roundTo2Decimal(
        transactionDetails.reduce((sum, detail) => sum + parseFloat(detail.principal_amount), 0)
      );
      const totalInterestPaid = roundTo2Decimal(
        transactionDetails.reduce((sum, detail) => sum + parseFloat(detail.interest_amount), 0)
      );

      await loan.update({
        principal_paid: roundTo2Decimal(parseFloat(loan.principal_paid) + totalPrincipalPaid),
        interest_paid: roundTo2Decimal(parseFloat(loan.interest_paid) + totalInterestPaid),
        principal_outstanding: roundTo2Decimal(parseFloat(loan.principal_outstanding) - totalPrincipalPaid),
        interest_outstanding: roundTo2Decimal(parseFloat(loan.interest_outstanding) - totalInterestPaid),
        total_outstanding: roundTo2Decimal(parseFloat(loan.total_outstanding) - roundedAmount),
        status: roundTo2Decimal(parseFloat(loan.total_outstanding) - roundedAmount) === 0 ? 'COMPLETED' : 'ACTIVE'
      }, { transaction: t });

      await t.commit();

      return {
        transaction_id: transaction.transaction_id,
        total_amount: roundedAmount,
        schedules_paid: dueSchedules.length
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async checkDelinquencyStatus(loanId, isTest = false) {
    try {
      // Get the loan with its schedules
      const loan = await Loan.findByPk(loanId);
      
      if (!loan) {
        const error = new Error('Loan not found');
        error.status = 404;
        throw error;
      }

      // Get current date without time
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Create future test date (2 months ahead)
      const futureTestDate = new Date(currentDate);
      futureTestDate.setMonth(futureTestDate.getMonth() + 2);
      futureTestDate.setHours(0, 0, 0, 0);

      // Use test date if provided, otherwise use current date
      const checkDate = isTest ? futureTestDate : currentDate;
      checkDate.setHours(0, 0, 0, 0);

      // Get all unpaid schedules that are due
      const overdueSchedules = await LoanSchedule.findAll({
        where: {
          loan_id: loanId,
          is_completed: false,
          to_date: {
            [Op.lt]: checkDate
          }
        },
        order: [['installment_number', 'ASC']],
        raw: true
      });

      if (!overdueSchedules.length) {
        return {
          status: 'CURRENT',
          consecutive_overdue: 0,
          overdue_amount: 0,
          overdue_schedules: []
        };
      }

      // Check for consecutive overdue installments
      let consecutiveCount = 1;
      let maxConsecutive = 1;
      let totalOverdueAmount = roundTo2Decimal(Number(overdueSchedules[0].total_outstanding));

      for (let i = 1; i < overdueSchedules.length; i++) {
        const currentSchedule = overdueSchedules[i];
        const previousSchedule = overdueSchedules[i - 1];

        // Check if installment numbers are consecutive
        if (currentSchedule.installment_number === previousSchedule.installment_number + 1) {
          consecutiveCount++;
          if (consecutiveCount > maxConsecutive) {
            maxConsecutive = consecutiveCount;
          }
        } else {
          consecutiveCount = 1;
        }

        totalOverdueAmount = roundTo2Decimal(totalOverdueAmount + Number(currentSchedule.total_outstanding));
      }

      // Determine delinquency status
      const status = maxConsecutive >= 2 ? 'DELINQUENT' : 'OVERDUE';

      return {
        status,
        consecutive_overdue: maxConsecutive,
        overdue_amount: totalOverdueAmount,
        overdue_schedules: overdueSchedules.map(schedule => ({
          installment_number: schedule.installment_number,
          due_date: schedule.to_date,
          amount: Number(schedule.total_outstanding)
        }))
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = LoanService; 