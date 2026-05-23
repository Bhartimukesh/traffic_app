import sqlite3
from datetime import datetime

DB_PATH = "data/traffic.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_count    INTEGER,
            congestion_level TEXT,
            confidence       REAL,
            timestamp        TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("Database ready!")

def save_prediction(vehicle_count, congestion_level, confidence):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO predictions
        (vehicle_count, congestion_level, confidence, timestamp)
        VALUES (?, ?, ?, ?)
    """, (vehicle_count, congestion_level,
          confidence, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT vehicle_count, congestion_level, confidence, timestamp
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = c.fetchall()
    conn.close()
    return [
        {
            "vehicle_count": r[0],
            "prediction":    r[1],
            "confidence":    r[2],
            "timestamp":     r[3]
        }
        for r in rows
    ]