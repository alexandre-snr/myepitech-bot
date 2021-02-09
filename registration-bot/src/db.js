const { Sequelize, DataTypes } = require('sequelize');
const crypto = require('crypto');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
});

const Registration = require('./models/registrations')(sequelize, DataTypes);

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

const cipherPassword = (password) => {
  const algorithm = 'aes-192-cbc';
  const key = crypto.scryptSync(process.env.SECRET, process.env.SALT, 24);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  return iv.toString('hex') + cipher.update(password, 'utf8', 'hex') + cipher.final('hex');
};

const addRegistration = async (details) => Registration.create({
  email: details.email,
  password: cipherPassword(details.password),
  twofactor: cipherPassword(details.twofactor),
  chatid: details.chatid,
  lastcheck: Date.now(),
});

module.exports = {
  isEmailAvailable,
  addRegistration,
};
