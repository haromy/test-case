const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LoanTransactionDetail extends Model {
    static associate(models) {
      LoanTransactionDetail.belongsTo(models.LoanTransaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });

      LoanTransactionDetail.belongsTo(models.LoanSchedule, {
        foreignKey: 'schedule_id',
        as: 'schedule'
      });
    }
  }

  LoanTransactionDetail.init({
    detail_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    principal_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    interest_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'LoanTransactionDetail',
    tableName: 'loan_transaction_details',
    paranoid: true,
    underscored: true
  });

  return LoanTransactionDetail;
}; 