/**
 * Poll.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    // id: {
    //   autoIncrement: true,
    //   primaryKey: true,
    //   columnName: 'pollId'
    // },
    title: {
      type: 'string'
    },
    options: {
      type: 'array'
    },
    votes: {
      type: 'array'
    },
    voters: {
      type: 'array',
      defaultsTo: []
    },
    url: {
      type: 'string'
    },

    // Add a reference to User
    owner: {
      model: 'user'
    }
  }
};
