# Akeem — portfolio

React + Vite + GSAP + Lenis. No TypeScript, no router or UI kit.

```bash
npm install
npm run dev       # site: http://localhost:5173   admin: http://localhost:5173/admin
npm run build     # production build in dist/
```

## Deploying (Vercel)

Everything is set in `vercel.json`: Vite build, `dist/` output, every page route served by `index.html`, long caching for the hashed JS/CSS, a day's caching for videos and images, and basic security headers. Needs Node 20.19 or newer (Vercel's default is fine).

1. Put the project on GitHub, then on vercel.com choose **Add New → Project** and import the repo. Leave the settings as they are and deploy.
   Or, without GitHub: `npx vercel` for a preview and `npx vercel --prod` for the live site.
2. Link previews (WhatsApp, LinkedIn, X) use `public/og.jpg` and pick up the Vercel domain automatically. With a custom domain, add an environment variable `SITE_URL=https://yourdomain.com` in the Vercel project and redeploy.
3. Optional: set `site.contact.formEndpoint` in the admin (e.g. a Formspree URL) so the contact brief sends from the page. Without it, Send opens the visitor's email app.

`ffmpeg-static`, `sharp` and `playwright-core` are optional dependencies. They're only used by the local capture scripts, so a failed download of any of them never breaks a deploy.

After a deploy, check: `/`, `/work`, a project page like `/work/toolhaven`, `/studio`, and a made-up URL (it should show "This page was never built.").

## Editing content: the admin

Run `npm run dev` and open **`/admin`**. From there you can:

- **Projects**: add, edit, delete, and reorder with ↑/↓. Choose whether each one sits in the main reel or the Lab.
- **Capture from the live site**: paste a URL, press Capture. It records a ~12s trailer and takes the hero, three section shots and a phone view. It also checks whether the site can be embedded.
- **Upload** your own cover images, gallery images and videos.
- **GitHub repo** per project: adds "View the code" and an in-page code viewer that reads the real repo.
- **Profile & links, Welcome & build film, Page copy, GitHub username.**

Save with **⌘S / Ctrl+S**. Everything is written to `src/content/content.json`, and uploads go to `public/projects/<id>/`.

**Publishing:** commit and push. Vercel redeploys with the new content.

**Security:** the admin only exists on your local dev server. It isn't in the production build, so `/admin` on the live site is a 404. There's no login to leak and nothing to attack.

The Capture button needs Chrome or Edge installed. Set `CHROME_PATH` if yours lives somewhere unusual. You can also run it directly:

```bash
node scripts/capture.mjs <id> https://your-site.vercel.app
```

## What's on the page

1. **Welcome**: an illustrated developer at his desk types a real-looking build log while the site loads, then looks up and smiles. *Enter* flies into the logo on his laptop.
2. **Build film** (the hero): scroll through a PERN app being built, from terminal to React to Express to PostgreSQL/Prisma to Vercel. Code types as you scroll, the preview builds beside it, and it ends on the real Toolhaven trailer.
3. **Selected work**: a camera move through real screenshots into a pinned reel of real trailers.
4. **The Lab**: every project not in the main reel (e.g. Hadex).
5. **Live from GitHub**: appears once you set a username. Contribution graph, latest commits and recent repos, fetched live.
6. Engineering, live status, About (with a working terminal), Contact.

**Extras:** ⌘K command menu, X for x-ray mode, and project pages that embed the live site where it's allowed.

## Accessibility & motion

With `prefers-reduced-motion`, the welcome skips its animation, the build film shows as a static sequence, and nothing autoplays. Everything is keyboard-reachable.
