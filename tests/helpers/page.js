const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  constructor(page) {
    this.page = page;
  }

  // PROXY gives us possibility to "extend" some class with ALL properties on the top level
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  async login(redirectTo) {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });

    await this.page.goto(redirectTo || 'http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
}

module.exports = CustomPage;
