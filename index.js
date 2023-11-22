import dotenv from 'dotenv';
import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { fileURLToPath } from 'url';
import prepareMessage from './prepareMessage.js';
import updateBirthdays from './updateBirthdays.js';

const relativePath = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(relativePath + '/.env'),
});

const IS_PC = process.env['NAME'];

const TOKEN = IS_PC
  ? process.env['PRIVATE_BOT_TOKEN']
  : process.env['CHANNEL_BOT_TOKEN'];

const CHAT_ID = IS_PC
  ? process.env['PRIVATE_CHAT_ID']
  : process.env['CHANNEL_CHAT_ID'];

const PROJECT_NAME = process.env['PROJECT_NAME'];

const CRON_UPDATE_SCHEDULE = '0 5 * * 1'; // At 05:00 on Monday.
const CRON_SEND_SCHEDULE = '0 6 * * 1'; // At 06:00 on Monday.

const cronJob = async function () {
  await prepareMessage(PROJECT_NAME).then((res) => {
    bot.sendMessage(CHAT_ID, res, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  });
};

const bot = new TelegramBot(TOKEN, {
  polling: true,
});

cron.schedule(CRON_UPDATE_SCHEDULE, updateBirthdays);
cron.schedule(CRON_SEND_SCHEDULE, cronJob);

bot.on('left_chat_member', (msg) => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
});

bot.on('new_chat_members', (msg) => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
});

bot.onText(/\/send/, () => {
  cronJob();
});

bot.onText(/\/update/, async (msg) => {
  await updateBirthdays().then((res) => {
    bot.sendMessage(msg.chat.id, res);
  });
});

bot.onText(/\/msg/, async (msg) => {
  await prepareMessage(PROJECT_NAME).then((res) => {
    bot.sendMessage(msg.chat.id, res, {
      disable_notification: true,
    });
  });
});
