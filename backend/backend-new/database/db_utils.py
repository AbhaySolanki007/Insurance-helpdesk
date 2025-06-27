# 2. database/db_utils.py
"""Database utility functions."""
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
import config

# Initialize the connection pool
try:
    DB_POOL = SimpleConnectionPool(minconn=1, maxconn=10, **config.DB_CONFIG)
    print("Database pool initialized successfully.")
except Exception as e:
    print(f"Error initializing database pool: {e}")
    DB_POOL = None


def get_db_connection():
    """Gets a connection from the pool."""
    if not DB_POOL:
        raise ConnectionError("Database pool is not available.")
    return DB_POOL.getconn()


def release_db_connection(conn):
    """Releases a connection back to the pool."""
    if not DB_POOL:
        return
    DB_POOL.putconn(conn)
