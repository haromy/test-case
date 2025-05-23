const Joi = require('joi').extend(require('@joi/date'));

const handleValidationErrors = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error);
      return res.status(400).json({
        message: error.message
      });
    }
    next();
  };
};

const handleParamValidation = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        errors: error.details.map(detail => ({
          msg: detail.message,
          param: detail.path[0]
        }))
      });
    }
    next();
  };
};

const createLoanSchema = Joi.object({
  principal_amount: Joi.number().precision(2).positive().required(),
  interest_rate: Joi.number().precision(2).positive().min(0.01).max(100).required(),
  interest_type: Joi.string().valid('FLAT', 'REDUCING').required(),
  tenor: Joi.number().integer().positive().min(1).required(),
  tenor_type: Joi.string().valid('WEEK', 'MONTH', 'YEAR').required(),
  start_date: Joi.date().format('YYYY-MM-DD').required()
});

const recordPaymentSchema = Joi.object({
  payment_date: Joi.date().format('YYYY-MM-DD').required(),
  amount_paid: Joi.number().precision(2).positive().required()
});

const loanIdSchema = Joi.object({
  loan_id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid loan ID format',
      'any.required': 'Loan ID is required'
    })
});

const createLoanValidation = handleValidationErrors(createLoanSchema);
const recordPaymentValidation = [
  handleParamValidation(loanIdSchema),
  handleValidationErrors(recordPaymentSchema)
];
const loanIdValidation = handleParamValidation(loanIdSchema);

module.exports = {
  createLoanValidation,
  recordPaymentValidation,
  loanIdValidation
}; 