import { useTranslation } from 'react-i18next'
import { Leaf, Lock, Cpu, Globe, Github, Heart } from 'lucide-react'

export function About() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Leaf className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">
          {lang === 'es' ? 'Acerca de Leaf AI' : 'About Leaf AI'}
        </h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {/* Mission */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {lang === 'es' ? 'Nuestra Misión' : 'Our Mission'}
          </h2>
          <p>
            {lang === 'es'
              ? 'Leaf AI es un asistente de inteligencia artificial que se ejecuta completamente en tu navegador. Creemos que la IA debería ser privada, accesible y gratuita para todos.'
              : 'Leaf AI is an artificial intelligence assistant that runs entirely in your browser. We believe AI should be private, accessible, and free for everyone.'}
          </p>
        </section>

        {/* Core Principles */}
        <section className="mb-8">
          <h2>{lang === 'es' ? 'Principios Fundamentales' : 'Core Principles'}</h2>

          <div className="grid gap-4 not-prose">
            <div className="flex gap-4 p-4 border border-border rounded-lg">
              <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">
                  {lang === 'es' ? 'Privacidad Primero' : 'Privacy First'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'es'
                    ? 'Tus conversaciones nunca salen de tu dispositivo. Sin seguimiento, sin análisis, sin recopilación de datos.'
                    : 'Your conversations never leave your device. No tracking, no analytics, no data collection.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-border rounded-lg">
              <Cpu className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">
                  {lang === 'es' ? 'IA Local' : 'Local AI'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'es'
                    ? 'El modelo de IA se descarga y se ejecuta en tu navegador usando WebGPU. Funciona sin conexión después de la descarga inicial.'
                    : 'The AI model is downloaded and runs in your browser using WebGPU. Works offline after initial download.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-border rounded-lg">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">
                  {lang === 'es' ? 'Accesible para Todos' : 'Accessible to All'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'es'
                    ? 'Gratis, de código abierto y diseñado para funcionar en dispositivos comunes.'
                    : 'Free, open source, and designed to work on everyday devices.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-border rounded-lg">
              <Github className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">
                  {lang === 'es' ? 'Código Abierto' : 'Open Source'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'es'
                    ? 'Código completamente transparente y auditable. Construido por la comunidad, para la comunidad.'
                    : 'Completely transparent and auditable code. Built by the community, for the community.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-8">
          <h2>{lang === 'es' ? 'Tecnología' : 'Technology'}</h2>
          <p>
            {lang === 'es'
              ? 'Leaf AI está construido como una Aplicación Web Progresiva (PWA) usando tecnologías web modernas. La IA funciona gracias a WebLLM, que permite ejecutar modelos de lenguaje grandes directamente en tu navegador usando aceleración GPU.'
              : 'Leaf AI is built as a Progressive Web App (PWA) using modern web technologies. The AI is powered by WebLLM, which enables running large language models directly in your browser using GPU acceleration.'}
          </p>
          <p>
            {lang === 'es'
              ? 'Esto significa que una vez que el modelo se descarga, no necesitas conexión a Internet para usar el asistente de IA.'
              : 'This means once the model is downloaded, you don\'t need an internet connection to use the AI assistant.'}
          </p>
        </section>

        {/* Requirements */}
        <section className="mb-8">
          <h2>{lang === 'es' ? 'Requisitos' : 'Requirements'}</h2>
          <ul>
            <li>
              {lang === 'es'
                ? 'Navegador moderno con soporte WebGPU (Chrome 113+, Edge 113+)'
                : 'Modern browser with WebGPU support (Chrome 113+, Edge 113+)'}
            </li>
            <li>
              {lang === 'es'
                ? 'GPU dedicada o integrada para mejor rendimiento'
                : 'Dedicated or integrated GPU for best performance'}
            </li>
            <li>
              {lang === 'es'
                ? '~2GB de espacio de almacenamiento para el modelo'
                : '~2GB of storage space for the model'}
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>
          {lang === 'es'
            ? 'Hecho con cuidado para un mundo más privado.'
            : 'Made with care for a more private world.'}
        </p>
      </div>
    </div>
  )
}
