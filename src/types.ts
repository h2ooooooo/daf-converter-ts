export type DupArchiveEntryType = 'file' | 'directory';

export interface DupArchiveHeader {
   version: string;
   isCompressed: boolean;
}

export interface DupArchiveEntry {
   type: DupArchiveEntryType;

   /** Path inside the archive, always using forward slashes. */
   path: string;

   /** Uncompressed size in bytes, 0 for directories. */
   size: number;

   modifiedAt: Date;

   /** Unix permission bits, for example 0o644. */
   mode: number;

   /**
    * Yields the uncompressed file content in chunks.
    * Must be consumed before moving to the next entry, unread entries are skipped automatically.
    */
   readChunks(): Generator<Buffer>;

   /** Moves past the remaining content without decompressing it. */
   skip(): void;
}

/** Raw `<TAG>value</TAG>` pairs of one DupArchive header block. */
export type HeaderFields = Record<string, Buffer>;
