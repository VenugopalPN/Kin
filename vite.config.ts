import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Rewrites the public cover path for a project-site build, and adds the
// GitHub Pages fallback files. A base of "/" leaves local dev unchanged.
function pagesAssets(): Plugin {
  let base = '/';
  let outDir = '';
  return {
    name: 'pages-assets',
    configResolved(config) {
      base = config.base;
      outDir = resolve(config.root, config.build.outDir);
    },
    transform(code, id) {
      if (!base || base === '/' || !id.includes('.css')) return null;
      const prefix = base.endsWith('/') ? base : `${base}/`;
      const next = code.replaceAll("url('/cover.jpg')", `url('${prefix}cover.jpg')`);
      return next === code ? null : next;
    },
    closeBundle() {
      if (!base || base === '/' || !outDir) return;
      const index = resolve(outDir, 'index.html');
      if (!existsSync(index)) return;
      copyFileSync(index, resolve(outDir, '404.html'));
      writeFileSync(resolve(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [react(), pagesAssets()],
  server: {
    port: 4322,
    host: '127.0.0.1',
  },
});
