/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-alert */
/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3001;

const app = express();

async function retry(promiseFactory, retryCount) {
  try {
    return await promiseFactory();
  } catch (error) {
    if (retryCount <= 0) {
      throw error;
    }
    return await retry(promiseFactory, retryCount - 1);
  }
}

app.get('/categories', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.goodreads.com/choiceawards/best-books-2020');

    const books = await page.$$eval('.category__winnerImage', (items) => items.map((item) => item.alt));
    const categories = await page.$$eval('.category__copy', (items) => items.map((item) => item.innerText.trim()));
    const allLinks = await page.$$eval('.category.clearFix > a', (links) => links.map((link) => link.href));

    const authorNames = [];

    // it takes lots of time to get all author names on separate pages
    for (const link of allLinks) {
      const tempPage = await browser.newPage();
      await tempPage.goto(link);

      const authorName = await tempPage.$eval(
        '.authorName',
        (name) => name.innerText,
      );
      authorNames.push(authorName);
      await tempPage.close();
    }

    const categoriesWithData = categories.map((category, index) => ({
      category,
      book: books[index],
      authorName: authorNames[index],
    }));

    await browser.close();

    res.send(categoriesWithData);
  } catch (error) {
    console.log('categories error', error);
  }
});

app.get('/amazon-search', async (req) => {
  const { book, authorName } = req.query;

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=2400,1239'],
  });

  try {
    const pages = await browser.pages();
    const page = pages[0];
    await page.goto('https://www.amazon.com/', { timeout: 12000 });

    // for those causes when script does not start, not sure if it's good idea to use retry function
    await retry(async () => {
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 6000 });
      await page.type(
        '#twotabsearchtextbox',
        `${book} ${authorName} Hardcover`,
      );
    }, 2);

    await page.waitForSelector('#nav-search-submit-button', { timeout: 6000 });
    await Promise.all([
      page.waitForNavigation(),
      page.click('#nav-search-submit-button'),
    ]);

    await Promise.all([
      page.waitForNavigation(),
      page.click(
        '.s-result-item .sg-col-inner .a-section.a-spacing-medium .s-image',
      ),
    ]);

    // for those cases when there is no add to card button on product page
    try {
      await Promise.all([
        page.waitForNavigation(),
        page.click('#add-to-cart-button'),
      ]);
    } catch (cardError) {
      try {
        await Promise.all([
          page.waitForNavigation(),
          page.click('#a-autoid-8-announce'),
        ]);
      } catch (error) {
        await Promise.all([
          page.waitForNavigation(),
          page.click('#a-autoid-9-announce'),
        ]);
      } finally {
        await Promise.all([
          page.waitForNavigation(),
          page.click('#add-to-cart-button'),
        ]);
      }
    }

    await page.waitForSelector('#hlb-view-cart-announce', { timeout: 6000 });

    await Promise.all([
      page.waitForNavigation(),
      page.click('#hlb-view-cart-announce'),
    ]);
  } catch (error) {
    const page = await browser.newPage();
    try {
      await page.goto(
        `file://${path.resolve(__dirname, './errorPage', 'index.html')}`,
      );
    } catch (fileError) {
      await page.evaluate(() => {
        alert('Sorry something went wrong please try one more time');
      });
    }
    console.log('error', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
