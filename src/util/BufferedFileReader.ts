import fs from 'node:fs';

const READ_BLOCK_SIZE = 1024 * 1024;

/**
 * Sequential reader over an open file with a lookahead buffer.
 * DupArchive headers are parsed a few bytes at a time, so reading straight from disk would be very slow.
 */
export class BufferedFileReader {
   private readonly fileDescriptor: number;
   private filePosition: number = 0;
   private buffer: Buffer = Buffer.alloc(0);
   private bufferOffset: number = 0;

   public constructor(fileDescriptor: number) {
      this.fileDescriptor = fileDescriptor;
   }

   /** Absolute offset of the next unread byte, useful in error messages. */
   public get position(): number {
      return this.bufferOffset;
   }

   public isAtEnd(): boolean {
      return this.peek(1).length === 0;
   }

   /** Returns up to `length` bytes without consuming them. */
   public peek(length: number): Buffer {
      this.fill(length);

      const availableLength = Math.min(length, this.buffer.length);

      return this.buffer.subarray(0, availableLength);
   }

   public peekText(length: number): string {
      return this.peek(length).toString('latin1');
   }

   public read(length: number): Buffer {
      const hasEnoughData = this.fill(length);

      if (!hasEnoughData) {
         throw new Error(`Unexpected end of archive at offset ${this.bufferOffset}, wanted ${length} more bytes`);
      }

      const data = this.buffer.subarray(0, length);

      this.buffer = this.buffer.subarray(length);
      this.bufferOffset += length;

      return data;
   }

   /** Reads everything before `marker`, then consumes the marker itself. */
   public readUntil(marker: string, maxLength: number): Buffer {
      while (true) {
         const markerIndex = this.buffer.indexOf(marker, 0, 'latin1');

         if (markerIndex !== -1) {
            const data = this.read(markerIndex);

            this.read(marker.length);

            return data;
         }

         if (this.buffer.length > maxLength) {
            throw new Error(`Could not find "${marker}" within ${maxLength} bytes of offset ${this.bufferOffset}`);
         }

         const hasMoreData = this.fill(this.buffer.length + 4096);

         if (!hasMoreData) {
            throw new Error(`Unexpected end of archive while looking for "${marker}" after offset ${this.bufferOffset}`);
         }
      }
   }

   /** Consumes `text` and throws if the archive contains anything else at this position. */
   public expect(text: string): void {
      const startOffset = this.bufferOffset;
      const actualText = this.peekText(text.length);

      if (actualText !== text) {
         throw new Error(`Corrupt archive: expected "${text}" at offset ${startOffset}, found ${JSON.stringify(actualText)}`);
      }

      this.read(text.length);
   }

   /** Makes sure at least `minimumLength` bytes are buffered, returns false when the file ends first. */
   private fill(minimumLength: number): boolean {
      while (this.buffer.length < minimumLength) {
         const blockSize = Math.max(READ_BLOCK_SIZE, minimumLength - this.buffer.length);
         const block = Buffer.alloc(blockSize);
         const bytesRead = fs.readSync(this.fileDescriptor, block, 0, blockSize, this.filePosition);

         if (bytesRead === 0) {
            return false;
         }

         this.filePosition += bytesRead;
         this.buffer = Buffer.concat([this.buffer, block.subarray(0, bytesRead)]);
      }

      return true;
   }
}
