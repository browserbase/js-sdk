import { chromium } from 'playwright'

type BrowserbaseLoadOptions = {
  textContent?: boolean
}

type BrowserbaseScreenshotOptions = {
  fullPage?: boolean
}

export default class Browserbase {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BROWSERBASE_API_KEY!
  }

  load(
    url: string | string[],
    options: BrowserbaseLoadOptions = { textContent: false }
  ) {
    if (typeof url === 'string') {
      return this.loadUrl(url, options)
    } else if (Array.isArray(url)) {
      return this.loadUrls(url, options)
    } else {
      throw new TypeError('Input must be a URL string or array of URLs')
    }
  }

  async loadUrl(
    url: string,
    options: BrowserbaseLoadOptions = { textContent: false }
  ): Promise<string> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await chromium.connectOverCDP(
      `wss://api.browserbase.com?apiKey=${this.apiKey}`
    )
    const defaultContext = browser.contexts()[0]
    const page = defaultContext.pages()[0]
    await page.goto(url)
    let html = await page.content()

    if (options.textContent) {
      const readable = await page.evaluate(async () => {
        const readability = await import(
          // @ts-ignore
          'https://cdn.skypack.dev/@mozilla/readability'
        )
        return new readability.Readability(document).parse()
      })
      html = `${readable.title}\n${readable.textContent}`
    }

    await browser.close()
    return html
  }

  async *loadUrls(
    urls: string[],
    options: BrowserbaseLoadOptions = { textContent: false }
  ): AsyncGenerator<string> {
    if (!urls.length) {
      throw new Error('Page URLs were not provided')
    }

    const browser = await chromium.connectOverCDP(
      `wss://api.browserbase.com?apiKey=${this.apiKey}`
    )
    const defaultContext = browser.contexts()[0]
    const page = defaultContext.pages()[0]

    for (const url of urls) {
      await page.goto(url)
      let html = await page.content()

      if (options.textContent) {
        const readable = await page.evaluate(async () => {
          const readability = await import(
            // @ts-ignore
            'https://cdn.skypack.dev/@mozilla/readability'
          )
          return new readability.Readability(document).parse()
        })
        html = `${readable.title}\n${readable.textContent}`
      }

      yield html
    }

    await browser.close()
  }

  async screenshot(
    url: string,
    options: BrowserbaseScreenshotOptions = { fullPage: false }
  ): Promise<Buffer> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await chromium.connectOverCDP(
      `wss://api.browserbase.com?apiKey=${this.apiKey}`
    )
    const page = await browser.newPage()
    await page.goto(url)
    const screenshot = await page.screenshot({ fullPage: options.fullPage })
    await browser.close()
    return screenshot
  }
}
