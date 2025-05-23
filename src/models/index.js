const connection = require('../config/conn');
const Loan = require('./loan');
const LoanSchedule = require('./loan-schedule');
const LoanTransaction = require('./loan-transaction');

// Define associations
Loan.hasMany(LoanSchedule, {
  foreignKey: 'loan_id',
  as: 'schedules'
});

LoanSchedule.belongsTo(Loan, {
  foreignKey: 'loan_id',
  as: 'loan'
});

module.exports = {
  connection: connection,
  Loan,
  LoanSchedule,
  LoanTransaction
}