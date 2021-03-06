require('dotenv').config();
const twofactor = require('node-2fa');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const moment = require('moment');
const { createNodeRedisClient } = require('handy-redis');
const jsonwebtoken = require('jsonwebtoken');

const user = process.argv[2];
const pwd = process.argv[3];
const token = process.argv[4];
const lastCheck = moment(process.argv[5]);
const chatId = process.argv[6];
const year = '2020';

const isJwtValid = (jwt) => {
  const dec = jsonwebtoken.decode(jwt);
  return (dec.exp * 1000 > new Date().getTime());
};

const setJwtCache = async (jwt) => {
  const client = createNodeRedisClient({
    url: process.env.REDIS_URL,
  });
  return client.set(user, jwt);
};

const grabJwt = async () => {
  const args = process.env.NODE_ENV === 'production' ? [
    '--no-sandbox',
    '--disable-setuid-sandbox']
    : [];

  const browser = await puppeteer.launch({ args });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(5000);
  page.setDefaultTimeout(5000);
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
  try {
    await page.waitForSelector('#idTxtBx_SAOTCC_OTC');
  } catch (err) {
    console.error('invalid credentials.');
    process.exit(-1);
  }
  const newToken = twofactor.generateToken(token);
  await page.type('#idTxtBx_SAOTCC_OTC', newToken.token);
  await page.click('#idSubmit_SAOTCC_Continue');
  try {
    await page.waitForNavigation();
  } catch (err) {
    console.error('invalid 2fa secret.');
    process.exit(-1);
  }
  await page.click('#idBtn_Back');
  await page.waitForNavigation();

  const jwt = await page.evaluate(() => localStorage.getItem('argos-elm-openidtoken'));
  await page.close();
  await browser.close();

  await setJwtCache(jwt);

  console.log('jwt grabbed from my.epitech.eu.');

  return jwt;
};

const grabJwtFromCache = async () => {
  const client = createNodeRedisClient({
    url: process.env.REDIS_URL,
  });
  if (!(await client.exists(user))) return null;
  const jwt = await client.get(user);
  if (!isJwtValid(jwt)) return null;
  console.log('jwt grabbed from cache.');
  return jwt;
};

const fetchResults = async (jwt) => {
  const res = await fetch(`https://api.epitest.eu/me/${year}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  return res.json();
};

const resultToString = (result) => {
  let buf = `\n=== ${result.project.name} ===\n`;

  const count = Object.keys(result.results.skills).reduce(
    (acc, key) => acc + result.results.skills[key].count, 0,
  );
  const passed = Object.keys(result.results.skills).reduce(
    (acc, key) => acc + result.results.skills[key].passed, 0,
  );

  buf += `https://my.epitech.eu/index.html#${year}/all/all/${result.results.testRunId}\n`;
  buf += `Coding style:
  Major: ${result.results.externalItems.find((x) => x.type === 'lint.major').value}
  Minor: ${result.results.externalItems.find((x) => x.type === 'lint.minor').value}
  Info : ${result.results.externalItems.find((x) => x.type === 'lint.info').value}
Score: ${Math.round((passed / count) * 10000) / 100}%`;
  return buf;
};

(async () => {
  console.log('starting scrapping for', user);

  try {
    let jwt = await grabJwtFromCache();
    if (jwt == null) jwt = await grabJwt();
    const results = await fetchResults(jwt);

    console.log('got', results.length, results.length > 1 ? 'results.' : 'result.');

    const newResults = results.filter((r) => (moment(r.date).isAfter(lastCheck)));
    if (newResults.length === 0) {
      console.log('no new result.');
      process.exit(0);
    }

    const message = `New results:${newResults.reduce((acc, val) => `${acc}\n${resultToString(val)}`, '')}`;
    await fetch(process.env.MESSAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    console.log(newResults.length, newResults.length > 1 ? 'results' : 'result', 'sent.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
})();
