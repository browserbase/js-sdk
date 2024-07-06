const initialTime = process.hrtime()

export function monotonicTime(): number {
  const [seconds, nanoseconds] = process.hrtime(initialTime)
  return seconds * 1000 + ((nanoseconds / 1000) | 0) / 1000
}
