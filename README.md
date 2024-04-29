<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="logo/dark.png"/>
        <img alt="Browserbase logo" src="logo/light.png"/>
    </picture>
</p>

<p align="center">
    <a href="https://docs.browserbase.com">Documentation</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://www.browserbase.com/">Website</a>
</p>
<br/>

# Browserbase JavaScript SDK

Browserbase is the best developer platform to reliably run, manage, and monitor headless browsers.

Get browsers' full control and leverage Browserbase's
[Infrastructure](https://docs.browserbase.com/under-the-hood), [Stealth Mode](https://docs.browserbase.com/features/stealth-mode), and
[Session Debugger](https://docs.browserbase.com/features/sessions) to power your automation, test suites,
and LLM data retrievals.

**Get started in under one minute** with Playwright.

## Setup

### 1. Install the SDK:

```bash
npm install -S @browserbasehq/sdk
```

### 2. Get your Browserbase API Key and Project ID:

- [Create an account](https://www.browserbase.com/sign-up) or [log in to Browserbase](https://www.browserbase.com/sign-in)
- Copy your API Key and Project ID [from your Settings page](https://www.browserbase.com/settings)

## Usage

```typescript
import { writeFileSync } from 'node:fs'

// assuming that process.env.BROWSERBASE_API_KEY is set
const browserbase = new Browserbase()(async function main() {
  // Load pages
  const rawHtml = await browserbase.load('https://www.browserbase.com')

  const text = await browserbase.load('https://www.browserbase.com', {
    textContentOnly: true,
  })

  const rawHtmls = browserbase.loadURLs([
    'https://www.browserbase.com',
    'https://docs.browserbase.com',
  ])

  for await (let rawHtml of rawHtmls) {
    // ...
  }

  // Take screenshots
  const buffer = await browserbase.screenshot('https://www.browserbase.com')

  writeFileSync('screenshot.jpeg', buffer)
})()
```

## Further reading

- [See how to leverage the Session Debugger for faster development](https://docs.browserbase.com/guides/browser-remote-control#accelerate-your-local-development-with-remote-debugging)
- [Learn more about Browserbase infrastructure](https://docs.browserbase.com/under-the-hood)
- [Explore the Sessions API](https://docs.browserbase.com/api-reference/list-all-sessions)
