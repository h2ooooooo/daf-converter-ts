#!/usr/bin/env node
import {runCli} from '@/cli/runCli';
import {dafToFolder} from '@/converters/dafToFolder';
import {stripExtension} from '@/util/paths';

runCli({
   name: 'daf-to-folder',
   summary: 'Extract every file of a Duplicator / Duplicator Pro dup-archive (.daf) backup into a folder.',
   outputLabel: 'output-folder',
   outputHelp: 'Defaults to a folder named after the archive, next to the .daf',
   getDefaultOutput: (dafPath) => stripExtension(dafPath),
   convert: dafToFolder,
   nothingToConvertMessage: 'The archive could not be extracted',
});
