import os
import time
from pathlib import Path

# Path to your migrations directory
MIGRATIONS_DIR = Path("supabase/migrations")

# Ensure the directory exists
if not MIGRATIONS_DIR.exists():
    print("❌ Migrations directory not found.")
    exit(1)

# Collect .sql files
sql_files = sorted([f for f in MIGRATIONS_DIR.glob("*.sql")])

# Starting timestamp
timestamp = int(time.strftime("%Y%m%d%H%M%S"))

for i, file in enumerate(sql_files):
    suffix = file.stem.split("-", 1)[-1].replace(" ", "_").lower()
    new_filename = f"{timestamp + i}_{suffix}.sql"
    new_path = MIGRATIONS_DIR / new_filename
    print(f"✅ Renaming {file.name} → {new_filename}")
    file.rename(new_path)

print("🎉 All migration files have been renamed successfully!")
