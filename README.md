# Browserbase JS SDK

[Browserbase](https://browserbase.com) is a serverless platform for running headless browsers, it offers advanced debugging, session recordings, stealth mode, integrated proxies and captcha solving.

## Installation and setup

- Get an API key from [browserbase.com](https://browserbase.com) and set it in environment variables (`BROWSERBASE_API_KEY`).
- Install the required dependencies:

```
npm i @browserbasehq/sdk
```

## Usage

```js
import { Browserbase, BrowserbaseAISDK } from '@browserbasehq/sdk'

// Init the SDK
const browserbase = new Browserbase()

// Load a webpage
const result = await browserbase.load("https://example.com")

// Load multiple webpages (returns iterator)
const result = await browserbase.load(["https://example.com"])

// Text-only mode
const result = await browserbase.load("https://example.com", { textContent: true })

// Screenshot (returns bytes)
const result = await browserbase.screenshot("https://example.com",  { textContent: true })
```

### Vercel AI SDK Integration

Install the additional dependencies:

```
npm i ai openai zod
```

```js
import OpenAI from 'openai';
import { Browserbase } from '@browserbasehq/sdk'
import { BrowserbaseAISDK } from '@browserbasehq/sdk/dist/integrations/ai-sdk'
import { OpenAIStream, StreamingTextResponse, experimental_generateText } from 'ai';

// Create new OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Init the Browserbase SDK
const browserbase = new Browserbase();

// Init the tool
const browserTool = BrowserbaseAISDK(browserbase, { textContent: true });

// Load completions
const result = await experimental_generateText({
  model: openai.chat('gpt-3.5-turbo'),
  tools: {
    browserTool
  },
  prompt:
    'What is the weather in San Francisco?',
});
```
