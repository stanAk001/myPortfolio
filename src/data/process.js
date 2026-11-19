/*
  "From idea to production": one product followed through five stages.
  The code snippets are illustrative, shaped like the real stack.
  TODO(akeem): swap in real snippets from the Toolhaven repo.
*/
export const buildProcess = {
  projectId: 'toolhaven',
  steps: [
    {
      id: 'idea',
      label: 'Idea',
      text: 'Product discovery felt like scrolling through another directory. The question was how to make it feel curated instead.',
      artifact: {
        type: 'note',
        title: 'Open questions',
        lines: ['Who is looking for a tool, and what do they already know?', 'What makes a listing trustworthy?', 'How does a maker get listed?', 'How does the site pay for itself?'],
      },
    },
    {
      id: 'design',
      label: 'Design',
      text: 'Search first, categories second, then cards dense enough to compare at a glance. Layout settled before any code.',
      artifact: { type: 'wireframe' },
    },
    {
      id: 'engineering',
      label: 'Engineering',
      text: 'A REST API in Express with validation and auth on every write. React on the front, talking to it.',
      artifact: {
        type: 'code',
        title: 'routes/tools.js',
        code: `router.post(
  '/',
  requireAuth,
  validate(toolSubmission),
  async (req, res) => {
    const tool = await prisma.tool.create({
      data: {
        ...req.body,
        status: 'PENDING', // nothing goes public without review
        submittedById: req.user.id,
      },
    })
    res.status(201).json(tool)
  },
)`,
      },
    },
    {
      id: 'database',
      label: 'Database',
      text: 'PostgreSQL through Prisma. Submissions, reviews and categories as real relations, not JSON blobs.',
      artifact: {
        type: 'schema',
        models: [
          { name: 'Tool', fields: ['id', 'name', 'slug  @unique', 'status', 'category → Category', 'reviews → Review[]'] },
          { name: 'Review', fields: ['id', 'rating', 'body', 'tool → Tool', 'author → User'] },
          { name: 'Category', fields: ['id', 'name', 'slug  @unique', 'tools → Tool[]'] },
          { name: 'User', fields: ['id', 'email  @unique', 'role', 'reviews → Review[]'] },
        ],
      },
    },
    {
      id: 'deployment',
      label: 'Deployment',
      text: 'Migrations run before the new build goes live, so the API and the schema never disagree.',
      artifact: {
        type: 'terminal',
        lines: [
          { cmd: 'npm run build' },
          { out: 'vite build — client ready' },
          { cmd: 'npx prisma migrate deploy' },
          { out: 'All migrations have been applied.' },
          { cmd: 'node server.js' },
          { out: 'api listening' },
          { ok: 'live' },
        ],
      },
    },
  ],
}
