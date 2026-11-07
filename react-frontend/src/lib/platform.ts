/**
 * iPhone and iPad. Every browser there is Safari underneath and none of them offers an install
 * prompt, so people add the app from the Share sheet instead. iPadOS reports itself as a Mac.
 */
export function isIos(userAgent = navigator.userAgent, touchPoints = navigator.maxTouchPoints) {
  return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

export function isAndroid(userAgent = navigator.userAgent) {
  return /Android/.test(userAgent);
}
