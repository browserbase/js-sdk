import { writeFileSync } from 'node:fs'

export interface CreateSession {
  id: string
  createdAt: string
  projectId: string
  status:
    | 'NEW'
    | 'CREATED'
    | 'ERROR'
    | 'RUNNING'
    | 'REQUEST_RELEASE'
    | 'RELEASING'
}

/**
 * Creates a Session on Browserbase
 * @returns {Object} session The created Session.
 * @returns {string} session.id The created Session ID.
 */
export async function createSession(): Promise<CreateSession> {
  const response = await fetch(`https://www.browserbase.com/v1/sessions`, {
    method: 'POST',
    headers: {
      'x-bb-api-key': `${process.env.BROWSERBASE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    }),
  })
  const json = await response.json()
  return json
}

export interface DebugConnectionURLs {
  debuggerFullscreenUrl: string
  debuggerUrl: string
  wsUrl: string
}

/**
 * Return the URLs to debug a running Session
 * @param {string} sessionId
 * @returns {Object} debugConnectionURLs The debug connection URLs
 * @returns {string} connection.debuggerFullscreenUrl The fullscreen Chrome Debug URL.
 * @returns {string} connection.debuggerUrl The default Chrome Debug URL.
 * @returns {string} connection.wsUrl The Websocket URL.
 */
export async function retrieveDebugConnectionURLs(
  sessionId: string
): Promise<DebugConnectionURLs> {
  const response = await fetch(
    `https://www.browserbase.com/v1/sessions/${sessionId}/debug`,
    {
      method: 'GET',
      headers: {
        'x-bb-api-key': `${process.env.BROWSERBASE_API_KEY}`,
      },
    }
  )
  const json = await response.json()
  return json
}

/**
 * Saves on disk all files downloaded during the Session as a zip file
 * @param {string} sessionId
 * @param {string} filePath
 * @param {number} retryForSeconds
 * @returns {Promise<any>}
 */
export async function saveDownloadsOnDisk(
  sessionId: string,
  filePath: string,
  retryForSeconds: number = 20000
) {
  return new Promise<void>((resolve, reject) => {
    let pooler
    const timeout = setTimeout(() => {
      if (pooler) {
        clearInterval(pooler)
      }
    }, retryForSeconds)
    async function fetchDownloads() {
      try {
        const response = await fetch(
          `https://www.browserbase.com/v1/sessions/${sessionId}/downloads`,
          {
            method: 'GET',
            headers: {
              'x-bb-api-key': process.env.BROWSERBASE_API_KEY!,
            },
          }
        )
        const arrayBuffer = await response.arrayBuffer()
        if (arrayBuffer.byteLength > 0) {
          const buffer = Buffer.from(arrayBuffer)
          writeFileSync(filePath, buffer)
          clearInterval(pooler)
          clearTimeout(timeout)
          resolve()
        }
      } catch (e) {
        clearInterval(pooler)
        clearTimeout(timeout)
        reject(e)
      }
    }
    pooler = setInterval(fetchDownloads, 2000)
  })
}
