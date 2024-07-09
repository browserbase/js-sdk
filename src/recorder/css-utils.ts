export function cssEscape(s: string): string {
  let result = ''
  for (let i = 0; i < s.length; i++) result += cssEscapeOne(s, i)
  return result
}

export function quoteCSSAttributeValue(text: string): string {
  return `"${cssEscape(text).replace(/\\ /g, ' ')}"`
}

function cssEscapeOne(s: string, i: number): string {
  // https://drafts.csswg.org/cssom/#serialize-an-identifier
  const c = s.charCodeAt(i)
  if (c === 0x0000) return '\uFFFD'
  if (
    (c >= 0x0001 && c <= 0x001f) ||
    (c >= 0x0030 &&
      c <= 0x0039 &&
      (i === 0 || (i === 1 && s.charCodeAt(0) === 0x002d)))
  )
    return '\\' + c.toString(16) + ' '
  if (i === 0 && c === 0x002d && s.length === 1) return '\\' + s.charAt(i)
  if (
    c >= 0x0080 ||
    c === 0x002d ||
    c === 0x005f ||
    (c >= 0x0030 && c <= 0x0039) ||
    (c >= 0x0041 && c <= 0x005a) ||
    (c >= 0x0061 && c <= 0x007a)
  )
    return s.charAt(i)
  return '\\' + s.charAt(i)
}
