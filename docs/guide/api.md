# JavaScript API

The commands are the main way to use this package, but the same conversions are available from code. The package ships with TypeScript types and works with both `import` and `require`.

```bash
npm i @jalsoedesign/daf-converter
```

## Converting

```ts
import {dafToZip, dafToFolder, dafToSql} from '@jalsoedesign/daf-converter';

await dafToZip('backup_archive.daf', 'backup.zip');
await dafToFolder('backup_archive.daf', './site');

const hasDatabase = await dafToSql('backup_archive.daf', 'database.sql');
```

| Function | Resolves to |
| --- | --- |
| `dafToZip(dafPath: string, zipPath: string): Promise<boolean>` | `true` when the zip was written |
| `dafToFolder(dafPath: string, folderPath: string): Promise<boolean>` | `true` when everything was extracted |
| `dafToSql(dafPath: string, sqlPath: string): Promise<boolean>` | `true` when the dump was written, `false` when the archive has no database dump |

All three are async because they stream the data, so memory stays low even for multi-GB backups.

They throw a descriptive `Error` when the archive is missing, isn't a `.daf`, or is corrupt, for example `Corrupt archive: expected "<G>" at offset 1234, found …`. The archive is checked before anything is written, so a bad input never leaves an empty output behind.

## Reading entries yourself

`DupArchiveReader` gives you each file and folder in archive order:

```ts
import {DupArchiveReader} from '@jalsoedesign/daf-converter';

const reader = new DupArchiveReader('backup_archive.daf');

console.log(reader.readHeader()); // {version: '5.0.1', isCompressed: true}

for (const entry of reader.entries()) {
   console.log(entry.type, entry.path, entry.size);

   if (entry.path.endsWith('source_site_wpconfig')) {
      const content = Buffer.concat([...entry.readChunks()]).toString('utf8');

      console.log(content);
   }
}
```

Each entry has `type` (`'file'` or `'directory'`), `path`, `size`, `modifiedAt` and `mode`, plus:

- `readChunks()` yields the uncompressed content as `Buffer` chunks. It can only be read once, while the loop is on that entry.
- `skip()` moves past the content without decompressing it. Entries you don't read are skipped automatically.
