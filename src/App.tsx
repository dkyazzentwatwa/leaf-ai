import { BrowserRouter } from 'react-router-dom'
import './core/config/i18n.config'
import { AppRouter } from './core/router/routes'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
