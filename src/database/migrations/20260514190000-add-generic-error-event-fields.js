'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('errors-logs', 'environment', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'framework', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'language', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'runtime', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'level', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'fingerprint', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'handled', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'timestamp', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'release', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'transaction', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'user', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'request', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'tags', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'extra', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'breadcrumbs', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('errors-logs', 'contexts', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addIndex('errors-logs', ['applicationId']);
    await queryInterface.addIndex('errors-logs', ['environment']);
    await queryInterface.addIndex('errors-logs', ['level']);
    await queryInterface.addIndex('errors-logs', ['timestamp']);
    await queryInterface.addIndex('errors-logs', ['createdAt']);
    await queryInterface.addIndex('errors-logs', ['fingerprint']);
    await queryInterface.addIndex('errors-logs', ['framework']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('errors-logs', ['framework']);
    await queryInterface.removeIndex('errors-logs', ['fingerprint']);
    await queryInterface.removeIndex('errors-logs', ['createdAt']);
    await queryInterface.removeIndex('errors-logs', ['timestamp']);
    await queryInterface.removeIndex('errors-logs', ['level']);
    await queryInterface.removeIndex('errors-logs', ['environment']);
    await queryInterface.removeIndex('errors-logs', ['applicationId']);

    await queryInterface.removeColumn('errors-logs', 'contexts');
    await queryInterface.removeColumn('errors-logs', 'breadcrumbs');
    await queryInterface.removeColumn('errors-logs', 'extra');
    await queryInterface.removeColumn('errors-logs', 'tags');
    await queryInterface.removeColumn('errors-logs', 'request');
    await queryInterface.removeColumn('errors-logs', 'user');
    await queryInterface.removeColumn('errors-logs', 'transaction');
    await queryInterface.removeColumn('errors-logs', 'url');
    await queryInterface.removeColumn('errors-logs', 'release');
    await queryInterface.removeColumn('errors-logs', 'timestamp');
    await queryInterface.removeColumn('errors-logs', 'handled');
    await queryInterface.removeColumn('errors-logs', 'fingerprint');
    await queryInterface.removeColumn('errors-logs', 'name');
    await queryInterface.removeColumn('errors-logs', 'level');
    await queryInterface.removeColumn('errors-logs', 'runtime');
    await queryInterface.removeColumn('errors-logs', 'language');
    await queryInterface.removeColumn('errors-logs', 'framework');
    await queryInterface.removeColumn('errors-logs', 'environment');
  },
};
