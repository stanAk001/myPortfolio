import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adminPlugin from './admin/vite-admin.js'

/*
  Link previews need absolute URLs (og:image, og:url, canonical). index.html uses __SITE_URL__ and
  this fills it in at build time: SITE_URL if you set it (e.g. a custom domain), otherwise the
  production domain Vercel gives the project. Locally it falls back to relative paths.
*/
const siteUrl = () => {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (!raw) return ''
  return (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/+$/, '')
}

const siteUrlPlugin = () => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl()),
})

export default defineConfig({
  plugins: [react(), adminPlugin(), siteUrlPlugin()],
})
