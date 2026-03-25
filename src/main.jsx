import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RelanicTranslator from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RelanicTranslator />
  </StrictMode>
)
