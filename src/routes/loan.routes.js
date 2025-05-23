const express = require('express');
const LoanController = require('../controllers/loan.controller');
const { 
  createLoanValidation, 
  recordPaymentValidation, 
  loanIdValidation 
} = require('../middleware/validation');

const router = express.Router();

// Create a new loan schedule
router.post(
  '/loans/create-schedule',
  createLoanValidation,
  LoanController.createLoan
);

router.get(
  '/loans/:loan_id',
  loanIdValidation,
  LoanController.getLoanById
);

// Record a repayment
router.post(
  '/loans/:loan_id/repayment',
  recordPaymentValidation,
  LoanController.recordPayment
);

// Get loan schedule
router.get(
  '/loans/:loan_id/schedule',
  loanIdValidation,
  LoanController.getLoanSchedule
);

// Get outstanding balance
router.get(
  '/loans/:loan_id/outstanding',
  loanIdValidation,
  LoanController.getOutstandingBalance
);

// Check delinquency status
router.get(
  '/loans/:loan_id/delinquency_status',
  loanIdValidation,
  LoanController.checkDelinquencyStatus
);

module.exports = router; 