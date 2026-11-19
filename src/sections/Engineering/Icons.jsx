// Small icons drawn inside the system-map nodes, centred on 0,0, about 28px wide.
export default function NodeIcon({ name }) {
  switch (name) {
    case 'react':
      return (
        <g fill="none" stroke="#61dafb" strokeWidth="1.6">
          <ellipse rx="13" ry="5" />
          <ellipse rx="13" ry="5" transform="rotate(60)" />
          <ellipse rx="13" ry="5" transform="rotate(120)" />
          <circle r="2.4" fill="#61dafb" stroke="none" />
        </g>
      )
    case 'node':
      return (
        <g>
          <path d="M0 -14 L12 -7 L12 7 L0 14 L-12 7 L-12 -7 Z" fill="#5fa04e" />
          <text y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="JetBrains Mono, monospace">
            JS
          </text>
        </g>
      )
    case 'postgres':
      return (
        <g fill="none" stroke="#7aa9d6" strokeWidth="1.6">
          <ellipse cy="-8" rx="11" ry="4" fill="#336791" />
          <path d="M-11 -8 V8 A11 4 0 0 0 11 8 V-8" fill="#336791" />
          <path d="M-11 0 A11 4 0 0 0 11 0" />
        </g>
      )
    case 'card':
      return (
        <g>
          <rect x="-13" y="-9" width="26" height="18" rx="3" fill="#e9c046" />
          <rect x="-13" y="-4" width="26" height="4" fill="#1b1814" />
          <rect x="-9" y="3" width="8" height="2.4" rx="1" fill="#1b1814" />
        </g>
      )
    case 'image':
      return (
        <g>
          <rect x="-13" y="-10" width="26" height="20" rx="3" fill="#3448c5" />
          <circle cx="-5" cy="-3" r="2.6" fill="#fff" />
          <path d="M-13 10 L-3 0 L4 6 L8 2 L13 7 V10 Z" fill="#9db0ff" />
        </g>
      )
    default:
      return (
        <g fill="none" stroke="#dcd6c9" strokeWidth="1.6">
          <rect x="-13" y="-10" width="26" height="20" rx="3" />
          <path d="M-13 -4 H13" />
          <circle cx="-9" cy="-7" r="0.8" fill="#dcd6c9" />
          <circle cx="-6" cy="-7" r="0.8" fill="#dcd6c9" />
        </g>
      )
  }
}
