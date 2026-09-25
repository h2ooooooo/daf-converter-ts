#!/usr/bin/env node
import {runCli} from '@/cli/runCli';
import {dafToSql} from '@/converters/dafToSql';
import {stripExtension} from '@/util/paths';

runCli({
   name: 'daf-to-sql',
   summary: 'Extract only the WordPress database from a Duplicator / Duplicator Pro dup-archive (.daf) backup, as plain .sql.',
   outputLabel: 'output.sql',
   outputHelp: 'Defaults to <archive>.sql next to the .daf',
   getDefaultOutput: (dafPath) => `${stripExtension(dafPath)}.sql`,
   convert: dafToSql,
   nothingToConvertMessage: 'This archive does not contain a database dump (dup-installer/.../db_dumps/*.sql.gz), it is probably a files-only backup',
});
