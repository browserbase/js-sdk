// polyfil for window.performance.now
var performance = global.performance || {}
var performanceNow =
  // @ts-expect-error
  performance.now ||
  // @ts-expect-error
  performance.mozNow ||
  // @ts-expect-error
  performance.msNow ||
  // @ts-expect-error
  performance.oNow ||
  // @ts-expect-error
  performance.webkitNow ||
  function () {
    return new Date().getTime()
  }

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function _hrtime(previousTimestamp: any) {
  var clocktime = performanceNow.call(performance) * 1e-3
  var seconds = Math.floor(clocktime)
  var nanoseconds = Math.floor((clocktime % 1) * 1e9)
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0]
    nanoseconds = nanoseconds - previousTimestamp[1]
    if (nanoseconds < 0) {
      seconds--
      nanoseconds += 1e9
    }
  }
  return [seconds, nanoseconds]
}

const hrtime = process.hrtime || _hrtime

// @ts-expect-error
const initialTime = hrtime()

export function monotonicTime(): number {
  const [seconds, nanoseconds] = hrtime(initialTime)
  return seconds * 1000 + ((nanoseconds / 1000) | 0) / 1000
}
