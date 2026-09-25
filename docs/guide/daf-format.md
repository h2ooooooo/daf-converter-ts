# The .daf format

A DupArchive is not compressed as a whole. It's a flat sequence of small text headers, each followed by raw data, so it can be read from start to finish in one pass.

## Blocks

```
<A><V>5.0.1</V><X>0x01</X><P></P></A>                                      archive header
<D><MT>mtime</MT><P>0755</P><RPL>13</RPL><RP>wp-content/up</RP></D>          directory
<F><FS>size</FS><MT>mtime</MT><P>0644</P><HA>hash</HA><RPL>n</RPL><RP>path</RP></F>  file
<G><OS>original size</OS><SS>stored size</SS><HA>hash</HA></G>…data…         file content chunk
```

| Tag | Meaning |
| --- | --- |
| `V` | Format version |
| `X` | Archive header: a binary flag, `0x01` means chunks may be compressed |
| `FS` | Uncompressed file size |
| `MT` | Modification time, Unix seconds |
| `P` | Unix permissions in octal |
| `HA` | Hash, used by Duplicator for validation |
| `RPL` / `RP` | Path length in bytes, then the path itself (UTF-8) |
| `OS` / `SS` | Original and stored size of one chunk |

## File content

A file header is followed by one or more `<G>` chunks, until the original sizes add up to `FS`. Empty files have no chunks.

In a compressed archive, a chunk whose stored size differs from its original size is raw DEFLATE (PHP's `gzdeflate`). Chunks that wouldn't shrink are stored as-is.

## Where the database is

Duplicator Pro stores the dump as a gzipped SQL file:

```
dup-installer/dup_descriptors_<hash>/db_dumps/<timestamp>-dump.sql.gz
```

Older versions use `dup-installer/dup-database__<hash>.sql`. `daf-to-sql` recognises both.
