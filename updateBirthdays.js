import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import path from 'path';
import { fileURLToPath } from 'url';

const relativePath = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(relativePath + '/.env'),
});

dayjs.extend(dayOfYear);
dayjs.extend(customParseFormat);

const updateBirthdays = async function () {
  try {
    console.log('Updating bdays...');
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const jwt = new JWT({
      email: process.env['GOOGLE_CLIENT_EMAIL'],
      key: process.env['GOOGLE_PRIVATE_KEY'].replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    // doc ID
    const doc = new GoogleSpreadsheet(process.env['GOOGLE_SPREADSHEET'], jwt);

    await doc.loadInfo(); // loads document properties and worksheets
    const otherSheet = doc.sheetsById[process.env['GOOGLE_SHEET_ID']]; // accessible via ID if you already know it

    // read rows
    const sheetRows = await otherSheet.getRows(); // can pass in { limit, offset }

    const users = sheetRows.map((element) => {
      const day = parseInt(element.get('day'), 10);
      const month = parseInt(element.get('month'), 10);
      const dayNumber = dayjs(`${month} ${day}`, 'M D').dayOfYear();

      return {
        name: element.get('name'),
        gender: element.get('gender'),
        day,
        month,
        daynumber: dayNumber,
      };
    });

    await fs.writeFile(
      path.join(relativePath, '/bdays.json'),
      JSON.stringify(users),
      (err) => {
        if (err) console.log(err);
        else {
          console.log('File written successfully\n');
        }
      }
    );

    return 'bdays updated';
  } catch (error) {
    console.error('Error:', error.message);
    return 'Error:' + error.message;
  }
};

export default updateBirthdays;
