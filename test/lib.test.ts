import { describe, it, beforeEach } from 'node:test'
import { expect } from 'chai'
import { Browserbase, BrowserbaseAISDK, CreateSessionOptions } from '../src'

describe('Browserbase', () => {
  let browserbase: Browserbase

  beforeEach(() => {
    browserbase = new Browserbase()
  })

  it('shoud list sessions', async () => {
    const session = await browserbase.listSessions()
    expect(session[0].status).to.equal('COMPLETED')
  })

  it('shoud create and retrieve session', async () => {
    const { id } = await browserbase.createSession()
    const session = await browserbase.getSession(id)

    expect(session.status).to.equal('RUNNING')
    expect(session.id).to.equal(id)
  })

  it('shoud create a session and retrieve a recording', async () => {
    const { id } = await browserbase.createSession()
    const recording = await browserbase.getSessionRecording(id)

    expect(recording.length).to.equal(0)
  })

  it('shoud create a session and get debug url', async () => {
    const { id } = await browserbase.createSession()
    const debug = await browserbase.getDebugConnectionURLs(id)
  })

  it('shoud create a session and get session logs', async () => {
    const { id } = await browserbase.createSession()
    const logs = await browserbase.getSessionLogs(id)

    expect(logs.length).to.equal(0)
  })

  it('should load a webpage', async () => {
    const result = await browserbase.load('https://example.com')
    expect(result).contain('Example Domain')
  })

  it('should load a webpage and return text content', async () => {
    const result = await browserbase.load('https://example.com/', {
      textContent: true,
    })

    expect(result).contain('Example Domain')
  })

  it('should load URLs', async () => {
    const result = await browserbase.loadURLs(['https://example.com'])
    const page = await result.next()

    // finish iterator
    result.next()
    expect(page.value).contain('Example Domain')
  })

  it('should take a screenshot', { timeout: 10000 }, async () => {
    const result = await browserbase.screenshot('https://example.com')
    expect(result.length).to.equal(27040)
  })

  it('should work with AI SDK', async () => {
    const ai = BrowserbaseAISDK(browserbase, { textContent: true })
    const { page } = await ai.execute({ url: 'https://example.com' })
    expect(page).contain('Example Domain')
  })

  it('should create a session with dynamically created context', async () => {
    const createContextResponse = await browserbase.createContext();
    const contextId = createContextResponse.id;
  
    // Use the created context ID in session creation
    const sessionOptions: CreateSessionOptions = {
      browserSettings: {
        context: {
          id: contextId,
          persist: true
        }
      }
    };
    const { id } = await browserbase.createSession(sessionOptions);
    const session = await browserbase.getSession(id);
  })
})
