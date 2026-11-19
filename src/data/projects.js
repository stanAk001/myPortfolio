// Projects live in src/content/content.json. Add, edit and reorder them from /admin.
import content from '../content/content.json'
import { pad } from '../utils'

export const STATUS = {
  live: { label: 'Live', group: 'live' },
  evolving: { label: 'Evolving', group: 'live' },
  development: { label: 'In development', group: 'building' },
  exploring: { label: 'Exploring', group: 'exploring' },
}

export const projects = content.projects.map((p, i) => ({
  tagline: [],
  technologies: [],
  gallery: [],
  features: [],
  highlights: [],
  dna: {},
  theme: {},
  ...p,
  number: p.number ?? pad(i + 1),
}))

export const featuredProjects = projects.filter((p) => p.featured)
export const labProjects = projects.filter((p) => !p.featured)
export const liveProjects = projects.filter((p) => p.liveUrl)

export const getProject = (id) => projects.find((p) => p.id === id)

export const getNextProject = (project) => projects[(projects.indexOf(project) + 1) % projects.length]

export const statusLabel = (p) => STATUS[p.status]?.label ?? p.status

// owner/repo from a GitHub URL, or null.
export const repoOf = (p) => p.repoUrl?.match(/github\.com\/([^/]+)\/([^/#?]+)/)?.slice(1, 3).map((s) => s.replace(/\.git$/, '')) ?? null
