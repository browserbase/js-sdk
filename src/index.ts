import puppeteer from 'puppeteer-core'
import BrowserbaseAISDK from './integrations/ai-sdk.js'
import { ContextRecorder } from './recorder/recorder'

export type ClientOptions = {
  apiKey?: string
  projectId?: string
  baseURL?: string
  baseConnectURL?: string
}

export type ConnectOptions = {
  sessionId?: string
  proxy?: boolean
}

export type LoadOptions = {
  textContent?: boolean
} & ConnectOptions

export type ScreenshotOptions = {
  fullPage?: boolean
} & ConnectOptions

export type CreateSessionOptions = {
  projectId?: string
  extensionId?: string
  browserSettings?: {
    fingerprint?: {
      browserListQuery?: string
      httpVersion?: 1 | 2
      browsers?: Array<'chrome' | 'firefox' | 'edge' | 'safari'>
      devices?: Array<'desktop' | 'mobile'>
      locales?: string[]
      operatingSystems?: Array<
        'windows' | 'macos' | 'linux' | 'ios' | 'android'
      >
      screen?: {
        maxHeight?: number
        maxWidth?: number
        minHeight?: number
        minWidth?: number
      }
    }
    viewport?: {
      width?: number
      height?: number
    }
    context?: {
      id: string
      persist: boolean
    }
  }
  keepAlive?: boolean
  // duration in seconds. Minimum 60 (1 minute), maximum 21600 (6 hours)
  timeout?: number
}

export type Session = {
  id: string
  createdAt: string
  startedAt: string
  endedAt?: string
  expiresAt: string
  projectId: string
  status: 'RUNNING' | 'COMPLETED' | 'ERROR' | 'TIMED_OUT'
  taskId?: string
  proxyBytes?: number
  avg_cpu_usage?: number
  memory_usage?: number
  details?: string
  logs?: string
}

export type SessionRecording = {
  type?: number
  time?: string
  data?: any
}

export type DebugConnectionURLs = {
  debuggerFullscreenUrl?: string
  debuggerUrl?: string
  wsUrl?: string
}

export type SessionLog = {
  sessionId?: string
  id: string
  timestamp?: string
  method?: string
  request?: {
    timestamp?: string
    params?: any
    rawBody?: string
  }
  response?: {
    timestamp?: string
    result?: any
    rawBody?: string
  }
  pageId?: string
}

export default class Browserbase {
  private apiKey: string
  private projectId: string
  private baseAPIURL: string
  private baseConnectURL: string

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.BROWSERBASE_API_KEY!
    this.projectId = options.projectId || process.env.BROWSERBASE_PROJECT_ID!
    this.baseAPIURL = options.baseURL || 'https://www.browserbase.com'
    this.baseConnectURL =
      options.baseConnectURL || 'wss://connect.browserbase.com'
  }

  getConnectURL({ sessionId, proxy = false }: ConnectOptions = {}): string {
    return `${this.baseConnectURL}?apiKey=${this.apiKey}${
      sessionId ? `&sessionId=${sessionId}` : ''
    }${proxy ? `&enableProxy=true` : ''}`
  }

  async listSessions(): Promise<Session[]> {
    const response = await fetch(`${this.baseAPIURL}/v1/sessions`, {
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    return await response.json()
  }

  async createSession(options?: CreateSessionOptions): Promise<Session> {
    const mergedOptions = { projectId: this.projectId, ...options }

    if (!mergedOptions.projectId) {
      throw new Error(
        'a projectId is missing: use the options.projectId or BROWSERBASE_PROJECT_ID environment variable to set one.'
      )
    }

    const response = await fetch(`${this.baseAPIURL}/v1/sessions`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mergedOptions),
    })

    return await response.json()
  }

  async completeSession(sessionId: string): Promise<Session> {
    if (!sessionId || sessionId === '') {
      throw new Error('sessionId is required')
    }
    if (!this.projectId) {
      throw new Error(
        'a projectId is missing: use the options.projectId or BROWSERBASE_PROJECT_ID environment variable to set one.'
      )
    }

    const response = await fetch(
      `${this.baseAPIURL}/v1/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: this.projectId,
          status: 'REQUEST_RELEASE',
        }),
      }
    )

    return await response.json()
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(
      `${this.baseAPIURL}/v1/sessions/${sessionId}`,
      {
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return await response.json()
  }

  async getSessionRecording(sessionId: string): Promise<SessionRecording[]> {
    const response = await fetch(
      `${this.baseAPIURL}/v1/sessions/${sessionId}/recording`,
      {
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return await response.json()
  }

  async getSessionDownloads(
    sessionId: string,
    retryInterval: number = 2000,
    retryCount: number = 2
  ) {
    return new Promise<Buffer>((resolve, reject) => {
      const fetchDownload = async () => {
        const response = await fetch(
          `${this.baseAPIURL}/v1/sessions/${sessionId}/downloads`,
          {
            method: 'GET',
            headers: {
              'x-bb-api-key': this.apiKey,
            },
          }
        )

        const arrayBuffer = await response.arrayBuffer()
        if (arrayBuffer.byteLength > 0) {
          resolve(Buffer.from(arrayBuffer))
        } else {
          retryCount--
          if (retryCount <= 0) {
            reject()
          }

          setTimeout(fetchDownload, retryInterval)
        }
      }

      fetchDownload()
    })
  }

  async getDebugConnectionURLs(
    sessionId: string
  ): Promise<DebugConnectionURLs> {
    const response = await fetch(
      `${this.baseAPIURL}/v1/sessions/${sessionId}/debug`,
      {
        method: 'GET',
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    const json = await response.json()
    return json
  }

  async getSessionLogs(sessionId: string): Promise<SessionLog[]> {
    const response = await fetch(
      `${this.baseAPIURL}/v1/sessions/${sessionId}/logs`,
      {
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return await response.json()
  }

  load(url: string | string[], options: LoadOptions = {}) {
    if (typeof url === 'string') {
      return this.loadURL(url, options)
    } else if (Array.isArray(url)) {
      return this.loadURLs(url, options)
    } else {
      throw new TypeError('Input must be a URL string or array of URLs')
    }
  }

  async loadURL(url: string, options: LoadOptions = {}): Promise<string> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: this.getConnectURL({
        sessionId: options.sessionId,
        proxy: options.proxy,
      }),
    })

    const pages = await browser.pages()
    const page = pages[0]
    await page.goto(url)
    let html = await page.content()

    if (options.textContent) {
      const readable: { title?: string; textContent?: string } =
        await page.evaluate(`
        import('https://cdn.skypack.dev/@mozilla/readability').then(readability => {
          return new readability.Readability(document).parse()
        })`)
      html = `${readable.title}\n${readable.textContent}`
    }

    await browser.close()
    return html
  }

  async *loadURLs(
    urls: string[],
    options: LoadOptions = {}
  ): AsyncGenerator<string> {
    if (!urls.length) {
      throw new Error('Page URLs were not provided')
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: this.getConnectURL({
        sessionId: options.sessionId,
        proxy: options.proxy,
      }),
    })

    const pages = await browser.pages()
    const page = pages[0]

    for (const url of urls) {
      await page.goto(url)
      let html = await page.content()

      if (options.textContent) {
        const readable: { title?: string; textContent?: string } =
          await page.evaluate(`
          import('https://cdn.skypack.dev/@mozilla/readability').then(readability => {
            return new readability.Readability(document).parse()
          })`)
        html = `${readable.title}\n${readable.textContent}`
      }

      yield html
    }

    await browser.close()
  }

  async screenshot(
    url: string,
    options: ScreenshotOptions = { fullPage: false }
  ): Promise<Buffer> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: this.getConnectURL({
        sessionId: options.sessionId,
        proxy: options.proxy,
      }),
    })

    const pages = await browser.pages()
    const page = pages[0]
    await page.goto(url)
    const screenshot = await page.screenshot({ fullPage: options.fullPage })
    await browser.close()
    return screenshot
  }

  async createContext(): Promise<{ id: string }> {
    const response = await fetch(`${this.baseAPIURL}/v1/contexts`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId: this.projectId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create context')
    }

    const data = await response.json()
    return data
  }
}

export { Browserbase, BrowserbaseAISDK, ContextRecorder }
