import fs from 'node:fs';
import {PassThrough} from 'node:stream';
import yazl from 'yazl';
import {DupArchiveReader} from '@/DupArchiveReader';
import {writeChunks} from '@/util/streams';

// Unix file type bits, zip tools use them to tell files and folders apart
const UNIX_FILE_TYPE = 0o100000;
const UNIX_DIRECTORY_TYPE = 0o040000;

// yazl buffers each entry until it is its turn to be written, this caps memory per entry
const ENTRY_BUFFER_SIZE = 4 * 1024 * 1024;

/**
 * Converts a .daf archive into a standard .zip file (ZIP64 when needed, so > 4 GB works).
 * Resolves `true` on success and throws a descriptive error otherwise.
 */
export async function dafToZip(dafPath: string, zipPath: string): Promise<boolean> {
   const reader = new DupArchiveReader(dafPath);

   // Validates the archive before anything is written, so a bad input never leaves an empty zip behind
   reader.readHeader();

   const zipFile = new yazl.ZipFile();
   const outputStream = fs.createWriteStream(zipPath);

   const writeFinished = new Promise<void>((resolve, reject) => {
      outputStream.on('close', resolve);
      outputStream.on('error', reject);
      zipFile.outputStream.on('error', reject);
   });

   // A write error can arrive before we reach `await writeFinished`, this keeps it from
   // becoming an unhandled rejection. The error is still thrown by the await below.
   writeFinished.catch(() => {});

   zipFile.outputStream.pipe(outputStream);

   try {
      await addEntries(reader, zipFile);
   } catch (error) {
      outputStream.destroy();

      throw error;
   }

   await writeFinished;

   return true;
}

async function addEntries(reader: DupArchiveReader, zipFile: yazl.ZipFile): Promise<void> {
   for (const entry of reader.entries()) {
      if (entry.type === 'directory') {
         zipFile.addEmptyDirectory(entry.path, {
            mtime: entry.modifiedAt,
            mode: UNIX_DIRECTORY_TYPE | entry.mode,
         });

         continue;
      }

      const entryStream = new PassThrough({highWaterMark: ENTRY_BUFFER_SIZE});

      zipFile.addReadStream(entryStream, entry.path, {
         mtime: entry.modifiedAt,
         mode: UNIX_FILE_TYPE | entry.mode,
         size: entry.size,
      });

      await writeChunks(entryStream, entry.readChunks());

      entryStream.end();
   }

   zipFile.end();
}
