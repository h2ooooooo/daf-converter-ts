---
layout: home

hero:
  name: daf-converter
  text: Open Duplicator .daf backups anywhere
  tagline: Turn dup-archive files into a .zip, a folder or plain .sql. No PHP, no installer.php, no WordPress.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Commands
      link: /guide/commands

features:
  - title: daf-to-zip
    details: Converts a .daf into a standard .zip that Windows, macOS, Linux and every unzip tool can open. ZIP64 is used automatically, so backups over 4 GB work.
    link: /guide/commands#daf-to-zip
  - title: daf-to-folder
    details: Extracts every file of the backup, including the dup-installer folder and the site's original wp-config and .htaccess.
    link: /guide/commands#daf-to-folder
  - title: daf-to-sql
    details: Pulls out only the database dump as an uncompressed MySQL/MariaDB script, ready to import with mysql.
    link: /guide/commands#daf-to-sql
---

## Install

```bash
npm i -g @jalsoedesign/daf-converter
```

```bash
daf-to-zip backup_archive.daf
```
