import type {HeaderFields} from '@/types';
import type {BufferedFileReader} from '@/util/BufferedFileReader';

const MAX_TAG_NAME_LENGTH = 32;
const MAX_FIELD_LENGTH = 64 * 1024;

/**
 * Reads `<TAG>value</TAG>` pairs until the closing `</blockName>` tag.
 * The opening `<blockName>` must already be consumed.
 *
 * `RP` (relative path) is read using the byte length from the preceding `RPL`
 * field, because a file name may legally contain `</RP>`.
 */
export function readHeaderFields(reader: BufferedFileReader, blockName: string): HeaderFields {
   const fields: HeaderFields = {};
   const closingTag = `</${blockName}>`;

   while (reader.peekText(closingTag.length) !== closingTag) {
      reader.expect('<');

      const tagName = reader.readUntil('>', MAX_TAG_NAME_LENGTH).toString('latin1');
      const pathLengthField = fields['RPL'];

      if (tagName === 'RP' && pathLengthField !== undefined) {
         const pathLength = parseInt(pathLengthField.toString('latin1'), 10);

         fields['RP'] = reader.read(pathLength);
         reader.expect('</RP>');

         continue;
      }

      fields[tagName] = reader.readUntil(`</${tagName}>`, MAX_FIELD_LENGTH);
   }

   reader.expect(closingTag);

   return fields;
}

export function readRequiredText(fields: HeaderFields, fieldName: string, blockName: string): string {
   const value = fields[fieldName];

   if (value === undefined) {
      throw new Error(`Corrupt archive: <${blockName}> header is missing the <${fieldName}> field`);
   }

   return value.toString('latin1');
}

export function readRequiredInteger(fields: HeaderFields, fieldName: string, blockName: string): number {
   const text = readRequiredText(fields, fieldName, blockName);
   const value = parseInt(text, 10);

   if (!Number.isFinite(value)) {
      throw new Error(`Corrupt archive: <${fieldName}> in <${blockName}> is not a number: ${JSON.stringify(text)}`);
   }

   return value;
}

/** Reads an optional integer field, falling back when it is missing or unreadable. */
export function readOptionalInteger(fields: HeaderFields, fieldName: string, radix: number, fallback: number): number {
   const value = fields[fieldName];

   if (value === undefined) {
      return fallback;
   }

   const parsedValue = parseInt(value.toString('latin1'), radix);

   if (!Number.isFinite(parsedValue)) {
      return fallback;
   }

   return parsedValue;
}
