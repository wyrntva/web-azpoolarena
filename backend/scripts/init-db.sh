#!/bin/sh
set -e

echo "Initializing database..."

# You can add any database initialization scripts here
# For example, creating extensions, custom functions, etc.

# Example: Create extensions
# psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
#     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
#     CREATE EXTENSION IF NOT EXISTS "pg_trgm";
# EOSQL

echo "Database initialization completed!"
