// bundle.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/webchat.ts'],
  bundle: true,
  outfile: 'dist/webchat.js',
  minify: false,
  sourcemap: true,
  format: 'iife', // IIFE = good for attaching to window
  loader: { '.css': 'text' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  target: ['es2018'],
}).then(() => {
  console.log('✅ Build successful');
}).catch(() => process.exit(1));
