const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 52428800 becomes "50.0 MB" */
export function formatBytes(byteCount: number): string {
   let value = byteCount;
   let unitIndex = 0;

   while (value >= 1024 && unitIndex < UNITS.length - 1) {
      value = value / 1024;
      unitIndex++;
   }

   if (unitIndex === 0) {
      return `${value} B`;
   }

   return `${value.toFixed(1)} ${UNITS[unitIndex]}`;
}
