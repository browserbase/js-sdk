import { describe, it, beforeEach } from 'node:test'
import { expect } from 'chai'
import { Browserbase } from '../src'
import { BrowserbaseAISDK } from '../src/integrations/ai-sdk'

describe('Browserbase', () => {
  let browserbase: Browserbase

  beforeEach(() => {
    browserbase = new Browserbase()
  })

  it('shoud create and retrieve session', async () => {
    const { id } = await browserbase.createSession()
    const session = await browserbase.getSession(id)

    expect(session.status).to.equal('RUNNING')
    expect(session.id).to.equal(id)
  })

  it('shoud create and update session', async () => {
    const { id } = await browserbase.createSession()
    const updated = await browserbase.updateSession(id, { status: 'RELEASING' })

    expect(updated.status).to.equal('COMPLETED')
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
    const result = await browserbase.loadUrls(['https://example.com'])
    const page = await result.next()

    // finish iterator
    result.next()
    expect(page.value).contain('Example Domain')
  })

  it('should take a screenshot', { timeout: 10000 }, async () => {
    const result = await browserbase.screenshot('https://example.com')
    expect(result.length).to.equal(29806)
  })

  it('should work with AI SDK', async () => {
    const ai = BrowserbaseAISDK(browserbase, { textContent: true })
    const { page } = await ai.execute({ url: 'https://example.com' })
    expect(page).contain('Example Domain')
  })
})
