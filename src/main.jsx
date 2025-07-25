import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
// Register the service worker
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true }) // or omit options
createRoot(document.getElementById('root')).render(
   <BrowserRouter>
    <App />
  </BrowserRouter>,
)
