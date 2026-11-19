/*
  The architecture diagram in the Engineering section.
  Node x/y are percentages of a square canvas. The snippets are illustrative.
  TODO(akeem): swap them for real lines from your own code.
*/
export const nodes = [
  { id: 'user', label: 'User', sub: 'Browser · phone', x: 28, y: 9, role: 'Where every request starts. Everything below exists to make this moment fast and obvious.' },
  { id: 'client', label: 'React', sub: 'Interface', x: 28, y: 36, role: 'Components, routing and the in-between states — loading, empty, error — that make a product feel finished.' },
  { id: 'api', label: 'Node / Express', sub: 'REST API', x: 28, y: 63, role: 'Routes, validation, auth and business rules. The interface asks; this layer decides.' },
  { id: 'db', label: 'PostgreSQL', sub: 'via Prisma', x: 28, y: 90, role: 'Relational data with real constraints, so bad data can’t get in to begin with.' },
  { id: 'payments', label: 'Payments', sub: 'Provider + webhooks', x: 78, y: 40, kind: 'service', role: 'Checkout happens with the provider; orders only change state when its webhook confirms.' },
  { id: 'media', label: 'Cloudinary', sub: 'Images · CDN', x: 78, y: 63, kind: 'service', role: 'Uploads go to Cloudinary. The database stores a reference; the CDN serves resized images.' },
  { id: 'deploy', label: 'Deployment', sub: 'Build · env · migrate', x: 78, y: 86, kind: 'service', role: 'Builds, environment variables and migrations in the right order, so shipping is uneventful.' },
]

export const links = [
  { from: 'user', to: 'client', d: 'M28 9 V36' },
  { from: 'client', to: 'api', d: 'M28 36 V63' },
  { from: 'api', to: 'db', d: 'M28 63 V90' },
  { from: 'api', to: 'payments', d: 'M28 63 H53 V40 H78' },
  { from: 'api', to: 'media', d: 'M28 63 H78' },
  { from: 'api', to: 'deploy', d: 'M28 63 H53 V86 H78' },
]

export const technologies = [
  {
    id: 'react', name: 'React', group: 'Frontend', path: ['user', 'client'],
    role: 'The interface layer. I care as much about the loading and error states as the happy path.',
    snippet: "const { data: tools, status } = useTools({ category })\nif (status === 'error') return <Retry />",
  },
  {
    id: 'node', name: 'Node.js', group: 'Backend', path: ['api'],
    role: 'Runs the server. One language from the button to the database.',
    snippet: "app.listen(process.env.PORT, () => log('api ready'))",
  },
  {
    id: 'express', name: 'Express', group: 'Backend', path: ['client', 'api'],
    role: 'Routing and middleware. Thin route handlers, rules kept in one place.',
    snippet: "router.post('/tools', requireAuth, validate(newTool), tools.create)",
  },
  {
    id: 'rest', name: 'REST APIs', group: 'Backend', path: ['user', 'client', 'api', 'db'],
    role: 'The contract between interface and server. Predictable URLs, honest status codes.',
    snippet: 'GET  /api/tools?category=design&page=2   → 200\nPOST /api/tools/:id/reviews             → 201',
  },
  {
    id: 'auth', name: 'Authentication', group: 'Backend', path: ['user', 'client', 'api', 'db'],
    role: 'Passwords hashed, never stored. Protected routes are checked on the server, not just hidden in the UI.',
    snippet: "if (!req.user) return res.status(401).json({ error: 'Sign in first' })",
  },
  {
    id: 'postgres', name: 'PostgreSQL', group: 'Data', path: ['db'],
    role: 'Relational data with constraints that do real work.',
    snippet: '@@unique([userId, toolId])   // one review per person, enforced by the database',
  },
  {
    id: 'prisma', name: 'Prisma', group: 'Data', path: ['api', 'db'],
    role: 'Schema, migrations and typed queries. The shape of the data lives in version control.',
    snippet: "await prisma.tool.findMany({\n  where: { status: 'APPROVED' },\n  include: { category: true },\n})",
  },
  {
    id: 'payments', name: 'Payment integration', group: 'Services', path: ['user', 'client', 'api', 'payments', 'db'],
    role: 'Checkout on the client, truth on the server. Nothing is marked paid until the provider says so.',
    snippet: "POST /webhooks/payments\n  → verify signature\n  → order.status = 'PAID'",
  },
  {
    id: 'cloudinary', name: 'Cloudinary', group: 'Services', path: ['client', 'api', 'media', 'db'],
    role: 'Images uploaded once, served at the right size everywhere.',
    snippet: 'image: { publicId, width, height }   // the file lives on the CDN',
  },
  {
    id: 'deploy', name: 'Deployment', group: 'Services', path: ['client', 'api', 'db', 'deploy'],
    role: 'Migrations run before the new build goes live, so the API and the schema never disagree.',
    snippet: 'npx prisma migrate deploy && node server.js',
  },
]
