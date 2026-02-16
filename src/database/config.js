'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const dotenv = require('dotenv');
const basename = path.basename(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configs = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'postgres',
};

module.exports = {
  development: configs,
  test: configs,
  production: configs,
};
