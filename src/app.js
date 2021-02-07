require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('starting bot.');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN || '', {
  polling: true,
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello there!');
});
