# @jalsoedesign/daf-converter

Convert **Duplicator / Duplicator Pro dup-archive (`.daf`) backups** into a regular `.zip`, a folder, or just the WordPress database as plain `.sql`. No PHP, no `installer.php` and no WordPress needed.

📖 **Docs:** https://h2ooooooo.github.io/daf-converter/

## Install

```bash
npm i -g @jalsoedesign/daf-converter
```

Requires Node.js 18 or newer. This installs three commands:

| Command | What it does |
| --- | --- |
| `daf-to-zip` | Turns a `.daf` into a `.zip` that any OS or unzip tool can open |
| `daf-to-folder` | Extracts every file (WordPress files plus `dup-installer/`) into a folder |
| `daf-to-sql` | Extracts **only** the database dump, as an uncompressed MySQL/MariaDB `.sql` script |

## Usage

```bash
daf-to-zip backup_archive.daf                 # -> backup_archive.zip
daf-to-zip backup_archive.daf site.zip

daf-to-folder backup_archive.daf              # -> ./backup_archive/
daf-to-folder backup_archive.daf ./site

daf-to-sql backup_archive.daf                 # -> backup_archive.sql
daf-to-sql backup_archive.daf database.sql
```

All commands accept `-q, --quiet`, `-h, --help` and `-v, --version`.

Run a command once without installing:

```bash
npx -p @jalsoedesign/daf-converter daf-to-sql backup_archive.daf
```

## API

```ts
import {dafToZip, dafToFolder, dafToSql} from '@jalsoedesign/daf-converter';

await dafToZip('backup_archive.daf', 'backup.zip');         // Promise<boolean>
await dafToFolder('backup_archive.daf', './site');          // Promise<boolean>
await dafToSql('backup_archive.daf', 'database.sql');       // false if there is no database dump
```

See the [API docs](https://jalsoedesign.github.io/daf-converter/guide/api) for `DupArchiveReader`, which reads entries one by one.

## Development

```bash
npm install
npm run dev                                   # rebuild dist/ on every change
npm run sql -- backup_archive.daf out.sql     # run a command straight from src/, no build needed (also: zip, folder)
npm run typecheck
npm run build
npm run docs:dev                              # docs with live reload
```

| Path | What it is |
| --- | --- |
| `src/DupArchiveReader.ts` | Reads the `.daf` format |
| `src/converters/` | `dafToZip`, `dafToFolder`, `dafToSql` |
| `src/cli/` | The three commands |
| `docs/` | VitePress site, deployed to GitHub Pages by `.github/workflows/docs.yml` |

## Publishing

```bash
npm login
npm version patch        # or minor / major
npm publish              # runs typecheck and build first
```

## Security note

Duplicator backups contain your full database, including user password hashes, and a copy of `wp-config.php` with database credentials. Treat the `.daf` and everything converted from it as sensitive.

## License

MIT. Not affiliated with Duplicator or Snap Creek.
"# daf-converter-ts" 
"# daf-converter-ts" 
