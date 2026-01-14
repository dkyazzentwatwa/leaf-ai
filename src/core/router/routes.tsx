import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'

// Pages
import { Chat } from '@/pages/Chat'
import { Settings } from '@/pages/Settings'
import { About } from '@/pages/About'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Chat />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  )
}
