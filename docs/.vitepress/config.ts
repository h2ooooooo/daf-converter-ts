import {defineConfig} from 'vitepress';

// GitHub Actions passes the Pages base path (for example "/daf-converter/"), locally the site runs at "/"
const basePath = process.env.DOCS_BASE_PATH ?? '/';

export default defineConfig({
   title: 'daf-converter',
   description: 'Convert Duplicator dup-archive (.daf) backups into .zip files, folders or plain .sql',
   base: basePath,
   cleanUrls: true,
   lastUpdated: true,

   head: [
      ['meta', {name: 'theme-color', content: '#3c8772'}],
   ],

   themeConfig: {
      nav: [
         {text: 'Guide', link: '/guide/getting-started'},
         {text: 'npm', link: 'https://www.npmjs.com/package/@jalsoedesign/daf-converter'},
      ],

      sidebar: [
         {
            text: 'Guide',
            items: [
               {text: 'Getting started', link: '/guide/getting-started'},
               {text: 'Commands', link: '/guide/commands'},
               {text: 'JavaScript API', link: '/guide/api'},
               {text: 'The .daf format', link: '/guide/daf-format'},
            ],
         },
      ],

      socialLinks: [
         {icon: 'github', link: 'https://github.com/jalsoedesign/daf-converter'},
      ],

      search: {
         provider: 'local',
      },

      footer: {
         message: 'Released under the MIT License. Not affiliated with Duplicator or Snap Creek.',
      },
   },
});
