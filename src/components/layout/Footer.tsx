import { useTranslation } from 'react-i18next'
import { Leaf, Github, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_CONFIG } from '@/core/config/app.config'

export function Footer() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-muted/30 no-print">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and tagline */}
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-semibold">Leaf AI</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">
              — {lang === 'es' ? 'IA privada para todos' : 'Private AI for everyone'}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              {lang === 'es' ? 'Acerca de' : 'About'}
            </Link>
            {APP_CONFIG.links.github && (
              <a
                href={APP_CONFIG.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            {lang === 'es' ? 'Hecho con' : 'Made with'}
            <Heart className="h-3 w-3 text-red-500" />
            {lang === 'es' ? 'para un mundo más privado' : 'for a more private world'}
          </p>
          <p className="mt-1">
            © {currentYear} Leaf AI · v{APP_CONFIG.version}
          </p>
        </div>
      </div>
    </footer>
  )
}
