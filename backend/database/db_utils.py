# 5. database/db_utils.py
"""Database utility functions."""
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
import config

# ========== SUPABASE INTEGRATION START ==========
# Initialize the connection pool for local PostgreSQL
if not config.USE_SUPABASE:
    try:
        DB_POOL = SimpleConnectionPool(minconn=1, maxconn=10, **config.DB_CONFIG)
        print("Database pool initialized successfully.")
    except Exception as e:
        print(f"Error initializing database pool: {e}")
        DB_POOL = None
else:
    DB_POOL = None


def get_db_connection():
    """Gets a connection from the pool (for local PostgreSQL only)."""
    if config.USE_SUPABASE:
        raise ConnectionError("Use get_supabase_client() for Supabase connections.")
    if not DB_POOL:
        raise ConnectionError("Database pool is not available.")
    return DB_POOL.getconn()


def release_db_connection(conn):
    """Releases a connection back to the pool (for local PostgreSQL only)."""
    if config.USE_SUPABASE:
        return  # No need to release Supabase connections
    if not DB_POOL:
        return
    DB_POOL.putconn(conn)


def get_supabase_client():
    """Get Supabase client for database operations."""
    if config.USE_SUPABASE and config.SUPABASE_CLIENT:
        return config.SUPABASE_CLIENT
    else:
        raise ConnectionError("Supabase client not available.")


# ========== SUPABASE INTEGRATION END ==========
