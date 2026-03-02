import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Global reset
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.backgroundColor = '#FFFFFF';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
