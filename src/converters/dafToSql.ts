import fs from 'node:fs';
import zlib from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import type {DupArchiveEntry} from '@/types';
import {DupArchiveReader} from '@/DupArchiveReader';
import {isDatabaseDumpPath} from '@/util/paths';
import {chunksToReadable} from '@/util/streams';

/**
 * Extracts only the WordPress database dump from a .daf archive as a plain,
 * uncompressed MySQL/MariaDB .sql file.
 *
 * Resolves `true` when the dump was written and `false` when the archive does not
 * contain a database dump (for example a files-only backup). Nothing is written in that case.
 */
export async function dafToSql(dafPath: string, sqlPath: string): Promise<boolean> {
   const reader = new DupArchiveReader(dafPath);

   for (const entry of reader.entries()) {
      const isDatabaseDump = entry.type === 'file' && isDatabaseDumpPath(entry.path);

      if (!isDatabaseDump) {
         continue;
      }

      await writeDump(entry, sqlPath);

      return true;
   }

   return false;
}

async function writeDump(entry: DupArchiveEntry, sqlPath: string): Promise<void> {
   const source = chunksToReadable(entry.readChunks());
   const destination = fs.createWriteStream(sqlPath);

   if (entry.path.endsWith('.gz')) {
      await pipeline(source, zlib.createGunzip(), destination);

      return;
   }

   await pipeline(source, destination);
}
