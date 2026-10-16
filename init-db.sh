#!/bin/bash
set -e

# Create the other two databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE treasury_db;
    CREATE DATABASE dana_idle_db;
EOSQL

# Run the schema on all three databases
for DB in web_app_db treasury_db dana_idle_db; do
  echo "Initializing schema for $DB..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB" -f /schema.sql
done
