require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const {
  WAITING_FOR_EMAIL, WAITING_FOR_PASSWORD, WAITING_FOR_2FA, REGISTERED,
} = require('./constants');

const QAcache = [];
const users = [];

console.log('starting bot.');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN || '', {
  polling: true,
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Please type in your Epitech mail.');
  QAcache.push({
    id: msg.chat.id,
    state: WAITING_FOR_EMAIL,
  });
});

bot.on('message', (msg) => {
  if (msg.text == null || msg.text.startsWith('/')) return;

  const QAindex = QAcache.findIndex((x) => x.id === msg.chat.id);
  if (QAindex == null) {
    bot.sendMessage(msg.chat.id, 'Please use /start to begin.');
    return;
  }

  switch (QAcache[QAindex].state) {
    case WAITING_FOR_EMAIL:
      bot.sendMessage(msg.chat.id, 'Please type in your password.');
      QAcache[QAindex] = {
        ...QAcache[QAindex],
        state: WAITING_FOR_PASSWORD,
        email: msg.text,
      };
      break;

    case WAITING_FOR_PASSWORD:
      bot.sendMessage(msg.chat.id, 'Please type in your 2FA token.');
      QAcache[QAindex] = {
        ...QAcache[QAindex],
        state: WAITING_FOR_2FA,
        password: msg.text,
      };
      break;

    case WAITING_FOR_2FA:
      bot.sendMessage(msg.chat.id, 'You are now registered.');
      users.push({
        ...QAcache[QAindex],
        '2fa': msg.text,
        state: REGISTERED,
      });
      QAcache.splice(QAindex, 1);
      break;

    default:
      bot.sendMessage(msg.chat.id, 'Unknown state. Please use /start to begin.');
      break;
  }
});