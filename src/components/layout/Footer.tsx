import { useTranslation } from 'react-i18next'
import { Leaf, Github, Heart, Mail, Coffee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_CONFIG } from '@/core/config/app.config'

export function Footer() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/20 bg-secondary/20 no-print mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and tagline */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Leaf AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'es'
                ? 'Tu asistente de IA privado, ejecutándose completamente en tu navegador.'
                : 'Your private AI assistant, running entirely in your browser.'}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {lang === 'es' ? 'Navegación' : 'Navigation'}
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/about" className="hover:text-primary transition-colors w-fit">
                {lang === 'es' ? 'Acerca de' : 'About'}
              </Link>
              {APP_CONFIG.links.github && (
                <a
                  href={APP_CONFIG.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 w-fit"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>

          {/* Made by */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {lang === 'es' ? 'Creado por' : 'Built by'}
            </h3>
            <a
              href="https://flow-club.techtiff.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-primary transition-colors w-fit"
            >
              the AI Flow Club
            </a>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {lang === 'es' ? 'Soporte' : 'Support'}
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="mailto:david@techtiff.ai"
                className="hover:text-primary transition-colors inline-flex items-center gap-2 w-fit"
              >
                <Mail className="h-4 w-4" />
                <span>{lang === 'es' ? 'Contacto' : 'Contact'}</span>
              </a>
              <a
                href="https://buymeacoffee.com/littlehakr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-2 w-fit"
              >
                <Coffee className="h-4 w-4" />
                <span>Buy me a Coffee</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            {lang === 'es' ? 'Hecho con' : 'Made with'}
            <Heart className="h-3.5 w-3.5 text-primary" />
            {lang === 'es' ? 'para un mundo más privado' : 'for a more private world'}
          </p>
          <p>
            © {currentYear} Leaf AI · v{APP_CONFIG.version}
          </p>
        </div>
      </div>
    </footer>
  )
}
