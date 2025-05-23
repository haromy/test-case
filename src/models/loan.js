const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/conn');

class Loan extends Model {
  static associate(models) {
    Loan.hasMany(models.LoanSchedule, {
      foreignKey: 'loan_id',
      as: 'schedules'
    });

    Loan.hasMany(models.LoanTransaction, {
      foreignKey: 'loan_id',
      as: 'transactions'
    });
  }
}

Loan.init({
  loan_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  principal_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  interest_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  interest_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  interest_type: {
    type: DataTypes.ENUM('FLAT', 'REDUCING'),
    allowNull: false
  },
  tenor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tenor_type: {
    type: DataTypes.ENUM('WEEK', 'MONTH'),
    allowNull: false
  },
  approval_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  principal_paid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  interest_paid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  principal_outstanding: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  interest_outstanding: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total_outstanding: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
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
  modelName: 'Loan',
  tableName: 'loans',
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Loan;