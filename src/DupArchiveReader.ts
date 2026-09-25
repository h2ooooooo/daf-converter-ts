import fs from 'node:fs';
import type {DupArchiveEntry, DupArchiveHeader} from '@/types';
import {DupArchiveDirectoryEntry, DupArchiveFileEntry} from '@/DupArchiveEntries';
import {BufferedFileReader} from '@/util/BufferedFileReader';
import {readHeaderFields, readRequiredText} from '@/util/headerFields';

/**
 * Reads Duplicator / Duplicator Pro "DupArchive" (.daf) files.
 *
 * The format is a flat sequence of small text headers followed by raw data:
 *
 *   <A><V>version</V><X>compressed flag</X><P>…</P></A>                     archive header
 *   <D><MT>mtime</MT><P>perms</P><RPL>n</RPL><RP>path</RP></D>                directory
 *   <F><FS>size</FS><MT>mtime</MT><P>perms</P>…<RPL>n</RPL><RP>path</RP></F>  file
 *   <G><OS>original size</OS><SS>stored size</SS><HA>hash</HA></G>…data…      file content chunk
 */
export class DupArchiveReader {
   private readonly archivePath: string;

   public constructor(archivePath: string) {
      this.archivePath = archivePath;
   }

   /**
    * Yields every entry in archive order. The file is opened when iteration
    * starts and closed when it finishes or is abandoned with `break`.
    */
   public *entries(): Generator<DupArchiveEntry> {
      const fileDescriptor = this.openArchive();

      try {
         const reader = new BufferedFileReader(fileDescriptor);
         const header = this.readArchiveHeader(reader);

         while (!reader.isAtEnd()) {
            const entry = this.readEntry(reader, header);

            yield entry;

            // The next header starts after this entry's content, so skip whatever the caller did not read
            entry.skip();
         }
      } finally {
         fs.closeSync(fileDescriptor);
      }
   }

   public readHeader(): DupArchiveHeader {
      const fileDescriptor = this.openArchive();

      try {
         return this.readArchiveHeader(new BufferedFileReader(fileDescriptor));
      } finally {
         fs.closeSync(fileDescriptor);
      }
   }

   private openArchive(): number {
      if (!fs.existsSync(this.archivePath)) {
         throw new Error(`Archive not found: ${this.archivePath}`);
      }

      return fs.openSync(this.archivePath, 'r');
   }

   private readArchiveHeader(reader: BufferedFileReader): DupArchiveHeader {
      const startText = reader.peekText(3);

      if (startText !== '<A>') {
         throw new Error(`Not a DupArchive (.daf) file: ${this.archivePath} does not start with an <A> header`);
      }

      reader.expect('<A>');

      const fields = readHeaderFields(reader, 'A');
      const version = readRequiredText(fields, 'V', 'A');
      const compressedFlag = fields['X'] ?? Buffer.alloc(0);

      // The flag is a PHP-packed boolean, a single 0x01 byte (sometimes followed by padding) means compressed
      const isCompressed = compressedFlag.length > 0 && compressedFlag[0] !== 0 && compressedFlag.toString('latin1') !== '0';

      return {
         version: version,
         isCompressed: isCompressed,
      };
   }

   private readEntry(reader: BufferedFileReader, header: DupArchiveHeader): DupArchiveEntry {
      const startOffset = reader.position;
      const blockStart = reader.peekText(3);

      if (blockStart === '<D>') {
         reader.expect('<D>');

         return new DupArchiveDirectoryEntry(readHeaderFields(reader, 'D'));
      }

      if (blockStart === '<F>') {
         reader.expect('<F>');

         return new DupArchiveFileEntry(readHeaderFields(reader, 'F'), reader, header.isCompressed);
      }

      const found = JSON.stringify(reader.peekText(16));

      throw new Error(`Corrupt archive: expected a <D> or <F> header at offset ${startOffset}, found ${found}`);
   }
}
