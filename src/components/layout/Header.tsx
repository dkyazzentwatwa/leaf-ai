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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
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
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-2 pl-2 border-l border-border">
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
