import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { htmlLang, t } from './i18n/index.ts'
import './index.css'

document.documentElement.lang = htmlLang
document.title = t('app.title')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
