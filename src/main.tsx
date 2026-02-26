import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { AuthProvider } from './contexts/AuthContext'
import { App } from './App'

const container = document.querySelector<HTMLDivElement>('#app')

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>,
  )
}

