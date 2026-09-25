import zlib from 'node:zlib';
import type {DupArchiveEntry, DupArchiveEntryType, HeaderFields} from '@/types';
import type {BufferedFileReader} from '@/util/BufferedFileReader';
import {readHeaderFields, readOptionalInteger, readRequiredInteger} from '@/util/headerFields';

const DEFAULT_FILE_MODE = 0o644;
const DEFAULT_DIRECTORY_MODE = 0o755;

interface EntryMetadata {
   path: string;
   modifiedAt: Date;
   mode: number;
}

function readEntryMetadata(fields: HeaderFields, blockName: string, defaultMode: number): EntryMetadata {
   const pathBytes = fields['RP'];

   if (pathBytes === undefined) {
      throw new Error(`Corrupt archive: <${blockName}> header is missing the <RP> (path) field`);
   }

   const modifiedAtSeconds = readOptionalInteger(fields, 'MT', 10, Math.floor(Date.now() / 1000));
   const mode = readOptionalInteger(fields, 'P', 8, defaultMode);

   return {
      // The path is UTF-8, unlike the rest of the header which is plain ASCII
      path: pathBytes.toString('utf8'),
      modifiedAt: new Date(modifiedAtSeconds * 1000),
      mode: mode,
   };
}

export class DupArchiveDirectoryEntry implements DupArchiveEntry {
   public readonly type: DupArchiveEntryType = 'directory';
   public readonly path: string;
   public readonly size: number = 0;
   public readonly modifiedAt: Date;
   public readonly mode: number;

   public constructor(fields: HeaderFields) {
      const metadata = readEntryMetadata(fields, 'D', DEFAULT_DIRECTORY_MODE);

      this.path = metadata.path;
      this.modifiedAt = metadata.modifiedAt;
      this.mode = metadata.mode;
   }

   public *readChunks(): Generator<Buffer> {
      // Directories have no content
   }

   public skip(): void {
      // Nothing to skip
   }
}

/**
 * A file inside the archive. Its content follows the header as one or more
 * `<G>` chunks ("globs"), which are read lazily from the shared reader.
 */
export class DupArchiveFileEntry implements DupArchiveEntry {
   public readonly type: DupArchiveEntryType = 'file';
   public readonly path: string;
   public readonly size: number;
   public readonly modifiedAt: Date;
   public readonly mode: number;

   private readonly reader: BufferedFileReader;
   private readonly isCompressed: boolean;
   private remainingBytes: number;
   private hasStartedReading: boolean = false;

   public constructor(fields: HeaderFields, reader: BufferedFileReader, isCompressed: boolean) {
      const metadata = readEntryMetadata(fields, 'F', DEFAULT_FILE_MODE);

      this.path = metadata.path;
      this.modifiedAt = metadata.modifiedAt;
      this.mode = metadata.mode;
      this.size = readRequiredInteger(fields, 'FS', 'F');

      this.reader = reader;
      this.isCompressed = isCompressed;
      this.remainingBytes = this.size;
   }

   public *readChunks(): Generator<Buffer> {
      if (this.hasStartedReading) {
         throw new Error(`Content of "${this.path}" was already read, archive entries can only be read once`);
      }

      this.hasStartedReading = true;

      while (this.remainingBytes > 0) {
         yield this.readGlob(true);
      }
   }

   public skip(): void {
      this.hasStartedReading = true;

      while (this.remainingBytes > 0) {
         this.readGlob(false);
      }
   }

   /** Reads one `<G>` chunk. Returns an empty buffer when `shouldDecode` is false. */
   private readGlob(shouldDecode: boolean): Buffer {
      this.reader.expect('<G>');

      const fields = readHeaderFields(this.reader, 'G');
      const originalSize = readRequiredInteger(fields, 'OS', 'G');
      const storedSize = readRequiredInteger(fields, 'SS', 'G');
      const storedData = this.reader.read(storedSize);

      this.remainingBytes -= originalSize;

      if (!shouldDecode) {
         return Buffer.alloc(0);
      }

      // Duplicator stores a chunk uncompressed when deflating would not make it smaller
      const isChunkCompressed = this.isCompressed && storedSize !== originalSize;

      if (isChunkCompressed) {
         return zlib.inflateRawSync(storedData);
      }

      return Buffer.from(storedData);
   }
}
