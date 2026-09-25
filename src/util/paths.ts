import path from 'node:path';

// Duplicator Pro: dup-installer/dup_descriptors_<hash>/db_dumps/<timestamp>-dump.sql.gz
const DATABASE_DUMP_PATTERN = /(^|\/)dup-installer\/.*\/db_dumps\/[^/]+\.sql(\.gz)?$/;

// Older Duplicator (Lite) versions: dup-installer/dup-database__<hash>.sql
const LEGACY_DATABASE_DUMP_PATTERN = /(^|\/)(dup-installer\/)?dup-database__[^/]*\.sql$/;

export function isDatabaseDumpPath(entryPath: string): boolean {
   if (DATABASE_DUMP_PATTERN.test(entryPath)) {
      return true;
   }

   return LEGACY_DATABASE_DUMP_PATTERN.test(entryPath);
}

/**
 * Resolves an archive path inside `directory`.
 * Throws for paths like `../../etc/passwd` so a malicious archive cannot write outside the target folder.
 */
export function resolveInsideDirectory(directory: string, entryPath: string): string {
   const rootPath = path.resolve(directory);
   const targetPath = path.resolve(rootPath, entryPath);
   const isInsideRoot = targetPath === rootPath || targetPath.startsWith(rootPath + path.sep);

   if (!isInsideRoot) {
      throw new Error(`Refusing to write "${entryPath}" because it points outside ${rootPath}`);
   }

   return targetPath;
}

/** `/backups/site_archive.daf` becomes `/backups/site_archive` */
export function stripExtension(filePath: string): string {
   const directory = path.dirname(filePath);
   const baseName = path.basename(filePath, path.extname(filePath));

   return path.join(directory, baseName);
}
