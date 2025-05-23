const LoanService = require('../services/loan.service');

class LoanController {
  static async createLoan(req, res, next) {
    try {
      const loan = await LoanService.createLoan(req.body);
      res.status(201).json(loan);
    } catch (error) {
      next(error);
    }
  }

  static async getLoanSchedule(req, res, next) {
    try {
      const schedule = await LoanService.getLoanSchedule(req.params.loan_id);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }

  static async getOutstandingBalance(req, res, next) {
    try {
      const balance = await LoanService.getOutstandingBalance(req.params.loan_id);
      res.json({ outstanding_balance: balance });
    } catch (error) {
      next(error);
    }
  }

  static async checkDelinquencyStatus(req, res, next) {
    try {
      const status = await LoanService.checkDelinquencyStatus(req.params.loan_id);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req, res, next) {
    try {
      const result = await LoanService.recordPayment(req.params.loan_id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getLoanById(req, res, next) {
    try {
      const loan = await LoanService.getLoanById(req.params.loan_id);
      res.json(loan);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LoanController; 