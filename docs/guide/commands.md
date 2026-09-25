# Commands

Every command takes the `.daf` file, plus an optional output path:

```bash
<command> <archive.daf> [output]
```

All commands accept these options:

| Option | Description |
| --- | --- |
| `-q, --quiet` | Only print errors |
| `-h, --help` | Show help |
| `-v, --version` | Show the version |

On failure, a command prints the reason and exits with code `1`.

## daf-to-zip

Converts the whole archive into a standard `.zip`, keeping file dates and permissions.

```bash
daf-to-zip backup_archive.daf            # -> backup_archive.zip
daf-to-zip backup_archive.daf site.zip   # -> site.zip
```

## daf-to-folder

Extracts every file and folder.

```bash
daf-to-folder backup_archive.daf          # -> ./backup_archive/
daf-to-folder backup_archive.daf ./site   # -> ./site/
```

Paths that would escape the output folder (like `../../file`) are refused, so a tampered archive can't write elsewhere on your disk.

## daf-to-sql

Extracts **only** the database, as a plain, uncompressed `.sql` file.

```bash
daf-to-sql backup_archive.daf                # -> backup_archive.sql
daf-to-sql backup_archive.daf database.sql   # -> database.sql
```

Only the dump is decompressed, so this is fast even for large backups. If the archive has no database dump, for example a files-only backup, the command fails and writes nothing.

### Importing the SQL

The dump is a MySQL/MariaDB script:

```bash
mysql -u root -p my_database < backup_archive.sql
```

Duplicator's installer normally also replaces the old site URL. If you're moving the site to a new domain, do that yourself afterwards, for example with WP-CLI:

```bash
wp search-replace 'https://old.example' 'https://new.example'
```
