var DataTypes = require("sequelize").DataTypes;
var _registrations = require("./registrations");

function initModels(sequelize) {
  var registrations = _registrations(sequelize, DataTypes);


  return {
    registrations,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
