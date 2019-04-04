const express = require('express');
const puppeteer = require('puppeteer');
const {PendingXHR} = require('pending-xhr-puppeteer');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

const boxUrls = require('./boxUrls.json');

let status = 'RUNNING';
let result = {};
let errors = [];

app.get('/status', function (req, res) {
    res.send(status);
});

app.get('/result', function (req, res) {
    res.send(result);
});

app.get('/errors', function (req, res) {
    res.send(errors);
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

console.log('Environment:');
console.log('--BATCH_INDEX', process.env['BATCH_INDEX']);
console.log('--BATCH_SIZE', process.env['BATCH_SIZE']);
console.log('--CHROME_EXECUTABLE_PATH', process.env['CHROME_EXECUTABLE_PATH']);
const batchSize = parseInt(process.env['BATCH_SIZE'], 10);
const batchIndex = parseInt(process.env['BATCH_INDEX'], 10);
const chromeExecutablePath = process.env['CHROME_EXECUTABLE_PATH'];

const boxCount = Object.keys(boxUrls).length;
const startIndex = batchSize * batchIndex;
const endIndex = Math.min(startIndex + batchSize, boxCount);

if (startIndex <= endIndex) {
    startBatchProcess(startIndex, endIndex);
} else {
    status = 'DONE'
}

function startBatchProcess(startIndex, endIndex) {
    let sandikCount = endIndex - startIndex;
    console.log('Start and end indices', startIndex, endIndex);

    const boxNames = Object.keys(boxUrls);
    const boxNamesToProcess = boxNames.slice(startIndex, endIndex);

    (async () => {
        const browser = await puppeteer.launch({
            executablePath: chromeExecutablePath || undefined,
            headless: true, args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });
        let counter = 0;
        for (let boxName of boxNamesToProcess) {
            counter++;
            console.log(new Date(), 'Reading box: ' + boxName + '      ' + counter + '/' + sandikCount);
            try {
                const boxUrl = buildBoxUrl(boxName);
                const boxResults = await getBoxResults(browser, boxName, boxUrl);
                console.log('Successfully fetched box results for box', boxName);
                result[boxName] = boxResults;
            } catch (ex) {
                console.log('Error fetching box results for box', boxName);
                console.log(ex);
                errors.push(boxName);
            }
        }
        await browser.close();

        status = 'DONE';
    })();
}

function buildBoxUrl(boxName) {
    return 'https://sts.chp.org.tr/SonucDetay.aspx?cmd=' + boxUrls[boxName];
}

async function getBoxResults(browser, name, url) {
    console.log('Going to read box results for', name, url);

    const boxResults = {
        name: name,
        url: url
    };

    const page = await browser.newPage();
    const pendingXHR = new PendingXHR(page);

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });

    await page.goto(url, {waitUntil: 'networkidle2'});
    await page.waitForSelector('.chp-vote-row');
    boxResults['A'] = parseBoxPageHtml(await page.content());


    await page.evaluate(() => {
        return document.querySelector('#btn3').click();
    });
    await pendingXHR.waitForAllXhrFinished();
    await page.waitForNavigation({waitUntil: 'domcontentloaded'});
    await page.waitFor(100);
    boxResults['B'] = parseBoxPageHtml(await page.content());


    await page.evaluate(() => {
        document.querySelector('#btn6').click();
    });
    await pendingXHR.waitForAllXhrFinished();
    await page.waitForNavigation({waitUntil: 'domcontentloaded'});
    await page.waitFor(100);
    boxResults['C'] = parseBoxPageHtml(await page.content());

    await page.close();

    return boxResults;
}

function parseBoxPageHtml(content) {
    const $ = cheerio.load(content);
    const voteRows = $('.chp-vote-fields-container').find('.chp-vote-row');
    const votes = {};
    voteRows.each(function () {
        const input = $(this).find('input');
        votes[input.attr('name')] = input.val();
    });

    const infoRows = $('.chp-vote-fields-container .chp-crate-info').find('.chp-info-row');
    const info = {};
    infoRows.each(function () {
        const input = $(this).find('input');
        info[input.attr('name')] = input.val();
    });

    info['lblIlIlceBaslik'] = $('#lblIlIlceBaslik').html();
    info['lblMvOzetSandikAlani'] = $('#lblMvOzetSandikAlani').html();
    info['lblMvGelisZamani'] = $('#lblMvGelisZamani').html();

    return {votes: votes, info: info};
}

