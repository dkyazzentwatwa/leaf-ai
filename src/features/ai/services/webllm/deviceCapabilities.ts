export type Platform = 'ios' | 'android' | 'desktop'
export type DeviceTier = 'low-end' | 'mid-range' | 'high-end'

export const IOS_WEBGPU_MIN_VERSION = 26

export interface RAMDetection {
  actual: number | null
  estimated: number
  tier: DeviceTier
}

export interface BasicDeviceCapabilities {
  platform: Platform
  iosVersion: number | null
  androidVersion: number | null
  chromeVersion: number | null
  estimatedRAM: number
  actualRAM: number | null
  deviceTier: DeviceTier
  webGPUAvailable: boolean
  deviceName: string
}

export function isIOSDevice(nav: Navigator = navigator): boolean {
  const ua = nav.userAgent
  const isIOSUA = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS = nav.platform === 'MacIntel' && nav.maxTouchPoints > 1
  return isIOSUA || isIPadOS
}

export function getIOSSafariVersion(nav: Navigator = navigator): number | null {
  const ua = nav.userAgent

  const safariMatch = ua.match(/Version\/(\d+)/)
  if (safariMatch) {
    return parseInt(safariMatch[1], 10)
  }

  const iosMatch = ua.match(/OS (\d+)[_\d]*/)
  if (iosMatch) {
    return parseInt(iosMatch[1], 10)
  }

  return null
}

export function supportsRequiredIOSWebGPUVersion(
  nav: Navigator = navigator,
  minVersion = IOS_WEBGPU_MIN_VERSION
): boolean {
  const version = getIOSSafariVersion(nav)
  const navWithGPU = nav as Navigator & { gpu?: GPU }

  // If browser exposes WebGPU and version is unavailable, allow a runtime check.
  if (version === null && navWithGPU.gpu) {
    return true
  }

  return version !== null && version >= minVersion
}

export function classifyDeviceTier(ramGB: number): DeviceTier {
  if (ramGB < 4) return 'low-end'
  if (ramGB < 8) return 'mid-range'
  return 'high-end'
}

export function detectRAM(nav: Navigator = navigator, screenObj: Screen = window.screen): RAMDetection {
  const actualRAM = (nav as Navigator & { deviceMemory?: number }).deviceMemory ?? null

  if (actualRAM !== null) {
    return {
      actual: actualRAM,
      estimated: actualRAM,
      tier: classifyDeviceTier(actualRAM),
    }
  }

  const ua = nav.userAgent
  let estimated = 8

  if (isIOSDevice(nav)) {
    estimated = 6
  } else if (ua.includes('Android')) {
    const width = Math.max(screenObj.width, screenObj.height)
    const height = Math.min(screenObj.width, screenObj.height)

    if (width >= 1440 || height >= 1440) {
      estimated = 6
    } else if (width >= 1080 || height >= 1080) {
      estimated = 5
    } else {
      estimated = 3
    }
  }

  return {
    actual: null,
    estimated,
    tier: classifyDeviceTier(estimated),
  }
}

export function detectAndroidVersion(nav: Navigator = navigator): number | null {
  const match = nav.userAgent.match(/Android (\d+)/)
  return match ? parseInt(match[1], 10) : null
}

export function detectChromeVersion(nav: Navigator = navigator): number | null {
  const match = nav.userAgent.match(/Chrome\/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

export function detectPlatform(nav: Navigator = navigator): Platform {
  if (isIOSDevice(nav)) return 'ios'
  if (nav.userAgent.includes('Android')) return 'android'
  return 'desktop'
}

export function getDeviceName(nav: Navigator = navigator): string {
  const ua = nav.userAgent

  if (ua.includes('iPhone')) {
    if (ua.includes('iPhone17')) return 'iPhone 17 Pro'
    if (ua.includes('iPhone16')) return 'iPhone 16 Pro'
    if (ua.includes('iPhone15')) return 'iPhone 15 Pro'
    return 'iPhone'
  }

  if (ua.includes('iPad')) {
    return 'iPad'
  }

  if (ua.includes('Android')) {
    return 'Android Device'
  }

  return 'Desktop'
}

export function detectBasicDeviceCapabilities(nav: Navigator = navigator): BasicDeviceCapabilities {
  const platform = detectPlatform(nav)
  const iosVersion = platform === 'ios' ? getIOSSafariVersion(nav) : null
  const ramInfo = detectRAM(nav)
  const navWithGPU = nav as Navigator & { gpu?: GPU }

  return {
    platform,
    iosVersion,
    androidVersion: detectAndroidVersion(nav),
    chromeVersion: detectChromeVersion(nav),
    estimatedRAM: ramInfo.estimated,
    actualRAM: ramInfo.actual,
    deviceTier: ramInfo.tier,
    webGPUAvailable: !!navWithGPU.gpu,
    deviceName: getDeviceName(nav),
  }
}
