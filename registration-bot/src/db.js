const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
});

const Registration = sequelize.define('registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  twofactor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'registrations',
  timestamps: false,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('connected to database.');
  } catch (error) {
    console.error('could not connect to database: ', error);
    process.exit(-1);
  }
})();

const isEmailAvailable = async (email) => (await Registration.count({
  where: {
    email,
  },
})) === 0;

const addRegistration = async (details) => Registration.create({
  email: details.email,
  password: details.password,
  twofactor: details['2fa'],
});

module.exports = {
  isEmailAvailable,
  addRegistration,
};
