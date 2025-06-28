#!/bin/bash

MIGRATIONS_DIR="supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

cd "$MIGRATIONS_DIR"

# Current timestamp seed
BASE_TS=$(date +"%Y%m%d%H%M%S")
COUNTER=0

for FILE in *.sql; do
  if [[ "$FILE" =~ ^[0-9]{2}-.*\.sql$ || "$FILE" =~ ^[a-zA-Z].*\.sql$ ]]; then
    # Clean up the filename
    BASE_NAME=$(echo "$FILE" | sed 's/^[0-9\-]*//; s/ /_/g')
    NEW_NAME=$((BASE_TS + COUNTER))_"$BASE_NAME"
    mv "$FILE" "$NEW_NAME"
    echo "✅ Renamed $FILE → $NEW_NAME"
    ((COUNTER++))
  else
    echo "⚠️ Skipping $FILE (already looks valid)"
  fi
done

echo "🎉 All migration files renamed successfully!"
