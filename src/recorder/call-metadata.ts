import { type Point } from './recorder-types'

export type SerializedValue = {
  n?: number
  b?: boolean
  s?: string
  v?: 'null' | 'undefined' | 'NaN' | 'Infinity' | '-Infinity' | '-0'
  d?: string
  u?: string
  bi?: string
  r?: {
    p: string
    f: string
  }
  a?: SerializedValue[]
  o?: {
    k: string
    v: SerializedValue
  }[]
  h?: number
  id?: number
  ref?: number
}
export type SerializedError = {
  error?: {
    message: string
    name: string
    stack?: string
  }
  value?: SerializedValue
}

export type CallMetadata = {
  id: string
  startTime: number
  endTime: number
  pauseStartTime?: number
  pauseEndTime?: number
  type: string
  method: string
  params: any
  apiName?: string
  // Client is making an internal call that should not show up in
  // the inspector or trace.
  internal?: boolean
  // Service-side is making a call to itself, this metadata does not go
  // through the dispatcher, so is always excluded from inspector / tracing.
  isServerSide?: boolean
  // Test runner step id.
  stepId?: string
  location?: { file: string; line?: number; column?: number }
  log: string[]
  error?: SerializedError
  result?: any
  point?: Point
  objectId?: string
  pageId?: string
  frameId?: string
  potentiallyClosesScope?: boolean
}

export type ActionMetadata = {
  apiName?: string
  objectId?: string
  pageId?: string
  frameId?: string
  params: any
  method: string
  type: string
}
