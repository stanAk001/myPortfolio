/*
  The request simulator. Each scenario is a real flow from a PERN app, step by step: `say` is for
  anyone, `tech` is what actually happens. Timings are typical values and the UI says it's a simulation.
*/
export const NODES = {
  browser: { x: 90, y: 92, label: 'Browser', sub: 'You', icon: 'browser' },
  react: { x: 330, y: 92, label: 'React', sub: 'The interface', icon: 'react' },
  api: { x: 560, y: 262, label: 'Express API', sub: 'Node.js server', icon: 'node' },
  db: { x: 330, y: 432, label: 'PostgreSQL', sub: 'via Prisma', icon: 'postgres' },
  pay: { x: 790, y: 92, label: 'Payments', sub: 'Payment provider', icon: 'card' },
  media: { x: 790, y: 432, label: 'Cloudinary', sub: 'Image CDN', icon: 'image' },
}

export const EDGES = [
  ['browser', 'react'],
  ['react', 'api'],
  ['api', 'db'],
  ['api', 'pay'],
  ['api', 'media'],
]

export const edgeId = (a, b) => [a, b].sort().join('-')

export function edgePath(a, b) {
  const p = NODES[a]
  const q = NODES[b]
  const mx = (p.x + q.x) / 2
  return `M${p.x} ${p.y} C${mx} ${p.y} ${mx} ${q.y} ${q.x} ${q.y}`
}

export const SCENARIOS = [
  {
    id: 'search',
    label: 'Search for a tool',
    plain: 'You type “design” into Toolhaven’s search bar.',
    hops: [
      { from: 'browser', to: 'react', ms: 3, say: 'You type a word', tech: 'onChange → setQuery("design")' },
      { from: 'react', to: 'api', ms: 34, say: 'The page asks the server', tech: 'GET /api/tools?q=design' },
      { from: 'api', to: 'db', ms: 5, say: 'The server looks it up', tech: 'prisma.tool.findMany({ where: { name: { contains: q } } })' },
      { from: 'db', to: 'api', ms: 8, say: 'Matching tools come back', tech: 'rows → JSON' },
      { from: 'api', to: 'react', ms: 29, say: 'The server answers', tech: '200 OK · application/json' },
      { from: 'react', to: 'browser', ms: 4, say: 'Results appear', tech: 'render <ToolGrid tools={data} />' },
    ],
  },
  {
    id: 'login',
    label: 'Sign in',
    plain: 'You enter your email and password and press Sign in.',
    hops: [
      { from: 'browser', to: 'react', ms: 2, say: 'You press Sign in', tech: 'onSubmit → login(form)' },
      { from: 'react', to: 'api', ms: 36, say: 'Details go to the server, encrypted', tech: 'POST /api/auth/login  (HTTPS)' },
      { from: 'api', to: 'db', ms: 6, say: 'It finds your account', tech: 'prisma.user.findUnique({ where: { email } })' },
      { from: 'db', to: 'api', ms: 7, say: 'Checks the password safely', tech: 'bcrypt.compare(password, user.hash)' },
      { from: 'api', to: 'react', ms: 30, say: 'You get a secure session', tech: 'Set-Cookie: session=…; HttpOnly; Secure' },
      { from: 'react', to: 'browser', ms: 3, say: 'You’re in', tech: 'navigate("/dashboard")' },
    ],
  },
  {
    id: 'buy',
    label: 'Pay for something',
    plain: 'You tap Pay on a checkout page.',
    hops: [
      { from: 'browser', to: 'react', ms: 2, say: 'You tap Pay', tech: 'onClick → checkout(cart)' },
      { from: 'react', to: 'api', ms: 38, say: 'The order goes to the server', tech: 'POST /api/checkout' },
      { from: 'api', to: 'pay', ms: 120, say: 'It asks the payment provider', tech: 'createPayment({ amount, currency })' },
      { from: 'pay', to: 'api', ms: 140, say: 'The provider confirms', tech: 'POST /webhooks/payments  ✓ signature verified' },
      { from: 'api', to: 'db', ms: 6, say: 'The order is saved', tech: "prisma.order.update({ status: 'PAID' })" },
      { from: 'db', to: 'api', ms: 5, say: 'Saved for good', tech: 'COMMIT' },
      { from: 'api', to: 'react', ms: 28, say: 'The server says done', tech: '201 Created' },
      { from: 'react', to: 'browser', ms: 3, say: 'You see your receipt', tech: 'render <Receipt />' },
    ],
  },
  {
    id: 'upload',
    label: 'Upload a photo',
    plain: 'You add a product photo from your phone.',
    hops: [
      { from: 'browser', to: 'react', ms: 4, say: 'You pick a photo', tech: '<input type="file" accept="image/*">' },
      { from: 'react', to: 'api', ms: 60, say: 'It’s sent to the server', tech: 'POST /api/uploads  (multipart)' },
      { from: 'api', to: 'media', ms: 180, say: 'Stored on a fast image network', tech: 'cloudinary.uploader.upload(file)' },
      { from: 'media', to: 'api', ms: 40, say: 'A link comes back', tech: 'secure_url · resized on demand' },
      { from: 'api', to: 'db', ms: 6, say: 'The link is saved', tech: 'prisma.image.create({ data: { url } })' },
      { from: 'db', to: 'api', ms: 4, say: 'Saved', tech: 'COMMIT' },
      { from: 'api', to: 'react', ms: 27, say: 'The server answers', tech: '201 Created' },
      { from: 'react', to: 'browser', ms: 3, say: 'Your photo appears', tech: '<img src={url} loading="lazy">' },
    ],
  },
]

// Hover a technology to see where it lives.
export const STACK = [
  { name: 'React', group: 'Frontend', nodes: ['react'] },
  { name: 'Vite', group: 'Frontend', nodes: ['react'] },
  { name: 'Node.js', group: 'Backend', nodes: ['api'] },
  { name: 'Express', group: 'Backend', nodes: ['api'] },
  { name: 'REST APIs', group: 'Backend', nodes: ['react', 'api'] },
  { name: 'Auth', group: 'Backend', nodes: ['api', 'db'] },
  { name: 'PostgreSQL', group: 'Data', nodes: ['db'] },
  { name: 'Prisma', group: 'Data', nodes: ['api', 'db'] },
  { name: 'Payments', group: 'Services', nodes: ['pay'] },
  { name: 'Cloudinary', group: 'Services', nodes: ['media'] },
  { name: 'Vercel', group: 'Services', nodes: ['react', 'api'] },
]
