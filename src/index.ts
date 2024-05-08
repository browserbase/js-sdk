import { chromium } from 'playwright'
import fs from 'fs/promises'

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
  fingerprint?: {
    browserListQuery?: string
    httpVersion?: 1 | 2
    browsers?: Array<'chrome' | 'firefox' | 'edge' | 'safari'>
    devices?: Array<'desktop' | 'mobile'>
    locales?: string[]
    operatingSystems?: Array<'windows' | 'macos' | 'linux' | 'ios' | 'android'>
    screen?: {
      maxHeight?: number
      maxWidth?: number
      minHeight?: number
      minWidth?: number
    }
  }
}

export type Session = {
  id: string
  createdAt: string
  startedAt: string
  endedAt: string
  projectId: string
  status:
    | 'NEW'
    | 'CREATED'
    | 'ERROR'
    | 'RUNNING'
    | 'REQUEST_RELEASE'
    | 'RELEASING'
  taskId: string
  proxyBytes: number
  expiresAt: string
  avg_cpu_usage: number
  memory_usage: number
  details: string
  logs: string
}

export type UpdateSessionOptions = {
  projectId?: string
  status: Session['status']
}

export type SessionRecording = {
  type: number
  timestamp: number
  data: object
}

export type SessionLog = {
  sessionId: string
  id: string
  timestamp: string
  method: string
  request: {
    timestamp: string
    params: object
    rawBody: string
  }
  response: {
    timestamp: string
    result: object
    rawBody: string
  }
  pageId: string
}

export type DebugConnectionURLs = {
  debuggerFullscreenUrl: string
  debuggerUrl: string
  wsUrl: string
}

export default class Browserbase {
  private apiKey: string
  private projectId: string
  private baseApiURL: string
  private baseConnectURL: string

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.BROWSERBASE_API_KEY!
    this.projectId = options.projectId || process.env.BROWSERBASE_PROJECT_ID!
    this.baseApiURL = options.baseURL || 'https://www.browserbase.com'
    this.baseConnectURL =
      options.baseConnectURL || 'wss://connect.browserbase.com'
  }

  connectUrl({ sessionId, proxy = false }: ConnectOptions = {}): string {
    return `${this.baseConnectURL}?apiKey=${this.apiKey}${
      sessionId ? `&sessionId=${sessionId}` : ''
    }${proxy ? `&enableProxy=true` : ''}`
  }

  async listSessions(): Promise<Session[]> {
    const response = await fetch(`${this.baseApiURL}/v1/sessions`, {
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    return await response.json()
  }

  async createSession(options?: CreateSessionOptions): Promise<Session> {
    const response = await fetch(`${this.baseApiURL}/v1/sessions`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId: this.projectId, ...options }),
    })

    return await response.json()
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(
      `${this.baseApiURL}/v1/sessions/${sessionId}`,
      {
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return await response.json()
  }

  async updateSession(
    sessionId: string,
    options: UpdateSessionOptions
  ): Promise<Session> {
    const response = await fetch(
      `${this.baseApiURL}/v1/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: this.projectId, ...options }),
      }
    )

    return await response.json()
  }

  async getSessionRecording(sessionId: string): Promise<SessionRecording[]> {
    const response = await fetch(
      `${this.baseApiURL}/v1/sessions/${sessionId}/recording`,
      {
        headers: {
          'x-bb-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return await response.json()
  }

  async getSessionLogs(sessionId: string): Promise<SessionLog[]> {
    const response = await fetch(
      `${this.baseApiURL}/v1/sessions/${sessionId}/logs`,
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
    filePath: string,
    retryInterval: number = 2000,
    retryCount: number = 2
  ) {
    return new Promise<void>((resolve, reject) => {
      const fetchDownload = async () => {
        const response = await fetch(
          `${this.baseApiURL}/v1/sessions/${sessionId}/downloads`,
          {
            method: 'GET',
            headers: {
              'x-bb-api-key': this.apiKey,
            },
          }
        )

        const arrayBuffer = await response.arrayBuffer()
        if (arrayBuffer.byteLength > 0) {
          const buffer = Buffer.from(arrayBuffer)
          await fs.writeFile(filePath, buffer)
          resolve()
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
      `${this.baseApiURL}/v1/sessions/${sessionId}/debug`,
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

  load(url: string | string[], options: LoadOptions = {}) {
    if (typeof url === 'string') {
      return this.loadUrl(url, options)
    } else if (Array.isArray(url)) {
      return this.loadUrls(url, options)
    } else {
      throw new TypeError('Input must be a URL string or array of URLs')
    }
  }

  async loadUrl(url: string, options: LoadOptions = {}): Promise<string> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await chromium.connectOverCDP(
      this.connectUrl({ sessionId: options.sessionId, proxy: options.proxy })
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
    options: LoadOptions = {}
  ): AsyncGenerator<string> {
    if (!urls.length) {
      throw new Error('Page URLs were not provided')
    }

    const browser = await chromium.connectOverCDP(
      this.connectUrl({ sessionId: options.sessionId, proxy: options.proxy })
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
    options: ScreenshotOptions = { fullPage: false }
  ): Promise<Buffer> {
    if (!url) {
      throw new Error('Page URL was not provided')
    }

    const browser = await chromium.connectOverCDP(
      this.connectUrl({ sessionId: options.sessionId, proxy: options.proxy })
    )
    const page = await browser.newPage()
    await page.goto(url)
    const screenshot = await page.screenshot({ fullPage: options.fullPage })
    await browser.close()
    return screenshot
  }
}

export { Browserbase }
