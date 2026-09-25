# Getting started

[Duplicator](https://duplicator.com/) and Duplicator Pro are WordPress backup plugins. Depending on the settings, a backup is saved as a `.zip` or as a `.daf` ("DupArchive") file. Normally only Duplicator's own `installer.php` or its DupArchive Expander can open a `.daf`.

`daf-converter` reads the format directly, so you can open a backup on any machine with Node.js.

## Install

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm i -g @jalsoedesign/daf-converter
```

This installs three commands: `daf-to-zip`, `daf-to-folder` and `daf-to-sql`.

Check that it worked:

```bash
daf-to-zip --version
```

## Convert your first backup

```bash
daf-to-zip 20260925_mysite_abc123_20260925085141_archive.daf
```

This creates `20260925_mysite_abc123_20260925085141_archive.zip` next to the `.daf`. See [Commands](./commands) for the other two commands and the output options.

## Run without installing

`npx` can run a command once without installing it globally. The package has three commands, so name the package with `-p` and then the command:

```bash
npx -p @jalsoedesign/daf-converter daf-to-sql backup_archive.daf
```

## What's inside a .daf?

Every Duplicator backup contains:

| Path | What it is |
| --- | --- |
| `dup-installer/` | Duplicator's restore tool (PHP, JS and templates). The same in every backup. |
| `dup-installer/dup_descriptors_*/db_dumps/*.sql.gz` | The database dump, used by `daf-to-sql` |
| `dup-installer/dup_descriptors_*/orig_files/` | Copies of the site's original `wp-config.php` and `.htaccess` |
| `wp-admin/`, `wp-includes/`, `wp-content/` … | The WordPress site files, **only** in full backups |

A database-only backup has no site files, just the installer and the dump.

::: warning Backups contain secrets
The database dump includes user accounts and password hashes. `orig_files/source_site_wpconfig` contains your database credentials and security keys. Treat the `.daf` and everything you convert it into as sensitive.
:::
