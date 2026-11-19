import { site } from '../../data/site'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import DistortImage from '../../components/DistortImage/DistortImage'
import Terminal from '../../components/Terminal/Terminal'
import { rich } from '../../utils/rich'
import './About.css'

export default function About() {
  const { photo, about } = site
  return (
    <section id="about" className="about section theme-dark" data-component="About" aria-labelledby="about-title">
      <Chapter number="06">About</Chapter>
      <div className="about__grid grid">
        <Reveal className="about__portrait">
          <DistortImage src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
          <p className="label about__caption">
            {site.name} — {site.role}
          </p>
        </Reveal>

        <div className="about__text">
          <Reveal as="h2" lines id="about-title" className="about__title display">
            <Lines lines={[rich(about.headline)]} />
          </Reveal>
          <div className="about__blocks">
            {about.blocks.map((b, i) => (
              <Reveal className="about__block" key={b.label} delay={i * 120}>
                <p className="label">{b.label}</p>
                <p>{b.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="about__shell" delay={200}>
            <p className="label about__shell-label">Or ask the shell — it’s real</p>
            <Terminal />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
