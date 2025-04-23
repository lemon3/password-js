/* global __dirname */
import { resolve } from 'path';
import { defineConfig } from 'vite';

import banner from 'vite-plugin-banner';
import pkg from './package.json';

const bannerText = `/*!
* PasswordJs v${pkg.version}
* ${pkg.homepage}
*/`;

const lookupNames = {
  es: 'password-js.js',
  cjs: 'password-js.cjs.js',
  umd: 'password-js.umd.js',
};

export default defineConfig({
  build: {
    target: 'es2015', // esnext
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'PasswordJs',
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
