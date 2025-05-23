'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loans', {
      loan_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'COMPLETED'),
        defaultValue: 'ACTIVE'
      },
      principal_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      interest_type: {
        type: Sequelize.ENUM('FLAT', 'REDUCING'),
        allowNull: false
      },
      tenor: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tenor_type: {
        type: Sequelize.ENUM('WEEK', 'MONTH'),
        allowNull: false
      },
      approval_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
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
    await queryInterface.addIndex('loans', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loans');
  }
}; 