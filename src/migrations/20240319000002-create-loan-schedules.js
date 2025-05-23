'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loan_schedules', {
      schedule_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'loan_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      installment_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      from_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      to_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      principal_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      principal_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      interest_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      principal_outstanding: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_outstanding: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      total_outstanding: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('loan_schedules', ['loan_id', 'installment_number'], {
      unique: true
    });
    await queryInterface.addIndex('loan_schedules', ['is_completed']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loan_schedules');
  }
}; 