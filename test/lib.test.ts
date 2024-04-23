import { describe, it, beforeEach } from 'node:test'
import { expect } from 'chai'
import Browserbase from '../src'
import BrowserbaseAISDK from '../src/integrations/ai-sdk'

describe('Browserbase', () => {
  let browserbase: Browserbase

  beforeEach(() => {
    browserbase = new Browserbase()
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
    expect(result.length).to.equal(29806)
  })

  it('should work with AI SDK', async () => {
    const ai = BrowserbaseAISDK(browserbase, { textContent: true })
    const { page } = await ai.execute({ url: 'https://example.com' })
    expect(page).contain('Example Domain')
  })
})
