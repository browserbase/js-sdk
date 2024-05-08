import { z } from 'zod'
import Browserbase, { LoadOptions } from '../index.js'

export default function BrowserbaseAISDK(
  b: Browserbase,
  options: LoadOptions = {}
) {
  return {
    description:
      'Load a webpage in a browser hosted by Browserbase and return its contents',
    parameters: z.object({
      url: z.string().describe('Page URL to be loaded'),
    }),
    execute: async ({ url }: { url: string }) => {
      const page = await b.loadUrl(url, options)
      return { page }
    },
  }
}

export { BrowserbaseAISDK }
