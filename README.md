<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="logo/dark.png"/>
        <img alt="Browserbase logo" src="logo/light.png" style="max-width: 250px;"/>
    </picture>
</p>

<p align="center">
    <a href="https://docs.browserbase.com">Documentation</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://www.browserbase.com/playground">Playground</a>
</p>
<br/>

## Browserbase JS SDK

Browserbase is the best developer platform to reliably run, manage, and monitor headless browsers.

Get browsers' full control and leverage Browserbase's
[Infrastructure](https://docs.browserbase.com/under-the-hood), [Stealth Mode](https://docs.browserbase.com/features/stealth-mode), and
[Session Debugger](https://docs.browserbase.com/features/sessions) to power your automation, test suites,
and LLM data retrievals.

## Installation and setup

### 1. Install the SDK:

```bash
npm install -S @browserbasehq/sdk
```

### 2. Get your Browserbase API Key and Project ID:

- [Create an account](https://www.browserbase.com/sign-up) or [log in to Browserbase](https://www.browserbase.com/sign-in)
- Copy your API Key and Project ID [from your Settings page](https://www.browserbase.com/settings)

## Usage

```js
import { Browserbase } from '@browserbasehq/sdk'

// Init the SDK
const browserbase = new Browserbase()

// Load a webpage
const rawHtml = await browserbase.load('https://www.browserbase.com')

// Load multiple webpages (returns iterator)
const rawHtmls = browserbase.loadURLs([
  'https://www.browserbase.com',
  'https://docs.browserbase.com',
])

for await (let rawHtml of rawHtmls) {
  // ...
}

// Text-only mode
const text = await browserbase.load('https://www.browserbase.com', {
  textContent: true,
})

// Screenshot (returns bytes)
const result = await browserbase.screenshot('https://www.browserbase.com', {
  textContent: true,
})
```

### Vercel AI SDK Integration

Install the additional dependencies:

```
npm i ai openai zod
```

```js
import OpenAI from 'openai'
import { Browserbase } from '@browserbasehq/sdk'
import { BrowserbaseAISDK } from '@browserbasehq/sdk/dist/integrations/ai-sdk'
import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_generateText,
} from 'ai'

// Create new OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Init the Browserbase SDK
const browserbase = new Browserbase()

// Init the tool
const browserTool = BrowserbaseAISDK(browserbase, { textContent: true })

// Load completions
const result = await experimental_generateText({
  model: openai.chat('gpt-3.5-turbo'),
  tools: {
    browserTool,
  },
  prompt: 'What is the weather in San Francisco?',
})
```

## Further reading

- [See how to leverage the Session Debugger for faster development](https://docs.browserbase.com/guides/browser-remote-control#accelerate-your-local-development-with-remote-debugging)
- [Learn more about Browserbase infrastructure](https://docs.browserbase.com/under-the-hood)
- [Sessions API Reference](https://docs.browserbase.com/api-reference/list-all-sessions)
