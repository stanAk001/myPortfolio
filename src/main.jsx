import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from './router.jsx'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/base.css'
import './styles/motion.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </StrictMode>,
)
