import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("DATABASE_URL is not set in environment or .env file.")

# Normalize postgresql+psycopg2:// if present to standard postgresql://
if DB_URL.startswith("postgresql+psycopg2://"):
    DB_URL = DB_URL.replace("postgresql+psycopg2://", "postgresql://", 1)

print("Connecting to Supabase PostgreSQL...")
conn = psycopg2.connect(DB_URL, connect_timeout=20)
cur = conn.cursor()

cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
count = cur.fetchone()[0]
print(f"Existing public tables: {count}")

if count > 0:
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    for row in cur.fetchall():
        print(f"  - {row[0]}")

conn.close()
print("Check complete.")
