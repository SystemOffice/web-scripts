import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';

const mode = process.argv.includes('--prod') ? 'prod' : 'dev';

const cssInjectPlugin = {
  name: 'css-inject',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, 'utf8');
      return {
        contents: `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(css)};
          document.head.appendChild(style);
        `,
        loader: 'js'
      };
    });
  }
};

const shared = {
  entryPoints: ['index.js'],
  bundle: true,
  format: 'iife',
  plugins: [cssInjectPlugin],
};

const outfile = mode === 'prod' ? 'dist/chat-widgets.js' : 'dist/chat-widgets-dev.js';

await esbuild.build({
  ...shared,
  outfile,
});

console.log(`Build complete: ${outfile}`);
