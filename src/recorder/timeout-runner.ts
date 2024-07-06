import { monotonicTime } from './time'
export async function raceAgainstDeadline<T>(
  cb: () => Promise<T>,
  deadline: number
): Promise<{ result: T; timedOut: false } | { timedOut: true }> {
  let timer: NodeJS.Timeout | undefined
  return Promise.race([
    cb().then((result) => {
      return { result, timedOut: false }
    }),
    new Promise<{ timedOut: true }>((resolve) => {
      const kMaxDeadline = 2147483647 // 2^31-1
      const timeout = (deadline || kMaxDeadline) - monotonicTime()
      timer = setTimeout(() => resolve({ timedOut: true }), timeout)
    }),
  ]).finally(() => {
    clearTimeout(timer)
  })
}
