import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowNotification(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showNotification && isOnline) return null

  return (
    <div
      className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-black'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="text-sm font-medium">{t('common.online')}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">{t('common.offline')}</span>
        </>
      )}
    </div>
  )
}
