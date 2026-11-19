import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from './router'
import { startSmoothScroll } from './lib/smooth'
import { markReady } from './lib/loaded'
// The welcome page. (src/pages/Entrance was the old door; it's retired but kept.)
import Welcome from './pages/Welcome/Welcome'
import CommandPalette from './components/CommandPalette/CommandPalette'
import { getProject } from './data/projects'
import { returning } from './lib/visit'
import Navigation from './components/Navigation/Navigation'
import Cursor from './components/Cursor/Cursor'
import XRay from './components/XRay/XRay'
import Footer from './components/Footer/Footer'
import Atmosphere from './components/Atmosphere/Atmosphere'
import Home from './pages/Home'
import ProjectPage from './pages/ProjectPage/ProjectPage'
import StudioPage from './pages/StudioPage/StudioPage'
import TheBox from './pages/TheBox/TheBox'
import NotFound from './pages/NotFound'

// The admin only exists on the local dev server; in production builds this is null and the
// whole admin bundle is dropped, so /admin is just a 404 on the live site.
const Admin = import.meta.env.DEV ? lazy(() => import('./pages/Admin/Admin')) : null

const isDoor = (path) => path === '/' || path === ''

/*
  Returning visitors skip the dark room and go straight to /work, where the hero says welcome back.
  Add ?room to the URL to see the room anyway.
*/
if (returning && isDoor(window.location.pathname)) {
  if (new URLSearchParams(window.location.search).has('room')) history.replaceState(null, '', '/')
  else history.replaceState(null, '', `/work${window.location.hash}`)
}


function resolve(path) {
  if (/^\/work\/?$/.test(path)) return <Home />
  if (/^\/studio\/?$/.test(path)) return <StudioPage />
  if (/^\/studio\/thebox-lounge\/?$/.test(path)) return <TheBox />
  const match = path.match(/^\/work\/([\w-]+)\/?$/)
  const project = match && getProject(match[1])
  if (project) return <ProjectPage key={project.id} project={project} />
  return <NotFound />
}

function Site({ path }) {
  useEffect(startSmoothScroll, [])
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navigation />
      <main id="main" tabIndex={-1}>
        {resolve(path)}
      </main>
      <Footer />
      <Atmosphere />
      <Cursor />
      <XRay />
      <CommandPalette />
    </>
  )
}

export default function App() {
  const { path, navigate } = useRouter()
  // While true, the welcome stays on top of /work until its exit animation finishes.
  const [curtain, setCurtain] = useState(false)
  const atDoor = isDoor(path)

  // Landed directly on a portfolio URL, so there's nothing to wait for.
  useEffect(() => {
    if (!isDoor(window.location.pathname)) markReady()
  }, [])

  // Mount the portfolio underneath straight away (on the product the visitor picked) and let the
  // welcome animate itself out on top. No view transition needed.
  const enter = useCallback(
    (id) => {
      try {
        if (id) sessionStorage.setItem('hero:start', id)
      } catch {
        // Storage blocked: the hero just starts on the first product.
      }
      setCurtain(true)
      navigate('/work', { transition: false })
    },
    [navigate],
  )
  const gone = useCallback(() => setCurtain(false), [])

  if (Admin && /^\/admin\/?$/.test(path)) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    )
  }
  return (
    <>
      {!atDoor && <Site path={path} />}
      {(atDoor || curtain) && <Welcome exiting={curtain && !atDoor} onEnter={enter} onGone={gone} />}
    </>
  )
}
