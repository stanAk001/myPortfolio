import { useLayoutEffect } from 'react'
import { Link } from '../../router'
import { scrollToY } from '../../lib/smooth'
import { site } from '../../data/site'
import { Reveal } from '../../components/Motion/Reveal'
import LiteVideo from './LiteVideo'
import Split from './Split'
import './TheBox.css'

/*
  A studio case study: TheBox Lounge. Starts with the proof (a real order, filmed), then the story in
  short sections, with the split diagram given space in the middle.
*/
export const THEBOX = {
  path: '/studio/thebox-lounge',
  title: 'TheBox Lounge',
  headline: 'Every naira has a name on it.',
  hook: 'A guest would pay ₦50,000 and only ₦30,000 reached the books. The owner couldn’t see where the rest went.',
  engine: '9BbEXOC8SAM',
}

const TAGS = ['React', 'Node.js', 'Express', 'PostgreSQL', 'Paystack Split Payments', 'Puppeteer', 'Python', 'FFmpeg']
const CHANNEL = 'https://www.youtube.com/@ak_stan001'

const BUILT = [
  ['One menu for three businesses.', 'Guests scan the QR code on their table and order from all three at once.'],
  ['One payment that splits itself,', 'as above. Nothing passes through a staff member, and nobody does sums at closing time.'],
  ['Cash that can’t wander off.', 'A cash or POS payment only counts when the guest’s code and the waiter’s PIN match. At the end of the night, the owner’s dashboard shows what the host owes each business from cash, after commission.'],
  ['Bank details nobody can quietly swap.', 'When a business is added, its account name is checked with the bank before any money can go there. Every change to where a business gets paid is logged on the owner’s dashboard.'],
  ['A live screen for every counter.', 'Orders land at the bar, the cocktail counter and the kitchen as they’re placed. Guests can follow their order, message the bar or call a waiter with one tap.'],
  ['The whole night from anywhere.', 'The owner sees every sale and every waiter, down to the missing bottle, with a phone alert when something looks off.'],
]

function Part({ id, title, children }) {
  return (
    <Reveal as="section" className="tb__part" aria-labelledby={id}>
      <h2 id={id} className="tb__h">
        {title}
      </h2>
      {children}
    </Reveal>
  )
}

export default function TheBox() {
  useLayoutEffect(() => {
    document.title = `${THEBOX.title} — ${site.name}`
    scrollToY(0, { immediate: true })
  }, [])

  return (
    <article className="tb tone-night">
      <p className="st__crumbs label">
        <Link to="/studio" className="st__back">
          ← The studio
        </Link>
        <span aria-hidden="true">/</span> Case study
      </p>

      <header className="tb__head">
        <p className="g-meta label">
          <span className="g-square" aria-hidden="true" />
          Case study — {THEBOX.title}, Lagos
        </p>
        <h1 className="tb__title">{THEBOX.headline}</h1>
        <p className="tb__hook">{THEBOX.hook}</p>
      </header>

      <figure className="tb__lead">
        <LiteVideo id={THEBOX.engine} title="The Engine: one real order at TheBox Lounge, from the guest’s phone to the bar screen" />
        <figcaption className="tb__cap">
          <b>The Engine.</b> One real order, filmed live. The guest’s phone and the bar screen side by side, from tap to table. Made for the owners.
        </figcaption>
      </figure>

      <div className="tb__story">
        <Part id="tb-problem" title="The problem">
          <p>The owner of TheBox Lounge knew they were losing money. They just couldn’t see where.</p>
          <p>Some staff were taking transfers into their own accounts. Cash went missing somewhere between the table and the till. Nothing in the old setup could stop either, so nobody could prove anything.</p>
        </Part>

        <Part id="tb-three" title="Three businesses, one bill">
          <p>Then it got harder. TheBox isn’t one business. It’s three under one roof: the bar, which is TheBox itself and the host; TILTS&amp;SIP, a cocktail brand; and a kitchen. Three owners, three bank accounts.</p>
          <p>One guest at one table might order a Mojito from TILTS&amp;SIP, a beer from the bar and Goat Meat Asun from the kitchen, all on the same bill. Ask them to pay three times and you’ve spoiled their night. Put it all in one account and someone has to untangle it by hand at closing time. That’s exactly where money goes missing.</p>
          <p className="tb__turn">So the guest pays once, and the money splits itself.</p>
        </Part>
      </div>

      <Reveal className="tb__wide">
        <Split />
      </Reveal>

      <div className="tb__story">
        <Reveal className="tb__part tb__part--cont">
          <p>Every item on the menu carries a tag, like cocktails or kitchen, and every business owns its tags. When the guest taps Pay, the server reads each line on the bill, finds who owns it and adds up what each business is due. It takes off that business’s agreed commission for the host. Then it tells Paystack to send each share straight into the right bank account, all inside one checkout.</p>
          <p>If friends split the bill, each person’s payment is shared out in the same proportions, so no business comes up short.</p>
          <p className="tb__turn">The server decides, not the phone. A guest’s phone can be tampered with, so it never gets a say in who gets paid.</p>
          <p className="tb__eng">
            <span className="label">For the engineers</span>
            The phone only sends what was ordered. The server prices every line, works out each business’s share and commission, and opens the Paystack transaction with the split already attached.
          </p>
        </Reveal>

        <Part id="tb-built" title="What I built">
          <ul className="tb__list">
            {BUILT.map(([lead, rest]) => (
              <li key={lead}>
                <b>{lead}</b> {rest}
              </li>
            ))}
          </ul>
        </Part>

        <Part id="tb-beyond" title="Beyond the code">
          <p>Building it was half the job. The owners don’t read code. The staff needed training. Guests needed to understand a menu with nobody standing there to explain it.</p>
          <p className="tb__turn">So I made three videos myself.</p>
          <p>I didn’t screen-record by hand. I wrote scripts that drove the real app through a full night of orders and filmed every screen as it happened. Then I built the edit in code as well: scene timing, captions, transitions, and the voiceover placed against the script I’d written. When a recorded line ran longer than its scene, the editor stretched the scene to fit.</p>
        </Part>
      </div>

      <Reveal className="tb__pair">
        <figure>
          <LiteVideo id="b2MnQMjcG54" title="The Promo: every feature of TheBox Lounge’s system in under two minutes" />
          <figcaption className="tb__cap">
            <b>The Promo.</b> Every feature in under two minutes. Made for the staff, before their first shift.
          </figcaption>
        </figure>
        <figure>
          <LiteVideo id="nsDvAtAYh20" title="The Lounge TV loop: how guests order at TheBox Lounge" />
          <figcaption className="tb__cap">
            <b>The Lounge TV loop.</b> Plays on the lounge’s TV and teaches guests how to order, with a QR code they can scan from their seat.
          </figcaption>
        </figure>
      </Reveal>
      <p className="tb__small">All filmed on the live system, using test data.</p>

      <div className="tb__story">
        <Part id="tb-how" title="What this says about how I work">
          <p>I start with where the money goes, not with the screens. The tags, the server doing the sums and the PIN on cash all came from asking one question: where could a naira slip away, and how do I close that gap?</p>
          <p>And I don’t stop at the code. If the people using it can’t understand it, it isn’t finished. Sometimes that means a dashboard. Sometimes it means making the training video myself.</p>
        </Part>

        <div className="tb__meta">
          <ul className="tb__tags" aria-label="Built with">
            {TAGS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <a className="tb__yt" href={CHANNEL} target="_blank" rel="noreferrer">
            More of my videos on YouTube <span aria-hidden="true">↗</span>
            <span className="sr-only"> (new tab)</span>
          </a>
        </div>

        <div className="tb__end">
          <p>Got a business that’s losing money somewhere you can’t see?</p>
          <Link to="/work#contact" className="g-btn g-btn--solid">
            Tell me about it <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
