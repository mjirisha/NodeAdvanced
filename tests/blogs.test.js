Number.prototype._called = {};
const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

// nested tests
describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('can see blog create form', async () => {
    const label = await page.getContentsOf('form .title label');
    expect(label).toEqual('Blog Title');
  });

  // invalid form messaging
  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button[type="submit"]');
    });

    test('the form shows error message', async () => {
      const errTitle = await page.getContentsOf('.title .red-text');
      const errContent = await page.getContentsOf('.content .red-text');
      expect(errTitle).toEqual('You must provide a value');
      expect(errContent).toEqual('You must provide a value');
    });
  });

  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('input[name= "title"]', 'my title');
      await page.type('input[name= "content"]', 'my content');
      await page.click('form button[type="submit"]');
    });

    test('submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('submitting saving adds blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');
      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');
      expect(title).toEqual('my title');
      expect(content).toEqual('my content');
    });
  });
});

describe('When logged out', async () => {
  test('Not able to create blog post', async () => {
    // executes not in tests, but in chromium!
    const result = await page.evaluate(() => {
      return fetch('/api/blogs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'My other title', content: 'test' }),
      }).then((res) => res.json());
    });

    expect(result).toEqual({ error: 'You must log in!' });
  });

  test('Not able to see the posts', async () => {
    // executes not in tests, but in chromium!
    const result = await page.evaluate(() => {
      return fetch('/api/blogs', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    });

    expect(result).toEqual({ error: 'You must log in!' });
  });
});
