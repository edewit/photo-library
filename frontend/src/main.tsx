import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Set initial theme class before React renders
const savedTheme = localStorage.getItem('photo-library-theme') || 'dark';
document.documentElement.classList.add(`pf-v5-theme-${savedTheme}`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
