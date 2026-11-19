import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { scrollToEl, scrollToY } from '../../lib/smooth'
import { featuredProjects as projects } from '../../data/projects'
import { site } from '../../data/site'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import Scene from './Scene'
import WorkWall from './WorkWall'
import { cx, pad } from '../../utils'
import './SelectedWork.css'

// Survives unmounting, so coming back from a project page lands on (and morphs into) the same scene.
let lastActive = 0

export default function SelectedWork() {
  const reduced = useReducedMotion()
  const roomy = useMediaQuery('(min-width: 900px) and (min-height: 620px)')
  const pinned = roomy && !reduced

  const reel = useRef(null)
  const timeline = useRef(null)
  const progressBar = useRef(null)
  const [active, setActive] = useState(lastActive)

  useLayoutEffect(() => {
    if (!pinned) return
    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray('.scene')
      const n = scenes.length

      const hideCopy = (scene) => {
        gsap.set(scene.querySelectorAll('.scene__title .split__char'), { yPercent: 115, rotate: 10 })
        gsap.set(scene.querySelectorAll('.scene__tagline .scene__line > span'), { yPercent: 112 })
        gsap.set(scene.querySelectorAll('.scene__meta, .scene__body'), { autoAlpha: 0, y: 30 })
      }
      const showCopy = (scene, at) =>
        tl
          .to(scene.querySelectorAll('.scene__title .split__char'), { yPercent: 0, rotate: 0, duration: 0.7, stagger: 0.025, ease: 'power3.out' }, at)
          .to(scene.querySelectorAll('.scene__tagline .scene__line > span'), { yPercent: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, at + 0.25)
          .to(scene.querySelectorAll('.scene__meta, .scene__body'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, at + 0.35)

      gsap.set('.scene__zoom', { transformPerspective: 1600 })
      scenes.forEach(hideCopy)
      scenes.slice(1).forEach((scene) => {
        gsap.set(scene, { clipPath: 'inset(100% 0% 0% 0%)' })
        gsap.set(scene.querySelector('.scene__zoom'), { scale: 1.2, rotationX: 16, yPercent: 14 })
      })

      const wall = reel.current.querySelector('.wall')
      const plane = wall.querySelector('.wall__plane')
      const centre = wall.querySelector('.wall__tile--centre')
      const firstScreen = scenes[0].querySelector('.pm')
      // Where the centre tile needs to land to sit exactly on the first project's screen.
      const fit = () => {
        const r = reel.current.getBoundingClientRect()
        const m = firstScreen.getBoundingClientRect()
        return {
          scale: m.width / centre.offsetWidth,
          x: m.left + m.width / 2 - (r.left + r.width / 2),
          y: m.top + m.height / 2 - (r.top + r.height / 2),
        }
      }
      gsap.set(plane, { xPercent: -50, yPercent: -50, transformPerspective: 1800 })
      gsap.set('.reel__rail', { autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: reel.current,
          start: 'top top',
          end: () => `+=${(n + 0.4) * window.innerHeight * 1.15}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          // Better to settle on a scene than stop halfway through a wipe.
          snap: { snapTo: 'labels', duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: 'power2.inOut' },
          onUpdate(self) {
            progressBar.current?.style.setProperty('--progress', self.progress)
            // self.animation, not `tl`: ScrollTrigger can fire this while the timeline is still being built.
            // Read scroll progress, not the timeline's time. With scrub the timeline lags behind, and the
            // last update can land before it catches up.
            const { labels } = self.animation
            const t = self.progress * self.animation.duration()
            let index = 0
            for (let i = 1; i < n; i++) if (t >= labels[`s${i}`] - 0.55) index = i
            if (index !== lastActive) {
              lastActive = index
              setActive(index)
            }
          },
        },
      })

      // Part one: the camera flies into the wall of screenshots and lands on the first project.
      tl.addLabel('intro')
        .fromTo(
          plane,
          { rotationX: 36, rotationY: 12, rotationZ: -14, scale: 0.6, x: 0, y: 0 },
          {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: () => fit().scale,
            x: () => fit().x,
            y: () => fit().y,
            duration: 1.7,
            ease: 'power2.inOut',
          },
          0,
        )
        .to('.wall__copy, .wall__shade', { autoAlpha: 0, yPercent: -12, duration: 0.55 }, 0.05)
        .to('.wall__tile:not(.wall__tile--centre)', { autoAlpha: 0, duration: 0.55, stagger: { each: 0.02, from: 'center' } }, 0.75)
        .to(wall, { backgroundColor: 'rgba(11,11,10,0)', duration: 0.5 }, 1.2)
        .set(wall, { autoAlpha: 0 }, 1.72)
        .to('.reel__rail', { autoAlpha: 1, duration: 0.4 }, 1.6)
      showCopy(scenes[0], 1.45)
      tl.addLabel('s0')

      for (let i = 1; i < n; i++) {
        const prev = scenes[i - 1]
        const next = scenes[i]
        const at = tl.duration() + 0.3 // a beat of stillness on each project before the next one cuts in

        // The old title lifts out letter by letter while its screen falls back into the dark...
        tl.to(prev.querySelector('.scene__zoom'), { scale: 0.82, yPercent: -10, rotationX: -10, duration: 1.1 }, at)
          .to(prev.querySelectorAll('.scene__title .split__char'), { yPercent: -115, rotate: -8, duration: 0.5, stagger: 0.02, ease: 'power2.in' }, at)
          .to(prev.querySelectorAll('.scene__meta, .scene__body'), { yPercent: -30, autoAlpha: 0, duration: 0.5 }, at)
          // ...and the next project wipes up over it, its screen tilting upright as it lands.
          .to(next, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, at + 0.1)
          .to(next.querySelector('.scene__zoom'), { scale: 1, rotationX: 0, yPercent: 0, duration: 1.3, ease: 'power3.out' }, at + 0.15)
        showCopy(next, at + 0.5)
        tl.addLabel(`s${i}`)
      }
      tl.to({}, { duration: 0.3 })
      timeline.current = tl
    }, reel)

    return () => {
      timeline.current = null
      ctx.revert()
    }
  }, [pinned])

  const goTo = useCallback(
    (index, smooth = true) => {
      const st = timeline.current?.scrollTrigger
      if (!st) {
        scrollToEl(document.getElementById(`project-${projects[index].id}`), { immediate: !smooth })
        return
      }
      scrollToY(st.labelToScroll(`s${index}`), { immediate: !smooth })
    },
    [],
  )

  return (
    <section id="work" className="work theme-dark" data-component="SelectedWork" aria-labelledby="work-title">
      {pinned ? (
        <h2 id="work-title" className="sr-only">
          Selected work
        </h2>
      ) : (
      <header className="work__head section">
        <Chapter number="02">Selected work</Chapter>
        <div className="work__head-grid grid">
          <Reveal as="h2" lines id="work-title" className="work__title display">
            <Lines
              lines={[
                'Selected',
                <>
                  <em>work</em>
                  <sup className="work__count">({pad(projects.length)})</sup>
                </>,
              ]}
            />
          </Reveal>
          <Reveal as="p" className="work__intro lead" delay={250}>
            {site.workIntro}
          </Reveal>
        </div>
      </header>
      )}

      <div ref={reel} className={cx('reel', pinned ? 'reel--pinned' : 'reel--stacked')}>
        {pinned && <WorkWall />}
        <div className="reel__stage">
          {projects.map((p, i) => (
            <Scene
              key={p.id}
              project={p}
              index={i}
              pinned={pinned}
              active={active === i}
              onFocus={() => pinned && active !== i && goTo(i, false)}
            />
          ))}
        </div>

        {pinned && (
          <nav className="reel__rail" aria-label="Jump to a project">
            <ol>
              {projects.map((p, i) => (
                <li key={p.id}>
                  <button type="button" onClick={() => goTo(i)} aria-current={active === i ? 'true' : undefined}>
                    <span className="reel__rail-no">{p.number}</span>
                    <span className="reel__rail-name">{p.title}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="reel__progress" ref={progressBar} aria-hidden="true" />
            <p className="reel__counter label" aria-hidden="true">
              <span>{projects[active].number}</span> / {pad(projects.length)}
            </p>
          </nav>
        )}
      </div>
    </section>
  )
}
