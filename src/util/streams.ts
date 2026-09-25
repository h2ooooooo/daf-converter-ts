import {once} from 'node:events';
import {Readable, type Writable} from 'node:stream';

/** Writes chunks one at a time and waits whenever the stream asks for backpressure. */
export async function writeChunks(stream: Writable, chunks: Iterable<Buffer>): Promise<void> {
   for (const chunk of chunks) {
      const canContinue = stream.write(chunk);

      if (!canContinue) {
         await once(stream, 'drain');
      }
   }
}

/** Wraps a chunk generator as a byte stream (not object mode) so it can be piped. */
export function chunksToReadable(chunks: Iterable<Buffer>): Readable {
   return Readable.from(chunks, {objectMode: false});
}
