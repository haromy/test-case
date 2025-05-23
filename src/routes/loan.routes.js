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

// Get loan schedule
router.get(
  '/loans/:loan_id/schedule',
  loanIdValidation,
  LoanController.getLoanSchedule
);

// Record a repayment
router.post(
  '/loans/:loan_id/repayment',
  recordPaymentValidation,
  LoanController.recordPayment
);

router.get(
  '/loans/:loan_id/outstanding',
  loanIdValidation,
  LoanController.getOutstandingBalance
);

router.get(
  '/loans/:loan_id/delinquency',
  loanIdValidation,
  LoanController.checkDelinquencyStatus
);

module.exports = router; 