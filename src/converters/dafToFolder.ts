import fs from 'node:fs';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {DupArchiveReader} from '@/DupArchiveReader';
import {resolveInsideDirectory} from '@/util/paths';
import {chunksToReadable} from '@/util/streams';

/**
 * Extracts every file and directory of a .daf archive into `folderPath`.
 * The folder is created when needed. Resolves `true` on success and throws a descriptive error otherwise.
 */
export async function dafToFolder(dafPath: string, folderPath: string): Promise<boolean> {
   const reader = new DupArchiveReader(dafPath);

   // Validates the archive before anything is written, so a bad input never leaves an empty folder behind
   reader.readHeader();

   fs.mkdirSync(folderPath, {recursive: true});

   for (const entry of reader.entries()) {
      const targetPath = resolveInsideDirectory(folderPath, entry.path);

      if (entry.type === 'directory') {
         fs.mkdirSync(targetPath, {recursive: true});

         continue;
      }

      fs.mkdirSync(path.dirname(targetPath), {recursive: true});

      await pipeline(chunksToReadable(entry.readChunks()), fs.createWriteStream(targetPath));

      fs.utimesSync(targetPath, entry.modifiedAt, entry.modifiedAt);
   }

   return true;
}
