'use strict';
const { v4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'application_types',
      [
        {
          id: v4(),
          type: 'React',
          picture: 'react.png',
        },
        {
          id: v4(),
          type: 'Node.js',
          picture: 'nodejs.png',
        },
        {
          id: v4(),
          type: 'Angular',
          picture: 'angular.png',
        },
        {
          id: v4(),
          type: 'Vue.js',
          picture: 'vue.png',
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
