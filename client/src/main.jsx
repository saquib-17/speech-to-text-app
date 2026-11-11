import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Optional helper for automated visual inspection & testing
const params = new URLSearchParams(window.location.search);
const demoToken = params.get("demo_token");
if (demoToken) {
  localStorage.setItem("speechscribe_token", demoToken);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
