const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/conn');

class LoanSchedule extends Model {}

LoanSchedule.init({
  schedule_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  loan_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'loans',
      key: 'loan_id'
    }
  },
  installment_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  from_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  to_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  principal_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  interest_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  principal_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  interest_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  principal_outstanding: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  interest_outstanding: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_outstanding: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  },
  updated_at: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  deleted_at: {
    allowNull: true,
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'LoanSchedule',
  tableName: 'loan_schedules',
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = LoanSchedule;