const connection = require('../config/conn');
const Loan = require('./loan');
const LoanSchedule = require('./loan-schedule');
const LoanTransaction = require('./loan-transaction');
const LoanTransactionDetail = require('./loan-transaction-detail');

// Define associations
Loan.hasMany(LoanSchedule, {
  foreignKey: 'loan_id',
  as: 'schedules'
});

LoanSchedule.belongsTo(Loan, {
  foreignKey: 'loan_id',
  as: 'loan'
});

LoanSchedule.hasOne(LoanTransactionDetail, {
  foreignKey: 'schedule_id',
  as: 'detail'
});

LoanTransaction.hasMany(LoanTransactionDetail, {
  foreignKey: 'transaction_id',
  as: 'details'
});

LoanTransactionDetail.belongsTo(LoanTransaction, {
  foreignKey: 'transaction_id',
  as: 'transaction'
});

LoanTransactionDetail.belongsTo(LoanSchedule, {
  foreignKey: 'schedule_id',
  as: 'schedule'
});

module.exports = {
  connection: connection,
  Loan,
  LoanSchedule,
  LoanTransaction,
  LoanTransactionDetail
}