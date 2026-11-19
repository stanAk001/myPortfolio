import { cx } from '../../utils'

/*
  The bug: a domed beetle with two antennae and big eyes. All its expression is in the eyes, lids
  and mouth, so it still reads at thumbnail size.
*/
const FACE = {
  curious: { look: 2.2, lid: 0, mouth: 'M28 34q4 2 8 0' },
  suspicious: { look: -2, lid: 5, mouth: 'M28 35h8' },
  smug: { look: 1.6, lid: 4, mouth: 'M27 33q6 5 11-1' },
  surprised: { look: 0, lid: 0, r: 7.4, mouth: 'M32 33.5a2.6 3 0 1 0 .01 0' },
  embarrassed: { look: -2.6, lid: 2, mouth: 'M27 36q2.5-2.5 5 0t5 0', blush: true },
  bye: { happy: true, mouth: 'M26 32q6 7 12 0' },
}

export default function Bug({ mood = 'curious', className }) {
  const f = FACE[mood] ?? FACE.curious
  const r = f.r ?? 6.4
  return (
    <svg className={cx('bug', `bug--${mood}`, className)} viewBox="0 0 64 58" aria-hidden="true" focusable="false">
      <g className="bug__ants">
        <path d="M24 12Q20 5 14 4M40 12q4-7 10-8" />
        <circle cx="14" cy="4" r="2.4" />
        <circle cx="50" cy="4" r="2.4" />
      </g>
      <path className="bug__legs" d="M12 34 4 31M11 42l-7 3M18 50l-5 6M52 34l8-3M46 50l5 6" />
      <path className="bug__wave" d="M53 42l7 3" />
      <path className="bug__shell" d="M10 34C10 18 19 10 32 10s22 8 22 24c0 12-9 19-22 19S10 46 10 34Z" />
      <path className="bug__seam" d="M32 40v13" />
      {f.happy ? (
        <path className="bug__mouth" d="M18 25q5-6 9 0M37 25q5-6 9 0" />
      ) : (
        <g className="bug__eyes">
          {[23, 41].map((x) => (
            <g key={x}>
              <circle className="bug__white" cx={x} cy="24" r={r} />
              <circle className="bug__pupil" cx={x + f.look} cy="24.6" r="2.7" />
              {f.lid > 0 && <path className="bug__lid" d={`M${x - r - 1} ${17 + f.lid}h${2 * r + 2}V16.6h-${2 * r + 2}Z`} />}
            </g>
          ))}
        </g>
      )}
      {f.blush && <path className="bug__blush" d="M13 33l3-2M16.500 35l3-2M45 33l3-2M48.500 35l3-2" />}
      <path className="bug__mouth" d={f.mouth} />
    </svg>
  )
}
