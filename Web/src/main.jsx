import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'
import App from './App.jsx'

const originOf = (value) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

// Production only: a caching worker in front of the dev server would serve
// yesterday's bundle over hot reload. After load, so it never competes with
// the first paint for a school access point's bandwidth.
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    // The worker cannot read import.meta.env, so the two origins it treats
    // differently — Supabase, which it gives up on quickly, and the school's
    // own server, which it never touches — travel with the script URL.
    const url = new URL('/sw.js', window.location.href)
    const supabase = originOf(import.meta.env.VITE_SUPABASE_URL)
    const backend = originOf(import.meta.env.VITE_SERVER_URL)
    if (supabase) url.searchParams.set('supabase', supabase)
    if (backend) url.searchParams.set('backend', backend)

    // A browser that refuses to register is a browser that runs the app online
    // exactly as before, so there is nothing here worth interrupting anyone for.
    navigator.serviceWorker.register(url.href).catch(() => {})
  })
}

if (import.meta.env.PROD) registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)


