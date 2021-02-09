const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('registrations', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(256),
      allowNull: false,
      unique: "registrations_email_key"
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    twofactor: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    lastcheck: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'registrations',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "registrations_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "registrations_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
