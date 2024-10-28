# upgrade postgres 14 to 17 - instructions

# install postgresql@17
brew install postgresql@17

# backup postgresql@14
pg_dumpall > ~/Projects/postgres_14_backup.sql

# stop postgresql@14
brew services stop postgresql@14

# run pg_upgrade with --check
# Apple Silicon macBook
/opt/homebrew/opt/postgresql@17/bin/pg_upgrade \
    -b /opt/homebrew/opt/postgresql@14/bin \
    -B /opt/homebrew/opt/postgresql@17/bin \
    -d /opt/homebrew/var/postgresql@14 \
    -D /opt/homebrew/var/postgresql@17 \
    --check
# Intel macBook
/usr/local/opt/postgresql@17/bin/pg_upgrade \
    -b /usr/local/opt/postgresql@14/bin \
    -B /usr/local/opt/postgresql@17/bin \
    -d /usr/local/var/postgresql@14 \
    -D /usr/local/var/postgresql@17 \
    --check

# verify no errors

# run pg_upgrade without --check

# start postgresql@17
brew services start postgresql@17

# run post-upgrade suggestions

# copy modifications to pg_hba.conf, postgresql.conf

# restart postgresql@17
brew services restart postgresql@17

# uninstall postgresql@14 (var/postgresql@14 directory remains)
brew uninstall postgresql@14

# brew cleanup
brew cleanup --prune-prefix

# link postgresql@17
brew link postgresql@17

# verify active postgres version
psql -V
