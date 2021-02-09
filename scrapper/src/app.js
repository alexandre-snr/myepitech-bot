require('dotenv').config();
const twofactor = require('node-2fa');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const moment = require('moment');

const user = process.argv[2];
const pwd = process.argv[3];
const token = process.argv[4];
const lastCheck = moment(process.argv[5]);
const chatId = process.argv[6];
const year = '2020';

const args = process.env.NODE_ENV === 'production' ? [
  '--no-sandbox',
  '--disable-setuid-sandbox']
  : [];

(async () => {
  console.log('starting scrapping for', user);

  const browser = await puppeteer.launch({
    args,
  });
  const page = await browser.newPage();
  await page.goto('https://my.epitech.eu/');
  await page.click('.mdl-button');
  await page.waitForNavigation();
  await page.type('#i0116', user);
  await page.click('#idSIButton9');
  await page.waitForNavigation();
  await page.waitForNavigation();
  await page.type('#passwordInput', pwd);
  await page.click('#submitButton');
  await page.waitForNavigation();
  await page.waitForSelector('#signInAnotherWay');
  await page.click('#signInAnotherWay');
  await page.waitForSelector('div[data-value="PhoneAppOTP"]');
  await page.click('div[data-value="PhoneAppOTP"]');
  await page.waitForSelector('#idTxtBx_SAOTCC_OTC');
  const newToken = twofactor.generateToken(token);
  await page.type('#idTxtBx_SAOTCC_OTC', newToken.token);
  await page.click('#idSubmit_SAOTCC_Continue');
  await page.waitForNavigation();
  await page.click('#idBtn_Back');
  await page.waitForNavigation();

  const jwt = await page.evaluate(() => localStorage.getItem('argos-elm-openidtoken'));
  await page.close();
  await browser.close();

  console.log('got jwt.');

  const res = await fetch(`https://api.epitest.eu/me/${year}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  const results = await res.json();
  console.log('got', results.length, results.length > 1 ? 'results.' : 'result.');

  const newResults = results.filter((r) => (moment(r.date).isAfter(lastCheck)));
  await Promise.all(newResults.map(async (result) => {
    await fetch(process.env.MESSAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message: `New results for ${result.project.name}`,
      }),
    });
  }));

  console.log(newResults.length, newResults.length > 1 ? 'results' : 'result', 'sent.');

  process.exit(0);
})();
