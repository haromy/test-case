const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LoanTransaction extends Model {
    static associate(models) {
      LoanTransaction.belongsTo(models.Loan, {
        foreignKey: 'loan_id',
        as: 'loan'
      });

      LoanTransaction.hasMany(models.LoanTransactionDetail, {
        foreignKey: 'transaction_id',
        as: 'details'
      });
    }
  }

  LoanTransaction.init({
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    loan_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('REPAYMENT', 'DISBURSEMENT'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'LoanTransaction',
    tableName: 'loan_transactions',
    paranoid: true,
    underscored: true
  });

  return LoanTransaction;
};