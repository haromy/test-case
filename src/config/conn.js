const { Sequelize } = require('sequelize');

const {
  DB_HOST,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_PORT,
  DB_DIALECT
} = process.env;

const connection = new Sequelize(
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    dialectOptions: {
      decimalNumbers: true,
    },
    logging: true,
    pool: {
      min: 2,
      max: 4,
      acquire: 3000,
      idle: 5000,
      evict: 25000,
    },
  }
);

module.exports = connection;
