/* global __dirname */
import { resolve } from 'path';
import { defineConfig } from 'vite';

import banner from 'vite-plugin-banner';
import pkg from './package.json';

const origName = pkg.name;
const name = pkg.name.slice(0, 1).toLocaleUpperCase() + pkg.name.slice(1);

const bannerText = `/*!
* ${name} v${pkg.version}
* (c) lemon3.at
* ${pkg.homepage}
*/`;

const lookupNames = {
  es: `${origName}.js`,
  cjs: `${origName}.cjs.js`,
  umd: `${origName}.umd.js`,
};

export default defineConfig({
  build: {
    target: 'es2015', // esnext
    lib: {
      entry: resolve(__dirname, 'lib/index.js'),
      name,
      formats: ['es', 'cjs', 'umd'],
      // @ts-expect-error: i only need 'es', 'cjs', 'umd'
      fileName: (format) => lookupNames[format],
    },
  },

  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },

  plugins: [banner(bannerText)],
});
