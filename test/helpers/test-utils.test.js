const { roundTo2Decimal } = require('../../src/libs/accounting');

const createMockLoan = (overrides = {}) => {
  return {
    loan_id: 'test-loan-id',
    principal_amount: 5000000,
    interest_rate: 10,
    interest_type: 'FLAT',
    tenor: 50,
    tenor_type: 'WEEK',
    start_date: '2024-03-20',
    status: 'ACTIVE',
    principal_paid: 0,
    interest_paid: 0,
    principal_outstanding: 5000000,
    interest_outstanding: 500000,
    total_outstanding: 5500000,
    ...overrides
  };
};

const createMockSchedule = (installmentNumber, overrides = {}) => {
  const principal = 100000;
  const interest = 10000;
  
  return {
    schedule_id: `schedule-${installmentNumber}`,
    loan_id: 'test-loan-id',
    installment_number: installmentNumber,
    from_date: '2024-03-20',
    to_date: '2024-03-27',
    principal_amount: principal,
    interest_amount: interest,
    principal_paid: 0,
    interest_paid: 0,
    principal_outstanding: principal,
    interest_outstanding: interest,
    total_outstanding: principal + interest,
    is_completed: false,
    ...overrides
  };
};

const createMockTransaction = (overrides = {}) => {
  return {
    transaction_id: 'test-transaction-id',
    loan_id: 'test-loan-id',
    transaction_date: '2024-03-20',
    total_amount: 110000,
    transaction_type: 'REPAYMENT',
    status: 'COMPLETED',
    ...overrides
  };
};

const createMockTransactionDetail = (overrides = {}) => {
  return {
    detail_id: 'test-detail-id',
    transaction_id: 'test-transaction-id',
    schedule_id: 'test-schedule-id',
    principal_amount: 100000,
    interest_amount: 10000,
    ...overrides
  };
};

const calculateEMI = (principal, annualRate, tenor) => {
  const monthlyRate = (annualRate / 100) / 12;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenor) / (Math.pow(1 + monthlyRate, tenor) - 1);
  return roundTo2Decimal(emi);
};

const calculateFlatInterest = (principal, annualRate) => {
  return roundTo2Decimal(principal * (annualRate / 100));
};

module.exports = {
  createMockLoan,
  createMockSchedule,
  createMockTransaction,
  createMockTransactionDetail,
  calculateEMI,
  calculateFlatInterest
}; 