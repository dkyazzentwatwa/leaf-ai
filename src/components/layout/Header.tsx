import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, Settings, Info, MessageCircle } from 'lucide-react'
import { LanguageSwitcher } from '@/features/common/LanguageSwitcher'
import { ThemeToggle } from '@/features/common/ThemeToggle'
import { ModelStatusBadge } from '@/features/ai/components/ModelStatusBadge'
import { cn } from '@/utils/cn'

export function Header() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const navItems = [
    { to: '/', icon: MessageCircle, label: lang === 'es' ? 'Chat' : 'Chat' },
    { to: '/settings', icon: Settings, label: lang === 'es' ? 'Configuración' : 'Settings' },
    { to: '/about', icon: Info, label: lang === 'es' ? 'Acerca de' : 'About' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity group">
            <Leaf className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <span className="font-bold text-xl tracking-tight">
              Leaf AI
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                  location.pathname === to
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
            <div className="ml-4 flex items-center gap-3 pl-4 border-l border-border/40">
              <ModelStatusBadge />
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
