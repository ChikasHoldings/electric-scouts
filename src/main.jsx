import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { preloadPageForPath } from '@/pages.config'
import '@/index.css'

const container = document.getElementById('root')

/**
 * Drop the crawler payload before mounting.
 *
 * Public pages are prerendered with a readable summary inside #root for agents
 * that do not run JavaScript (see src/seo/render.js). A stylesheet already
 * stops the browser painting it, so this removal is not what prevents the load
 * flash — it stops the hidden markup lingering in the DOM and the accessibility
 * tree behind the mounted app, where a screen reader would still reach a second
 * copy of every heading and link on the page.
 */
container?.querySelector('[data-seo-prerender]')?.remove()

/**
 * Mount once the landed-on route can render its real content.
 *
 * Every page except the homepage is a lazy chunk, so rendering immediately
 * guaranteed a second flash on direct loads: the layout appeared, the Suspense
 * boundary painted a spinner over most of the viewport, and only then did the
 * page arrive. Waiting for the one chunk this URL needs turns that into a
 * single paint. It is a wait on a real dependency, not a timer — a chunk that
 * fails resolves anyway and the Suspense boundary takes over as before.
 */
preloadPageForPath(window.location.pathname).then(() => {
  ReactDOM.createRoot(container).render(
    // <React.StrictMode>
    <App />
    // </React.StrictMode>,
  )
})

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



