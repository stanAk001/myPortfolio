import { useCallback, useEffect, useRef, useState } from 'react'
import { lockScroll } from '../../lib/smooth'
import Clothesline from './Clothesline'
import './Studio.css'

/*
  Shared studio pieces: the edits and ads (CLIPS), the flyers (FLYERS) and the wall that hangs them.
  The studio page lays them out; QuickCut on the work page counts them.
*/

export const CLIPS = [
  { id: 'tff', title: 'TFF — website showcase', kind: 'Edit · 16:9', note: 'Showcase film for a client website, cut to music.', src: '/studio/video/tff-showcase.mp4', poster: '/studio/video/tff-showcase.webp', dur: 66.6, sound: true },
  { id: 'tff-v', title: 'TFF — vertical cut', kind: 'Edit · 9:16', note: 'The same story re-cut for TikTok and Reels.', src: '/studio/video/tff-showcase-vertical.mp4', poster: '/studio/video/tff-showcase-vertical.webp', dur: 66.6, sound: true, tall: true },
  { id: 'sa', title: 'StockAcademia — product ad', kind: 'Ad · 16:9', note: 'Recorded live: learn, practise, ask — then a real AI verdict, a real scan, a setup that hit its target.', src: '/projects/stockacademia/ad.mp4', poster: '/projects/stockacademia/ad-poster.webp', dur: 65, sound: true },
  { id: 'th', title: 'Toolhaven — product ad', kind: 'Ad · 16:9', note: 'For buyers, honest reviews and comparisons. For makers, a free way to get listed.', src: '/projects/toolhaven/ad.mp4', poster: '/projects/toolhaven/ad-poster.webp', dur: 62.1, sound: true },
  { id: 'ks', title: 'KeemStore — product ad', kind: 'Ad · 16:9', note: 'Trending finds, gift guides and honest notes.', src: '/projects/keemstore/ad.mp4', poster: '/projects/keemstore/ad-poster.webp', dur: 31.4, sound: true },
]

export const FLYERS = [
  ['01', 'Toolhaven', '4K doesn’t mean a better picture'],
  ['02', 'Toolhaven', 'Better desk, not a huge bill'],
  ['03', 'Toolhaven', 'The cable mess has to go'],
  ['04', 'Toolhaven', 'Fast isn’t everything'],
  ['05', 'KeemStore', 'Denim, after summer'],
  ['06', 'KeemStore', 'The pair you’ll probably wear'],
  ['07', 'KeemStore', 'Your blackout drawer needs more'],
  ['08', 'KeemStore', 'The boots that change the outfit'],
  ['09', 'KeemStore', 'Studio on one desk'],
  ['10', 'KeemStore', 'Your fireplace shouldn’t just sit there'],
  ['11', 'KeemStore', 'Carried daily, kept for years'],
  ['12', 'KeemStore', 'Hola, octubre'],
  ['13', 'KeemStore', 'Glowy skin isn’t about more products'],
  ['14', 'KeemStore', 'Small tech, big upgrade'],
  ['15', 'KeemStore', 'Quiet desk, loud focus'],
  ['16', 'KeemStore', 'Your bedroom doesn’t need a makeover'],
  ['17', 'KeemStore', 'Halloween finds you didn’t know you needed'],
  ['18', 'KeemStore', 'Quietly olive'],
  ['19', 'Toolhaven', 'OLED vs QLED'],
  ['20', 'Toolhaven', 'Why didn’t I buy this sooner?'],
  ['21', 'KeemStore', 'Everything in its place'],
  ['22', 'KeemStore', 'Small things, quietly useful'],
  ['23', 'KeemStore', 'One good bag, carried well'],
  ['24', 'KeemStore', 'Small tech gifts they’ll actually use'],
  ['25', 'KeemStore', 'Riding boots, not just for riding'],
  ['26', 'KeemStore', 'The café is open at home'],
  ['27', 'Toolhaven', 'Your desk is missing these'],
  ['28', 'Toolhaven', 'Your workspace matters'],
  ['29', 'Toolhaven', 'Most people buy the wrong TV size'],
  ['30', 'Toolhaven', '12 home office upgrades'],
].map(([n, brand, title]) => ({ src: `/studio/flyers/${n}.webp`, brand, title }))

/*
  The flyer wall: every flyer pegged on one long line (see Clothesline). Filter by brand, click a
  print to open it full screen; the empty peg at the end leads to the launch kit.
*/
// `show` ({ brand }) switches the wall to a brand from outside, e.g. a flyer clip on the timeline.
export function PinWall({ show, onEnd }) {
  const [brand, setBrand] = useState('All')
  useEffect(() => {
    if (show?.brand) setBrand(show.brand)
  }, [show])
  const [open, setOpen] = useState(null)
  const last = useRef(null)
  const list = brand === 'All' ? FLYERS : FLYERS.filter((f) => f.brand === brand)

  const close = useCallback(() => {
    setOpen(null)
    last.current?.focus()
  }, [])

  useEffect(() => {
    if (open === null) return
    lockScroll(true)
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setOpen((n) => (n + 1) % list.length)
      if (e.key === 'ArrowLeft') setOpen((n) => (n - 1 + list.length) % list.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, list.length])

  const f = open !== null && list[open]
  const count = (b) => (b === 'All' ? FLYERS.length : FLYERS.filter((x) => x.brand === b).length)

  return (
    <>
      <div className="pw__filters" role="group" aria-label="Filter flyers by brand">
        {['All', 'KeemStore', 'Toolhaven'].map((b) => (
          <button key={b} type="button" aria-pressed={brand === b} onClick={() => setBrand(b)}>
            {b} <span>{count(b)}</span>
          </button>
        ))}
      </div>

      {/* Picking a brand re-hangs the line: the prints clip back on one after another. */}
      <Clothesline
        key={brand}
        list={list}
        onOpen={(i, el) => {
          last.current = el
          setOpen(i)
        }}
        onEnd={onEnd}
      />

      {f && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={`${f.brand} flyer: ${f.title}`} onClick={(e) => e.target === e.currentTarget && close()}>
          <figure className="lb__fig" key={open}>
            <img src={f.src} alt={`${f.brand} flyer: ${f.title}`} />
            <figcaption>
              <span className="label">
                {String(open + 1).padStart(2, '0')} / {list.length} · {f.brand} · Pinterest flyer
              </span>
              <b>{f.title}</b>
            </figcaption>
          </figure>
          <button type="button" className="lb__nav lb__prev" onClick={() => setOpen((open - 1 + list.length) % list.length)} aria-label="Previous flyer">
            ←
          </button>
          <button type="button" className="lb__nav lb__next" onClick={() => setOpen((open + 1) % list.length)} aria-label="Next flyer">
            →
          </button>
          <button type="button" className="lb__close" onClick={close} autoFocus>
            Close ✕
          </button>
        </div>
      )}
    </>
  )
}
