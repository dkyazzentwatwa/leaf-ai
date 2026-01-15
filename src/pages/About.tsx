import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Leaf, Lock, Cpu, Globe, Github, Heart, ChevronDown, Sparkles, Zap, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-left">{title}</h3>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 space-y-3 text-sm sm:text-base text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )
}

export function About() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl">
            <Leaf className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent">
          {lang === 'es' ? 'Acerca de Leaf AI' : 'About Leaf AI'}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {lang === 'es'
            ? 'Tu asistente de IA privado, potente y completamente gratuito'
            : 'Your private, powerful, and completely free AI assistant'}
        </p>
      </div>

      {/* Mission Statement */}
      <div className="mb-6 sm:mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-start gap-3 mb-3">
          <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <h2 className="text-xl sm:text-2xl font-bold">
            {lang === 'es' ? 'Nuestra Misión' : 'Our Mission'}
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {lang === 'es'
            ? 'Leaf AI democratiza el acceso a la inteligencia artificial ejecutándose completamente en tu navegador. Creemos que la IA debe ser privada, accesible y gratuita para todos, sin comprometer tu privacidad ni depender de servidores externos.'
            : 'Leaf AI democratizes access to artificial intelligence by running entirely in your browser. We believe AI should be private, accessible, and free for everyone—without compromising your privacy or relying on external servers.'}
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 mb-6 sm:mb-8">
        <div className="p-4 sm:p-5 border border-border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">
              {lang === 'es' ? '100% Privado' : '100% Private'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'es'
              ? 'Tus conversaciones nunca salen de tu dispositivo. Cero seguimiento, cero servidores.'
              : 'Your conversations never leave your device. Zero tracking, zero servers.'}
          </p>
        </div>

        <div className="p-4 sm:p-5 border border-border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">
              {lang === 'es' ? 'IA Local' : 'Local AI'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'es'
              ? 'Funciona sin conexión usando WebGPU para aceleración por GPU.'
              : 'Works offline using WebGPU for GPU acceleration.'}
          </p>
        </div>

        <div className="p-4 sm:p-5 border border-border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">
              {lang === 'es' ? 'Ultra Rápido' : 'Ultra Fast'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'es'
              ? 'Respuestas instantáneas sin latencia de red o límites de API.'
              : 'Instant responses with no network latency or API limits.'}
          </p>
        </div>

        <div className="p-4 sm:p-5 border border-border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Globe className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">
              {lang === 'es' ? 'Código Abierto' : 'Open Source'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'es'
              ? 'Código transparente y auditable. Construido por la comunidad.'
              : 'Transparent and auditable code. Built by the community.'}
          </p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
        {/* Available Models */}
        <CollapsibleSection
          title={lang === 'es' ? 'Modelos Disponibles' : 'Available Models'}
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                {lang === 'es' ? 'Modelos para iOS 26+ (iPhone/iPad)' : 'iOS 26+ Models (iPhone/iPad)'}
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">SmolLM2 135M (q0)</strong> - ~360MB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Ultra compacto, recomendado para iOS. 2-3 tok/seg en iPhone 17 Pro.'
                        : 'Ultra-compact, recommended for iOS. 2-3 tok/sec on iPhone 17 Pro.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">SmolLM2 360M (q4)</strong> - ~376MB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Modelo pequeño de 4 bits para iOS. 2-3 tok/seg en iPhone 17 Pro.'
                        : 'Small 4-bit model for iOS. 2-3 tok/sec on iPhone 17 Pro.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">TinyLlama 1.1B (q4)</strong> - ~697MB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Modelo compacto para iPhones más nuevos. 1-2 tok/seg.'
                        : 'Compact model for newer iPhones. 1-2 tok/sec.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Qwen 2.5 0.5B (q4)</strong> - ~945MB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Mejor calidad para iOS (avanzado). 1-2 tok/seg en iPhone 17 Pro.'
                        : 'Best quality iOS model (advanced). 1-2 tok/sec on iPhone 17 Pro.'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                {lang === 'es' ? 'Modelos para Escritorio/Android' : 'Desktop/Android Models'}
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Llama 3.2 3B (q4)</strong> - ~2.3GB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Mejor calidad, recomendado para escritorio. 3-7 tok/seg.'
                        : 'Best quality, recommended for desktop. 3-7 tok/sec.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Gemma 2 2B (q4)</strong> - ~1.9GB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Modelo eficiente de Google. 3-6 tok/seg.'
                        : 'Google\'s efficient model. 3-6 tok/sec.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Llama 3.2 1B (q4)</strong> - ~1.1GB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Llama compacto. 5-8 tok/seg.'
                        : 'Compact Llama model. 5-8 tok/sec.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Phi 3.5 Mini (q4)</strong> - ~1.5GB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Buen equilibrio de calidad y tamaño. 4-6 tok/seg.'
                        : 'Good balance of quality and size. 4-6 tok/sec.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Qwen 2.5 1.5B (q4)</strong> - ~1GB
                    <p className="text-xs mt-0.5">
                      {lang === 'es'
                        ? 'Modelo completo más pequeño. 5-7 tok/seg.'
                        : 'Smallest full model. 5-7 tok/sec.'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs sm:text-sm">
                <strong className="text-foreground">{lang === 'es' ? 'Nota:' : 'Note:'}</strong>{' '}
                {lang === 'es'
                  ? 'Todos los modelos usan cuantización de 4 bits (q4f16) o 2 bits (q0f16) para máxima eficiencia. Los modelos se descargan una vez y se almacenan en caché localmente. El modelo Qwen 0.5B es experimental en iOS y puede causar problemas de memoria en dispositivos más antiguos.'
                  : 'All models use 4-bit (q4f16) or 2-bit (q0f16) quantization for maximum efficiency. Models download once and cache locally. The Qwen 0.5B model is experimental on iOS and may cause memory issues on older devices.'}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Technology Stack */}
        <CollapsibleSection
          title={lang === 'es' ? 'Tecnología' : 'Technology'}
          icon={<Cpu className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-3">
            <p>
              {lang === 'es'
                ? 'Leaf AI está construido como una Aplicación Web Progresiva (PWA) usando tecnologías web de vanguardia:'
                : 'Leaf AI is built as a Progressive Web App (PWA) using cutting-edge web technologies:'}
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong className="text-foreground">WebLLM + MLC</strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Framework que permite ejecutar LLMs en el navegador con aceleración GPU'
                      : 'Framework for running LLMs in-browser with GPU acceleration'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong className="text-foreground">WebGPU</strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'API moderna de GPU para procesamiento de alta velocidad'
                      : 'Modern GPU API for high-speed processing'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong className="text-foreground">React + TypeScript</strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Framework moderno para interfaces de usuario reactivas'
                      : 'Modern framework for reactive user interfaces'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong className="text-foreground">IndexedDB</strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Almacenamiento local para modelos y conversaciones'
                      : 'Local storage for models and conversations'}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </CollapsibleSection>

        {/* Security Features */}
        <CollapsibleSection
          title={lang === 'es' ? 'Características de Seguridad' : 'Security Features'}
          icon={<Shield className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-3">
            <p>
              {lang === 'es'
                ? 'Leaf AI implementa múltiples capas de seguridad para proteger tus datos y privacidad:'
                : 'Leaf AI implements multiple layers of security to protect your data and privacy:'}
            </p>
            <ul className="space-y-2 ml-6 list-none">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Sanitización de Contenido' : 'Content Sanitization'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Todas las salidas de IA son sanitizadas para prevenir ataques XSS usando APIs nativas del navegador (DOMParser, TreeWalker).'
                      : 'All AI outputs are sanitized to prevent XSS attacks using native browser security APIs (DOMParser, TreeWalker).'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Encriptación End-to-End (Opcional)' : 'End-to-End Encryption (Optional)'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Encriptación AES-256-GCM para todas las conversaciones en reposo. Tu contraseña nunca sale de tu dispositivo. Habilita en Configuración.'
                      : 'AES-256-GCM encryption for all conversations at rest. Your password never leaves your device. Enable in Settings.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Política de Seguridad de Contenido' : 'Content Security Policy'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Headers CSP estrictos previenen inyección de scripts y carga de recursos no autorizados.'
                      : 'Strict CSP headers prevent script injection and unauthorized resource loading.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Validación Segura de Archivos' : 'Secure File Validation'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Los archivos subidos son validados por tamaño, tipo y contenido antes de procesarlos. Límite de 5MB.'
                      : 'File uploads are validated for size, type, and content before processing. 5MB limit.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Borrado Seguro' : 'Secure Deletion'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'Las conversaciones eliminadas son borradas criptográficamente del almacenamiento del navegador.'
                      : 'Deleted conversations are cryptographically erased from browser storage.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <div>
                  <strong className="text-foreground">
                    {lang === 'es' ? 'Aislamiento de Workers' : 'Worker Isolation'}
                  </strong>
                  <p className="text-xs mt-0.5">
                    {lang === 'es'
                      ? 'El procesamiento de IA corre en Web Workers aislados con validación de mensajes.'
                      : 'AI processing runs in isolated Web Workers with message validation.'}
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs">
                <strong>
                  {lang === 'es' ? 'Detalles Técnicos:' : 'Technical Details:'}
                </strong>{' '}
                {lang === 'es'
                  ? 'Leaf AI usa la API nativa Web Crypto para encriptación, DOMParser para sanitización de contenido, y sigue las mejores prácticas de seguridad de OWASP. Todas las características de seguridad están implementadas sin dependencias externas para mantener nuestra filosofía local-first.'
                  : 'Leaf AI uses native Web Crypto API for encryption, DOMParser for content sanitization, and follows OWASP security best practices. All security features are implemented without external dependencies to maintain our local-first philosophy.'}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Requirements */}
        <CollapsibleSection
          title={lang === 'es' ? 'Requisitos del Sistema' : 'System Requirements'}
          icon={<Shield className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                {lang === 'es' ? 'Navegadores Compatibles:' : 'Compatible Browsers:'}
              </h4>
              <ul className="space-y-1 ml-6 text-sm">
                <li>• Chrome 113+ (Windows/Mac/Linux/Android)</li>
                <li>• Edge 113+ (Windows/Mac)</li>
                <li>• Safari 26+ / iOS 26+ (iPhone/iPad - WebGPU support)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                {lang === 'es' ? 'Hardware Recomendado:' : 'Recommended Hardware:'}
              </h4>
              <ul className="space-y-1 ml-6 text-sm">
                <li>
                  • <strong>iOS:</strong> {lang === 'es' ? 'iPhone 15+ o iPad con iOS 26+' : 'iPhone 15+ or iPad with iOS 26+'}
                </li>
                <li>
                  • <strong>Desktop:</strong> {lang === 'es' ? 'GPU dedicada o integrada (AMD/NVIDIA/Intel)' : 'Dedicated or integrated GPU (AMD/NVIDIA/Intel)'}
                </li>
                <li>
                  • <strong>{lang === 'es' ? 'Almacenamiento:' : 'Storage:'}</strong> {lang === 'es' ? '360MB-2.3GB (360MB-945MB en iOS)' : '360MB-2.3GB (360MB-945MB on iOS)'}
                </li>
                <li>
                  • <strong>RAM:</strong> {lang === 'es' ? '4GB+ recomendado (2GB mínimo para iOS)' : '4GB+ recommended (2GB minimum for iOS)'}
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* Privacy & Security */}
        <CollapsibleSection
          title={lang === 'es' ? 'Privacidad y Seguridad' : 'Privacy & Security'}
          icon={<Lock className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-3">
            <p>
              {lang === 'es'
                ? 'Leaf AI está diseñado desde cero con la privacidad como prioridad absoluta:'
                : 'Leaf AI is designed from the ground up with privacy as the top priority:'}
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>
                  {lang === 'es'
                    ? 'Todo el procesamiento ocurre localmente en tu dispositivo'
                    : 'All processing happens locally on your device'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>
                  {lang === 'es'
                    ? 'Ninguna conversación se envía a servidores externos'
                    : 'No conversations are sent to external servers'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>
                  {lang === 'es'
                    ? 'Sin cookies de seguimiento ni análisis de terceros'
                    : 'No tracking cookies or third-party analytics'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>
                  {lang === 'es'
                    ? 'Datos almacenados solo en IndexedDB local del navegador'
                    : 'Data stored only in browser\'s local IndexedDB'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>
                  {lang === 'es'
                    ? 'Código fuente abierto y auditable'
                    : 'Open source and auditable codebase'}
                </span>
              </li>
            </ul>
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="mt-8 sm:mt-12 pt-6 border-t border-border">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>
              {lang === 'es'
                ? 'Hecho con cuidado por '
                : 'Made with care by '}
              <strong className="text-foreground">Cypher</strong>
            </span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/dkyazzentwatwa/leaf-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              {lang === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
            </a>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {lang === 'es'
              ? 'Código abierto bajo licencia MIT. Contribuciones bienvenidas.'
              : 'Open source under MIT license. Contributions welcome.'}
          </p>
        </div>
      </div>
    </div>
  )
}
