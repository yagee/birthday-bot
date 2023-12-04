import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dayjs.extend(isBetween);

const relativePath = path.dirname(fileURLToPath(import.meta.url));

const emojis = [
  '🐣',
  '🥳',
  '🌸',
  '🌺',
  '💐',
  '🌹',
  '✨',
  '🍭',
  '🍰',
  '🧁',
  '🍾',
  '👏🏼',
];

const months = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomEmoji() {
  const pos = getRandomInt(0, emojis.length);
  return emojis[pos];
}

const prepareMessage = async function (PROJECT_NAME) {
  try {
    const greetingsMessage = `\nПривет, ${PROJECT_NAME}!\n\n🎂 На этой неделе день рождения`;
    const singular = ` празднует:\n`;
    const plural = ` празднуют:\n`;

    console.log('Running cron job...');
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    // Read the JSON file
    const jsonData = fs.readFileSync(
      path.join(relativePath, '/bdays.json'),
      'utf8'
    );

    const people = JSON.parse(jsonData);

    // Get the current date
    const today = dayjs();
    const currentDayOfWeek = today.day();

    // Calculate the start and end dates of the next week
    const daysUntilMonday = (currentDayOfWeek + 6) % 7; // To start from Monday
    const nextWeekStart = today.add(daysUntilMonday, 'day');
    const nextWeekEnd = nextWeekStart.add(6, 'day');

    // Filter people whose birthdays are in the next week
    const peopleInNextWeek = people.filter(({ month, day }) => {
      const personBirthday = dayjs(
        `${today.year()} ${month} ${day}`,
        'YYYY M D'
      );
      return personBirthday.isBetween(nextWeekStart, nextWeekEnd, 'day', '[]');
    });

    peopleInNextWeek.sort((a, b) => a.daynumber - b.daynumber);

    // Create a map of days to names
    const dayToNames = peopleInNextWeek.reduce((map, { day, name }) => {
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day).push(name);
      return map;
    }, new Map());

    console.log(dayToNames);

    const mess =
      dayToNames.length > 1
        ? greetingsMessage + plural
        : greetingsMessage + singular;

    // Use dayToNames directly in final message creation
    const finalMessage = Array.from(dayToNames, ([day, names], index) => {
      const namesString = names.length < 2 ? names[0] : names.join(' и ');
      return `\n${randomEmoji()} <b>${day} ${
        months[peopleInNextWeek[index].month - 1]
      }:</b>\n${namesString}`;
    }).join('\n');

    if (finalMessage) {
      console.log(mess + finalMessage);
      // bot.sendMessage(CHAT_ID, mess + finalMessage, {
      //   parse_mode: 'HTML',
      // });

      return mess + finalMessage;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error running cron job:', error);
  }
};

export default prepareMessage;
