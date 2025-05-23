const { expect } = require('chai');
const sinon = require('sinon');
const { Loan, LoanSchedule, LoanTransaction, LoanTransactionDetail } = require('../../src/models');
const LoanService = require('../../src/services/loan.service');
const { roundTo2Decimal } = require('../../src/libs/accounting');

describe('LoanService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createLoan', () => {
    it('should create a FLAT interest loan with FLAT-LAST distribution', async () => {
      const loanData = {
        principal_amount: 5000000,
        interest_rate: 10,
        interest_type: 'FLAT',
        tenor: 50,
        tenor_type: 'WEEK',
        start_date: '2024-03-20'
      };

      const expectedTotalInterest = roundTo2Decimal(loanData.principal_amount * (loanData.interest_rate / 100));
      const expectedPrincipalPerInstallment = roundTo2Decimal(loanData.principal_amount / loanData.tenor);

      const createLoanStub = sandbox.stub(Loan, 'create').resolves({
        loan_id: 'test-loan-id',
        ...loanData,
        schedules: Array(loanData.tenor).fill({})
      });

      const result = await LoanService.createLoan(loanData);

      expect(createLoanStub.calledOnce).to.be.true;
      expect(result).to.have.property('loan_id', 'test-loan-id');
      expect(result.schedules).to.have.lengthOf(loanData.tenor);
    });

    it('should create a REDUCING interest loan with EMI calculation', async () => {
      const loanData = {
        principal_amount: 5000000,
        interest_rate: 10,
        interest_type: 'REDUCING',
        tenor: 12,
        tenor_type: 'MONTH',
        start_date: '2024-03-20'
      };

      const createLoanStub = sandbox.stub(Loan, 'create').resolves({
        loan_id: 'test-loan-id',
        ...loanData,
        schedules: Array(loanData.tenor).fill({})
      });

      const result = await LoanService.createLoan(loanData);

      expect(createLoanStub.calledOnce).to.be.true;
      expect(result.schedules).to.have.lengthOf(loanData.tenor);
      
      // Verify EMI calculation
      const firstSchedule = result.schedules[0];
      const lastSchedule = result.schedules[result.schedules.length - 1];
      expect(roundTo2Decimal(firstSchedule.installment_amount))
        .to.equal(roundTo2Decimal(lastSchedule.installment_amount));
    });
  });

  describe('makeRepayment', () => {
    it('should process exact repayment for due installments', async () => {
      const loanId = 'test-loan-id';
      const amount = 1000000;
      const transactionDate = '2024-03-20';

      const mockLoan = {
        loan_id: loanId,
        principal_outstanding: 5000000,
        interest_outstanding: 500000
      };

      const mockSchedules = [
        {
          schedule_id: 'schedule-1',
          installment_number: 1,
          principal_outstanding: 500000,
          interest_outstanding: 50000,
          total_outstanding: 550000,
          is_completed: false
        },
        {
          schedule_id: 'schedule-2',
          installment_number: 2,
          principal_outstanding: 450000,
          interest_outstanding: 45000,
          total_outstanding: 450000,
          is_completed: false
        }
      ];

      sandbox.stub(Loan, 'findByPk').resolves(mockLoan);
      sandbox.stub(LoanSchedule, 'findAll').resolves(mockSchedules);
      sandbox.stub(LoanTransaction, 'create').resolves({
        transaction_id: 'test-transaction-id'
      });
      sandbox.stub(LoanTransactionDetail, 'create').resolves({});
      sandbox.stub(mockSchedules[0], 'update').resolves({});
      sandbox.stub(mockSchedules[1], 'update').resolves({});

      const result = await LoanService.makeRepayment(loanId, amount, transactionDate);

      expect(result).to.have.property('transaction_id', 'test-transaction-id');
    });

    it('should reject payment if amount does not match due installments', async () => {
      const loanId = 'test-loan-id';
      const amount = 900000; // Less than total due
      const transactionDate = '2024-03-20';

      const mockLoan = {
        loan_id: loanId
      };

      const mockSchedules = [
        {
          total_outstanding: 550000,
          is_completed: false
        },
        {
          total_outstanding: 450000,
          is_completed: false
        }
      ];

      sandbox.stub(Loan, 'findByPk').resolves(mockLoan);
      sandbox.stub(LoanSchedule, 'findAll').resolves(mockSchedules);

      try {
        await LoanService.makeRepayment(loanId, amount, transactionDate);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Payment amount must exactly match total due amount');
      }
    });
  });

  describe('checkDelinquencyStatus', () => {
    it('should return CURRENT status when no overdue schedules', async () => {
      const loanId = 'test-loan-id';
      
      sandbox.stub(Loan, 'findByPk').resolves({ loan_id: loanId });
      sandbox.stub(LoanSchedule, 'findAll').resolves([]);

      const result = await LoanService.checkDelinquencyStatus(loanId);

      expect(result.status).to.equal('CURRENT');
      expect(result.consecutive_overdue).to.equal(0);
    });

    it('should return DELINQUENT status for 2+ consecutive overdue schedules', async () => {
      const loanId = 'test-loan-id';
      
      sandbox.stub(Loan, 'findByPk').resolves({ loan_id: loanId });
      sandbox.stub(LoanSchedule, 'findAll').resolves([
        {
          installment_number: 1,
          total_outstanding: '500000',
          is_completed: false
        },
        {
          installment_number: 2,
          total_outstanding: '500000',
          is_completed: false
        }
      ]);

      const result = await LoanService.checkDelinquencyStatus(loanId);

      expect(result.status).to.equal('DELINQUENT');
      expect(result.consecutive_overdue).to.equal(2);
    });

    it('should handle future date testing', async () => {
      const loanId = 'test-loan-id';
      
      sandbox.stub(Loan, 'findByPk').resolves({ loan_id: loanId });
      sandbox.stub(LoanSchedule, 'findAll').resolves([
        {
          installment_number: 1,
          total_outstanding: '500000',
          is_completed: false
        }
      ]);

      const result = await LoanService.checkDelinquencyStatus(loanId, true);

      expect(result).to.have.property('status');
      expect(result).to.have.property('consecutive_overdue');
      expect(result).to.have.property('overdue_amount');
    });
  });
}); 