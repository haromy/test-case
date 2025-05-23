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
      throw new Error('Loan not found');
    }
    return loan.current_outstanding;
  }

  static async makeRepayment(loanId, amount, transactionDate) {
    const t = await connection.transaction();

    try {
      const loan = await Loan.findByPk(loanId, {
        include: [{
          model: LoanSchedule,
          as: 'schedules',
          where: {
            is_completed: false,
            to_date: {
              [Op.lte]: transactionDate
            }
          },
          order: [['installment_number', 'ASC']]
        }],
        transaction: t
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (!loan.schedules.length) {
        throw new Error('No due installments found');
      }

      let remainingAmount = roundTo2Decimal(amount);
      const transactionDetails = [];

      // Create the main transaction record
      const transaction = await LoanTransaction.create({
        loan_id: loanId,
        transaction_date: transactionDate,
        total_amount: amount,
        transaction_type: 'REPAYMENT',
        status: 'PENDING'
      }, { transaction: t });

      // Distribute payment across due installments
      for (const schedule of loan.schedules) {
        if (remainingAmount <= 0) break;

        const totalOutstanding = roundTo2Decimal(schedule.total_outstanding);
        const principalOutstanding = roundTo2Decimal(schedule.principal_outstanding);
        const interestOutstanding = roundTo2Decimal(schedule.interest_outstanding);

        let principalPayment = 0;
        let interestPayment = 0;

        if (remainingAmount >= totalOutstanding) {
          // Full payment for this schedule
          principalPayment = principalOutstanding;
          interestPayment = interestOutstanding;
          remainingAmount = roundTo2Decimal(remainingAmount - totalOutstanding);
        } else {
          // Partial payment - prioritize interest first
          if (remainingAmount >= interestOutstanding) {
            interestPayment = interestOutstanding;
            principalPayment = roundTo2Decimal(remainingAmount - interestOutstanding);
            remainingAmount = 0;
          } else {
            interestPayment = remainingAmount;
            remainingAmount = 0;
          }
        }

        // Create transaction detail
        const detail = await LoanTransactionDetail.create({
          transaction_id: transaction.transaction_id,
          schedule_id: schedule.schedule_id,
          principal_amount: principalPayment,
          interest_amount: interestPayment
        }, { transaction: t });

        transactionDetails.push(detail);

        // Update schedule
        const newPrincipalOutstanding = roundTo2Decimal(principalOutstanding - principalPayment);
        const newInterestOutstanding = roundTo2Decimal(interestOutstanding - interestPayment);
        const newTotalOutstanding = roundTo2Decimal(newPrincipalOutstanding + newInterestOutstanding);

        await schedule.update({
          principal_paid: roundTo2Decimal(schedule.principal_paid + principalPayment),
          interest_paid: roundTo2Decimal(schedule.interest_paid + interestPayment),
          principal_outstanding: newPrincipalOutstanding,
          interest_outstanding: newInterestOutstanding,
          total_outstanding: newTotalOutstanding,
          is_completed: newTotalOutstanding === 0
        }, { transaction: t });

        // Update loan totals
        loan.principal_paid = roundTo2Decimal(loan.principal_paid + principalPayment);
        loan.interest_paid = roundTo2Decimal(loan.interest_paid + interestPayment);
        loan.principal_outstanding = roundTo2Decimal(loan.principal_outstanding - principalPayment);
        loan.interest_outstanding = roundTo2Decimal(loan.interest_outstanding - interestPayment);
        loan.total_outstanding = roundTo2Decimal(loan.principal_outstanding + loan.interest_outstanding);
      }

      // Update loan status if fully paid
      if (loan.total_outstanding === 0) {
        loan.status = 'CLOSED';
      }

      await loan.save({ transaction: t });

      // Update transaction status to completed
      await transaction.update({
        status: 'COMPLETED'
      }, { transaction: t });

      await t.commit();

      return {
        transaction_id: transaction.transaction_id,
        amount_applied: roundTo2Decimal(amount - remainingAmount),
        amount_remaining: remainingAmount,
        details: transactionDetails
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = LoanService; 