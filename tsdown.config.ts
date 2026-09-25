import {defineConfig} from 'tsdown';

export default defineConfig([
   // Library API, usable with both `import` and `require`
   {
      entry: {
         index: 'src/index.ts',
      },
      format: ['esm', 'cjs'],
      platform: 'node',
      target: 'node18',
      dts: true,
      clean: true,
   },

   // The three commands installed by `npm i -g`
   {
      entry: {
         'cli/dafToZip': 'src/cli/dafToZip.ts',
         'cli/dafToFolder': 'src/cli/dafToFolder.ts',
         'cli/dafToSql': 'src/cli/dafToSql.ts',
      },
      format: ['esm'],
      platform: 'node',
      target: 'node18',
      dts: false,
      clean: false,
   },
]);
