'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loan_transactions', {
      transaction_id: {
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
      transaction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      transaction_type: {
        type: Sequelize.ENUM('REPAYMENT', 'DISBURSEMENT'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
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
    await queryInterface.addIndex('loan_transactions', ['loan_id']);
    await queryInterface.addIndex('loan_transactions', ['transaction_date']);
    await queryInterface.addIndex('loan_transactions', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loan_transactions');
  }
}; 