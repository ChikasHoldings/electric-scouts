import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary'
import { preloadPageForPath } from '@/pages.config'
import { preloadAdminForPath } from '@/admin.config'
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
 *
 * Exactly one of these two does any work: an admin URL matches no public page
 * and a public URL matches no admin screen. They run together rather than in
 * sequence so neither waits on the other's lookup.
 */
Promise.all([
  preloadPageForPath(window.location.pathname),
  preloadAdminForPath(window.location.pathname),
]).then(() => {
  ReactDOM.createRoot(container).render(
    /**
     * The boundary was written and never mounted, so any render error anywhere
     * in the tree unmounted React and left the visitor on a blank white page
     * with no way back. It now catches at the root and offers a recovery path.
     */
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
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



