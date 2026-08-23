// prerender.mjs
// Post-build step (run after `vite build`). Loads entry-server.tsx through
// Vite's own SSR module graph — the same resolution/transform Vite uses for
// the real client bundle — and writes a real static index.html for each
// public marketing route into dist/.
//
// This changes ONLY what the first HTML response looks like for these
// routes. index.tsx still does ReactDOM.createRoot(...).render(...), which
// fully replaces #root on mount, so every existing client behavior
// (dashboard, auth, admin, modals, etc.) is completely unaffected.

import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('prerender: dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

const vite = await createServer({
  root: __dirname,
  server: { middlewareMode: true },
  appType: 'custom',
});

let ok = 0;
let failed = 0;

try {
  const { render, prerenderRoutes } = await vite.ssrLoadModule('/entry-server.tsx');

  for (const routePath of prerenderRoutes) {
    try {
      const { html: appHtml, helmet } = render(routePath);

      let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

      if (helmet) {
        const headInjection = [helmet.title.toString(), helmet.meta.toString(), helmet.link.toString()].join(
          '\n    '
        );
        html = html.replace(/<title>.*?<\/title>/, headInjection);
      }

      const outDir = routePath === '/' ? distDir : path.join(distDir, routePath);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      console.log(`prerendered ${routePath} -> ${path.relative(distDir, path.join(outDir, 'index.html')) || 'index.html'}`);
      ok++;
    } catch (err) {
      failed++;
      console.error(`prerender FAILED for ${routePath}:`, err);
    }
  }
} finally {
  await vite.close();
}

console.log(`\nprerender: ${ok} succeeded, ${failed} failed`);
if (failed > 0) process.exit(1);
