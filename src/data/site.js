// All editable copy is in src/content/content.json. Edit it from /admin (npm run dev).
// Words wrapped in *asterisks* render in italic serif.
import content from '../content/content.json'
// Imported instead of served from /public so the bundler fingerprints it.
import portrait from '../assets/akeem.webp'
import portraitSmall from '../assets/akeem-sm.webp'

export const site = {
  ...content.site,
  socials: content.site.socials ?? [],
  photo: { src: portrait, small: portraitSmall, alt: `${content.site.name}, in a black shirt with orange embroidery`, width: 1000, height: 1250 },
}

export const github = content.github ?? { username: null }
