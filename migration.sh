#!/bin/bash

set -e  # Exit on error
MIGRATIONS_DIR="scripts"

echo "🚀 Running all migration files from $MIGRATIONS_DIR"

for file in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$file" ]; then
    echo "🔄 Executing $file..."
    supabase db execute --file "$file"
    echo "✅ Done: $file"
  else
    echo "⚠️ No SQL files found in $MIGRATIONS_DIR"
  fi
done

echo "🎉 All migrations executed successfully."