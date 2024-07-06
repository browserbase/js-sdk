import type { BrowserContextOptions, LaunchOptions } from 'playwright-core'
import type { ActionInContext } from './generator'
import type { Point } from './recorder-types'

export type Signal =
  | NavigationSignal
  | PopupSignal
  | DownloadSignal
  | DialogSignal

export type ActionName =
  | 'check'
  | 'click'
  | 'closePage'
  | 'fill'
  | 'navigate'
  | 'openPage'
  | 'press'
  | 'select'
  | 'uncheck'
  | 'setInputFiles'
  | 'assertText'
  | 'assertValue'
  | 'assertChecked'
  | 'assertVisible'

export type ActionBase = {
  name: ActionName
  signals: Signal[]
}

export type ClickAction = ActionBase & {
  name: 'click'
  selector: string
  button: 'left' | 'middle' | 'right'
  modifiers: number
  clickCount: number
  position?: Point
}

export type CheckAction = ActionBase & {
  name: 'check'
  selector: string
}

export type UncheckAction = ActionBase & {
  name: 'uncheck'
  selector: string
}

export type FillAction = ActionBase & {
  name: 'fill'
  selector: string
  text: string
}

export type NavigateAction = ActionBase & {
  name: 'navigate'
  url: string
}

export type OpenPageAction = ActionBase & {
  name: 'openPage'
  url: string
}

export type ClosesPageAction = ActionBase & {
  name: 'closePage'
}

export type PressAction = ActionBase & {
  name: 'press'
  selector: string
  key: string
  modifiers: number
}

export type SelectAction = ActionBase & {
  name: 'select'
  selector: string
  options: string[]
}

export type SetInputFilesAction = ActionBase & {
  name: 'setInputFiles'
  selector: string
  files: string[]
}

export type AssertTextAction = ActionBase & {
  name: 'assertText'
  selector: string
  text: string
  substring: boolean
}

export type AssertValueAction = ActionBase & {
  name: 'assertValue'
  selector: string
  value: string
}

export type AssertCheckedAction = ActionBase & {
  name: 'assertChecked'
  selector: string
  checked: boolean
}

export type AssertVisibleAction = ActionBase & {
  name: 'assertVisible'
  selector: string
}
export type Action =
  | ClickAction
  | CheckAction
  | ClosesPageAction
  | OpenPageAction
  | UncheckAction
  | FillAction
  | NavigateAction
  | PressAction
  | SelectAction
  | SetInputFilesAction
  | AssertTextAction
  | AssertValueAction
  | AssertCheckedAction
  | AssertVisibleAction
export type AssertAction =
  | AssertCheckedAction
  | AssertValueAction
  | AssertTextAction
  | AssertVisibleAction

// Signals.

export type BaseSignal = {}

export type NavigationSignal = BaseSignal & {
  name: 'navigation'
  url: string
}

export type PopupSignal = BaseSignal & {
  name: 'popup'
  popupAlias: string
}

export type DownloadSignal = BaseSignal & {
  name: 'download'
  downloadAlias: string
}

export type DialogSignal = BaseSignal & {
  name: 'dialog'
  dialogAlias: string
}

export type Language = 'javascript' | 'python' | 'java' | 'csharp' | 'jsonl'

export type LanguageGeneratorOptions = {
  browserName: string
  launchOptions: LaunchOptions
  contextOptions: BrowserContextOptions
  deviceName?: string
  saveStorage?: string
}

export interface LanguageGenerator {
  id: string
  groupName: string
  name: string
  highlighter: Language
  generateHeader(options: LanguageGeneratorOptions): string
  generateAction(actionInContext: ActionInContext): string
  generateFooter(saveStorage: string | undefined): string
}

export function toSignalMap(action: Action) {
  let popup: PopupSignal | undefined
  let download: DownloadSignal | undefined
  let dialog: DialogSignal | undefined
  for (const signal of action.signals) {
    if (signal.name === 'popup') popup = signal
    else if (signal.name === 'download') download = signal
    else if (signal.name === 'dialog') dialog = signal
  }
  return {
    popup,
    download,
    dialog,
  }
}
