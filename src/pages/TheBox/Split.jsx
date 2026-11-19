/*
  How one bill turns into three payments. Each line on the bill goes to the business that owns it,
  and the host's commission comes off the two guest brands and goes back to the bar. The figures are
  examples and labelled that way. On a phone it reads top to bottom, and each account says where its
  money came from, so you don't need to see the lines.
*/
const RATE = 0.1
const naira = (n) => `₦${n.toLocaleString('en-NG')}`

const LINES = [
  { item: 'Mojito', price: 8000, to: 'tilts' },
  { item: 'Beer', price: 3000, to: 'bar' },
  { item: 'Goat Meat Asun', price: 9000, to: 'kitchen' },
]
const cut = (p) => Math.round(p * RATE)
const commission = LINES.filter((l) => l.to !== 'bar').reduce((s, l) => s + cut(l.price), 0)
const total = LINES.reduce((s, l) => s + l.price, 0)

const ACCOUNTS = {
  tilts: { name: 'TILTS&SIP', what: 'Cocktail brand' },
  bar: { name: 'The bar', what: 'TheBox, the host' },
  kitchen: { name: 'The kitchen', what: 'Kitchen' },
}

const received = (l) => (l.to === 'bar' ? l.price + commission : l.price - cut(l.price))
const fromText = (l) => (l.to === 'bar' ? `${l.item} ${naira(l.price)} + ${naira(commission)} commission` : `${l.item} ${naira(l.price)} − ${naira(cut(l.price))} to the host`)

export default function Split() {
  const summary = `One bill of ${naira(total)} paid once. ${LINES.map((l) => `${ACCOUNTS[l.to].name} receives ${naira(received(l))}: ${fromText(l)}.`).join(' ')}`
  return (
    <figure className="sp">
      <div className="sp__grid" role="img" aria-label={summary}>
        <div className="sp__bill" aria-hidden="true">
          <p className="sp__head">
            <span>Table 7 · one bill</span>
            <span>Paid once</span>
          </p>
          {LINES.map((l) => (
            <p key={l.item} className="sp__line">
              <span>{l.item}</span>
              <b>{naira(l.price)}</b>
            </p>
          ))}
          <p className="sp__total">
            <span>Total</span>
            <b>{naira(total)}</b>
          </p>
        </div>

        <svg className="sp__flow" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {[50, 150, 250].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} className="sp__main" />
          ))}
          <path className="sp__fee" d="M38 50 C 70 50, 74 150, 100 150" />
          <path className="sp__fee" d="M38 250 C 70 250, 74 150, 100 150" />
        </svg>
        <span className="sp__tag sp__tag--top" aria-hidden="true">
          −{naira(cut(LINES[0].price))}
        </span>
        <span className="sp__tag sp__tag--bottom" aria-hidden="true">
          −{naira(cut(LINES[2].price))}
        </span>
        <span className="sp__down" aria-hidden="true">
          splits into
        </span>

        {LINES.map((l, i) => (
          <div key={l.to} className={`sp__acct${l.to === 'bar' ? ' is-host' : ''}`} style={{ gridRow: i + 1 }} aria-hidden="true">
            <p className="sp__name">
              {ACCOUNTS[l.to].name}
              <small>{ACCOUNTS[l.to].what}</small>
            </p>
            <b className="sp__amount">{naira(received(l))}</b>
            <p className="sp__from">{fromText(l)}</p>
          </div>
        ))}
      </div>
      <figcaption className="sp__cap">
        Example prices and a 10% commission, to show the shape of it. Three businesses, three bank accounts, one checkout.<span className="sp__dash"> The dashed lines are the host’s commission.</span>
      </figcaption>
    </figure>
  )
}
