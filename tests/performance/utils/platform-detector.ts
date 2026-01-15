export type Platform = 'ios' | 'android' | 'desktop'

export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}
