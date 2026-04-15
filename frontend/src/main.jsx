import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GalaxyProvider } from './context/GalaxyContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GalaxyProvider>
      <App />
    </GalaxyProvider>
  </React.StrictMode>,
)