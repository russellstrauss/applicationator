// Polyfill for CommonJS 'module' object - must be imported first
import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './services/logger'

// Initialize logger early to capture all console output
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

