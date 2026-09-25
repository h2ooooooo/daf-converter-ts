#!/usr/bin/env node
import {runCli} from '@/cli/runCli';
import {dafToZip} from '@/converters/dafToZip';
import {stripExtension} from '@/util/paths';

runCli({
   name: 'daf-to-zip',
   summary: 'Convert a Duplicator / Duplicator Pro dup-archive (.daf) backup into a standard .zip file.',
   outputLabel: 'output.zip',
   outputHelp: 'Defaults to <archive>.zip next to the .daf',
   getDefaultOutput: (dafPath) => `${stripExtension(dafPath)}.zip`,
   convert: dafToZip,
   nothingToConvertMessage: 'The archive could not be converted',
});
