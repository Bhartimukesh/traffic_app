import sqlite3
import hashlib
import os
from datetime import datetime

DB_PATH = "data/traffic.db"

def init_auth_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT UNIQUE NOT NULL,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("Auth DB ready!")

def hash_password(password):
    salt = "traffic_app_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def register_user(username, email, password):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        """, (username, email, hash_password(password), datetime.now().isoformat()))
        conn.commit()
        return {"success": True, "message": "User registered successfully!"}
    except sqlite3.IntegrityError as e:
        if "username" in str(e):
            return {"success": False, "message": "Username already exists!"}
        elif "email" in str(e):
            return {"success": False, "message": "Email already registered!"}
        return {"success": False, "message": "Registration failed!"}
    finally:
        conn.close()

def login_user(username, password):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT id, username, email FROM users
        WHERE username = ? AND password_hash = ?
    """, (username, hash_password(password)))
    user = c.fetchone()
    conn.close()
    if user:
        return {
            "success": True,
            "user": {
                "id":       user[0],
                "username": user[1],
                "email":    user[2]
            }
        }
    return {"success": False, "message": "Wrong username or password!"}

def get_all_users():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, username, email, created_at FROM users")
    users = c.fetchall()
    conn.close()
    return [{"id": u[0], "username": u[1], "email": u[2], "created_at": u[3]} for u in users]