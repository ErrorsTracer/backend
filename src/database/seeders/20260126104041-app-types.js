'use strict';

const REACT_APP_TYPE_ID = '11111111-1111-4111-8111-111111111111';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'application_types',
      [
        {
          id: REACT_APP_TYPE_ID,
          type: 'React',
          picture: 'react.png',
        },
        // {
        //   id: v4(),
        //   type: 'Node.js',
        //   picture: 'nodejs.png',
        // },
        // {
        //   id: v4(),
        //   type: 'Angular',
        //   picture: 'angular.png',
        // },
        // {
        //   id: v4(),
        //   type: 'Vue.js',
        //   picture: 'vue.png',
        // },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('application_types', {
      id: REACT_APP_TYPE_ID,
    });
  },
};
