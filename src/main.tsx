import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
console.log("ENV:", import.meta.env);
console.log("CLIENT ID:", import.meta.env.VITE_APP_GOOGLE_CLIENT_ID);