import { EventEmitter } from 'node:events'
import { CodeGenerator, ActionInContext } from './generator'
import * as actions from './recorder-types'
import { BrowserContext, Dialog, Page, Frame } from 'playwright-core'
import { BindingSource } from 'playwright-core/types/structs'
import { monotonicTime } from './time'
import { raceAgainstDeadline } from './timeout-runner'
import { quoteCSSAttributeValue } from './css-utils'
import { CallMetadata } from './call-metadata'
import { createGuid } from './crypto'
import { toClickOptions, toModifiers } from './utils'
import { JavaScriptLanguageGenerator } from './javascript-generator'

export type RecorderOptions = {
  enabled?: boolean
}

export class ContextRecorder extends EventEmitter {
  private _context: BrowserContext
  private _generator: CodeGenerator
  private _pageAliases = new Map<Page, string>()
  private _lastPopupOrdinal = 0
  private _lastDialogOrdinal = -1
  private _lastDownloadOrdinal = -1
  private _timers = new Set<NodeJS.Timeout>()
  private _javascriptGenerator: JavaScriptLanguageGenerator

  constructor(context: BrowserContext, options?: RecorderOptions) {
    super()
    this._context = context
    this._generator = new CodeGenerator(
      'chromium',
      options?.enabled ?? false,
      {},
      {},
      undefined,
      undefined
    )
    this._javascriptGenerator = new JavaScriptLanguageGenerator(false)

    this._generator.on('change', () => {
      const { header, footer, actions, text } =
        this._generator.generateStructure(this._javascriptGenerator)
      this.emit('change', { actions })
    })
  }

  setEnabled(enabled: boolean) {
    this._generator.setEnabled(enabled)
  }

  async install() {
    this._context.on('page', (page: Page) => {
      this._onPage(page)
    })
    for (const page of this._context.pages()) {
      this._onPage(page)
    }
    this._context.on('dialog', (dialog: Dialog) => {
      this._onDialog(dialog.page())
    })

    await this._context.exposeBinding(
      '__bb_recorderPerformAction',
      (source: BindingSource, action: actions.Action) =>
        this._performAction(source.frame, action)
    )

    await this._context.exposeBinding(
      '__bb_recorderRecordAction',
      (source: BindingSource, action: actions.Action) =>
        this._recordAction(source.frame, action)
    )

    await this._context.exposeBinding(
      '__bb_recorderEnabled',
      (_source: BindingSource) => true
    )
  }

  private _onDialog(page: Page) {
    const pageAlias = this._pageAliases.get(page)!
    ++this._lastDialogOrdinal
    this._generator.signal(pageAlias, page.mainFrame(), {
      name: 'dialog',
      dialogAlias: this._lastDialogOrdinal
        ? String(this._lastDialogOrdinal)
        : '',
    })
  }

  private async _onPage(page: Page) {
    const frame = page.mainFrame()

    page.on('close', () => {
      this._generator.addAction({
        frame: this._describeMainFrame(page),
        committed: true,
        action: {
          name: 'closePage',
          signals: [],
        },
      })
      this._pageAliases.delete(page)
    })

    // @ts-ignore
    frame._eventEmitter.on('navigated', (event) => {
      this._onFrameNavigated(frame, page)
    })

    page.on('download', () => this._onDownload(page))

    const suffix = this._pageAliases.size
      ? String(++this._lastPopupOrdinal)
      : ''
    const pageAlias = 'page' + suffix
    this._pageAliases.set(page, pageAlias)

    const opener = await page.opener()

    if (opener) {
      this._onPopup(opener, page)
    } else {
      this._generator.addAction({
        frame: this._describeMainFrame(page),
        committed: true,
        action: {
          name: 'openPage',
          url: page.mainFrame().url(),
          signals: [],
        },
      })
    }
  }
  private _describeMainFrame(page: Page): actions.FrameDescription {
    return {
      pageAlias: this._pageAliases.get(page)!,
      isMainFrame: true,
    }
  }

  private async _describeFrame(
    frame: Frame
  ): Promise<actions.FrameDescription> {
    // @ts-expect-error
    const page = frame._page
    const pageAlias = this._pageAliases.get(page)!
    const chain: Frame[] = []
    for (
      let ancestor: Frame | null = frame;
      ancestor;
      ancestor = ancestor.parentFrame()
    )
      chain.push(ancestor)
    chain.reverse()

    if (chain.length === 1) return this._describeMainFrame(page)

    const selectorPromises: Promise<string | undefined>[] = []
    for (let i = 0; i < chain.length - 1; i++)
      selectorPromises.push(findFrameSelector(chain[i + 1]))

    const result = await raceAgainstDeadline(
      () => Promise.all(selectorPromises),
      monotonicTime() + 2000
    )
    if (
      !result.timedOut &&
      // @ts-expect-error
      result.result.every((selector: string | undefined) => !!selector)
    ) {
      return {
        pageAlias,
        isMainFrame: false,
        // @ts-expect-error
        selectorsChain: result.result as string[],
      }
    }
    // Best effort to find a selector for the frame.
    const selectorsChain = []
    for (let i = 0; i < chain.length - 1; i++) {
      if (chain[i].name())
        selectorsChain.push(
          `iframe[name=${quoteCSSAttributeValue(chain[i].name())}]`
        )
      else
        selectorsChain.push(
          `iframe[src=${quoteCSSAttributeValue(chain[i].url())}]`
        )
    }
    return {
      pageAlias,
      isMainFrame: false,
      selectorsChain,
    }
  }

  private async _performAction(frame: Frame, action: actions.Action) {
    //console.log('perform action', action)
    // Commit last action so that no further signals are added to it.
    this._generator.commitLastAction()

    const frameDescription = await this._describeFrame(frame)
    const actionInContext: ActionInContext = {
      frame: frameDescription,
      action,
    }

    const perform = async (
      action: string,
      params: any,
      cb: (callMetadata: CallMetadata) => Promise<any>
    ) => {
      const callMetadata: CallMetadata = {
        id: `call@${createGuid()}`,
        apiName: 'frame.' + action,
        // @ts-expect-error
        objectId: frame._guid,
        // @ts-expect-error
        pageId: frame._page._guid,
        // @ts-expect-error
        frameId: frame._guid,
        startTime: monotonicTime(),
        endTime: 0,
        type: 'Frame',
        method: action,
        params,
        log: [],
      }

      this._generator.willPerformAction(actionInContext)
      //console.log('will perform action', actionInContext)
      try {
        //await frame.instrumentation.onBeforeCall(frame, callMetadata)
        await cb(callMetadata)
      } catch (e) {
        console.error('error performing action', e)
        callMetadata.endTime = monotonicTime()
        //await frame.instrumentation.onAfterCall(frame, callMetadata)
        this._generator.performedActionFailed(actionInContext)
        return
      }

      callMetadata.endTime = monotonicTime()
      //await frame.instrumentation.onAfterCall(frame, callMetadata)

      this._setCommittedAfterTimeout(actionInContext)
      this._generator.didPerformAction(actionInContext)
      //console.log('did perform action', actionInContext)
    }

    const kActionTimeout = 5000
    if (action.name === 'click') {
      const { options } = toClickOptions(action)
      await perform('click', { selector: action.selector }, (callMetadata) => {
        return frame.click(action.selector, {
          ...options,
          force: true,
          timeout: kActionTimeout,
          strict: true,
        })
      })
    }
    if (action.name === 'press') {
      const modifiers = toModifiers(action.modifiers)
      const shortcut = [...modifiers, action.key].join('+')
      await perform(
        'press',
        { selector: action.selector, key: shortcut },
        (callMetadata) =>
          frame.press(action.selector, shortcut, {
            timeout: kActionTimeout,
            strict: true,
          })
      )
    }
    if (action.name === 'check')
      await perform('check', { selector: action.selector }, (callMetadata) =>
        frame.check(action.selector, {
          timeout: kActionTimeout,
          strict: true,
        })
      )
    if (action.name === 'uncheck')
      await perform('uncheck', { selector: action.selector }, (callMetadata) =>
        frame.uncheck(action.selector, {
          timeout: kActionTimeout,
          strict: true,
        })
      )
    if (action.name === 'select') {
      const values = action.options.map((value) => ({ value }))
      await perform(
        'selectOption',
        { selector: action.selector, values },
        (callMetadata) =>
          frame.selectOption(action.selector, values, {
            timeout: kActionTimeout,
            strict: true,
          })
      )
    }
  }

  private async _recordAction(frame: Frame, action: actions.Action) {
    console.log('record action', action)
    // Commit last action so that no further signals are added to it.
    this._generator.commitLastAction()

    console.log('committed action')

    const frameDescription = await this._describeFrame(frame)
    console.log('described frame')
    const actionInContext: ActionInContext = {
      frame: frameDescription,
      action,
    }
    this._setCommittedAfterTimeout(actionInContext)
    console.log('committed after timeout')
    this._generator.addAction(actionInContext)
    console.log('action added')
  }

  private _setCommittedAfterTimeout(actionInContext: ActionInContext) {
    const timer = setTimeout(() => {
      // Commit the action after 5 seconds so that no further signals are added to it.
      actionInContext.committed = true
      this._timers.delete(timer)
    }, 5000)
    this._timers.add(timer)
  }

  private _onFrameNavigated(frame: Frame, page: Page) {
    const pageAlias = this._pageAliases.get(page)
    this._generator.signal(pageAlias!, frame, {
      name: 'navigation',
      url: frame.url(),
    })
  }

  private _onPopup(page: Page, popup: Page) {
    const pageAlias = this._pageAliases.get(page)!
    const popupAlias = this._pageAliases.get(popup)!
    this._generator.signal(pageAlias, page.mainFrame(), {
      name: 'popup',
      popupAlias,
    })
  }

  private _onDownload(page: Page) {
    const pageAlias = this._pageAliases.get(page)!
    ++this._lastDownloadOrdinal
    this._generator.signal(pageAlias, page.mainFrame(), {
      name: 'download',
      downloadAlias: this._lastDownloadOrdinal
        ? String(this._lastDownloadOrdinal)
        : '',
    })
  }
}

async function findFrameSelector(frame: Frame): Promise<string | undefined> {
  try {
    const parent = frame.parentFrame()
    const frameElement = await frame.frameElement()
    if (!frameElement || !parent) return
    const selector = await parent.evaluate((element) => {
      //@ts-expect-error
      return window.__bb_injectedScript.generateSelectorSimple(
        element as Element,
        {
          testIdAttributeName: '',
          omitInternalEngines: true,
        }
      )
    }, frameElement)
    return selector
  } catch (e) {}
}
