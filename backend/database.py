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
    # Emergency alerts table
    c.execute("""
        CREATE TABLE IF NOT EXISTS emergency_alerts (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            location_name    TEXT,
            vehicle_count    INTEGER,
            congestion_level TEXT,
            signal_status    TEXT,
            route_cleared    INTEGER DEFAULT 0,
            timestamp        TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_prediction(vehicle_count, congestion_level, confidence):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO predictions (vehicle_count, congestion_level, confidence, timestamp)
        VALUES (?, ?, ?, ?)
    """, (vehicle_count, congestion_level, confidence, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def save_emergency_alert(location_name, vehicle_count, congestion_level):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO emergency_alerts
        (location_name, vehicle_count, congestion_level, signal_status, route_cleared, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        location_name, vehicle_count, congestion_level,
        "GREEN", 0, datetime.now().isoformat()
    ))
    alert_id = c.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def get_emergency_alerts(limit=20):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT id, location_name, vehicle_count, congestion_level,
               signal_status, route_cleared, timestamp
        FROM emergency_alerts
        ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = c.fetchall()
    conn.close()
    return [{
        "id":              r[0],
        "location_name":   r[1],
        "vehicle_count":   r[2],
        "congestion_level": r[3],
        "signal_status":   r[4],
        "route_cleared":   bool(r[5]),
        "timestamp":       r[6]
    } for r in rows]

def update_route_cleared(alert_id, cleared):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        UPDATE emergency_alerts SET route_cleared = ? WHERE id = ?
    """, (1 if cleared else 0, alert_id))
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT vehicle_count, congestion_level, confidence, timestamp
        FROM predictions ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = c.fetchall()
    conn.close()
    return [{
        "vehicle_count": r[0],
        "prediction":    r[1],
        "confidence":    r[2],
        "timestamp":     r[3]
    } for r in rows]