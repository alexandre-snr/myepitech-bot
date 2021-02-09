const twofactor = require('node-2fa');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const user = process.argv[2];
const pwd = process.argv[3];
const token = process.argv[4];
const year = '2020';

(async () => {
    const browser = await puppeteer.launch({
        headless: false
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

    const res = await fetch('https://api.epitest.eu/me/' + year, {
        headers: {
            'Authorization': 'Bearer ' + jwt,
        }
    });
    console.log(await res.json());

    await browser.close();
 })();