import { useLayoutEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { scrollToEl, scrollToY } from '../lib/smooth'
import { site } from '../data/site'
import { GalleryIntro, Profile } from '../sections/Gallery/Gallery'
import Projects from '../sections/Projects/Projects'
import QuickCut from '../sections/Studio/QuickCut'
import Solved from '../sections/Solved/Solved'
import Contact from '../sections/Contact/Contact'

/*
  The /work page: the hero reel, the projects, the studio teaser (an ad cut live in the browser),
  how things get built, about, and contact.
  Older sections (Showreel, Story, Problems, Marquee, SelectedWork, Lab, GitHubLive,
  CurrentlyBuilding, About, BugHunt, Planner, Skills, Engineering and the Projects end credits) are
  still in src/sections and can each be added back with one line.
*/

export default function Home() {
  // Runs after every section has set up its ScrollTriggers (child effects run first), so pin
  // spacing is known before we restore the saved scroll position.
  useLayoutEffect(() => {
    document.title = `${site.name} — ${site.role}`
    ScrollTrigger.refresh()

    const saved = history.state?.scrollY
    const hash = window.location.hash.slice(1)
    const target = hash && document.getElementById(hash)
    if (typeof saved === 'number') scrollToY(saved, { immediate: true })
    else if (target) scrollToEl(target, { immediate: true })
    else scrollToY(0, { immediate: true })

    // Jump scrubbed animations straight to their spot instead of visibly catching up.
    ScrollTrigger.update()
    ScrollTrigger.getAll().forEach((st) => st.animation?.progress(st.progress))

    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <GalleryIntro />
      <Projects />
      <QuickCut />
      <Solved />
      <Profile />
      <Contact />
    </>
  )
}
