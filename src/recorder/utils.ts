import * as actions from './recorder-types'

export type KeyboardModifier = 'Alt' | 'Control' | 'Meta' | 'Shift'
export type SmartKeyboardModifier = KeyboardModifier | 'ControlOrMeta'

export type MouseClickOptions = {
  strict?: boolean
  force?: boolean
  noWaitAfter?: boolean
  modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[]
  position?: actions.Point
  delay?: number
  button?: 'left' | 'right' | 'middle'
  clickCount?: number
  timeout?: number
  trial?: boolean
}

export function toClickOptions(action: actions.ClickAction): {
  method: 'click' | 'dblclick'
  options: MouseClickOptions
} {
  let method: 'click' | 'dblclick' = 'click'
  if (action.clickCount === 2) method = 'dblclick'
  const modifiers = toModifiers(action.modifiers)
  const options: MouseClickOptions = {}
  if (action.button !== 'left') options.button = action.button
  if (modifiers.length) options.modifiers = modifiers
  if (action.clickCount > 2) options.clickCount = action.clickCount
  if (action.position) options.position = action.position
  return { method, options }
}

export function toModifiers(modifiers: number): SmartKeyboardModifier[] {
  const result: SmartKeyboardModifier[] = []
  if (modifiers & 1) result.push('Alt')
  if (modifiers & 2) result.push('ControlOrMeta')
  if (modifiers & 4) result.push('ControlOrMeta')
  if (modifiers & 8) result.push('Shift')
  return result
}
