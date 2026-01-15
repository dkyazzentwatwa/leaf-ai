import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { OfflineIndicator } from './OfflineIndicator'
import { ToastContainer } from '@/components/ToastContainer'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <OfflineIndicator />
      <ToastContainer />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
