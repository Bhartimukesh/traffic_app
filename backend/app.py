from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime
import base64, os
from PIL import Image, ImageDraw
import io
import numpy as np
from yolo_detector import detect_vehicles_from_image
from database import init_db, save_prediction, get_history
from auth import init_auth_db, register_user, login_user
import tempfile
from video_processor import process_video

app = Flask(__name__)
CORS(app)

# DB aur Model load karo server start hone pe
init_db()
init_auth_db()
model = joblib.load("models/traffic_model.pkl")

CONGESTION_MAP   = {0: "Low",      1: "Medium",   2: "High"}
CONGESTION_COLOR = {0: "#22c55e",  1: "#eab308",  2: "#ef4444"}

def make_features(count):
    now = datetime.now()
    h, d, m = now.hour, now.weekday(), now.month
    
    # Vehicle count ke hisaab se rush hour override karo
    # if count > 80:
    #     h = 8   # Rush hour force karo
    # elif count > 40:
    #     h = 12  # Medium time
    # else:
    #     h = 2   # Off peak
        
    return pd.DataFrame([{
        "hour":          h,
        "day_of_week":   d,
        "month":         m,
        "vehicle_count": count,
        "is_weekend":    1 if d >= 5 else 0,
        "is_rush_hour":  1 if (8 <= h <= 10 or 17 <= h <= 20) else 0
    }])

def draw_boxes(image_bytes, boxes):
    img  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Har vehicle type ka alag rang
    colors = {
        "car":        "#3b82f6",   # Blue
        "motorcycle": "#a855f7",   # Purple
        "bus":        "#f97316",   # Orange
        "truck":      "#ef4444"    # Red
    }

    img_w, img_h = img.size

    for b in boxes:
        x1, y1, x2, y2 = b["bbox"]

        # Box size ke hisaab se line width
        box_area = (x2 - x1) * (y2 - y1)
        img_area  = img_w * img_h
        ratio     = box_area / img_area
        width     = 3 if ratio > 0.01 else 2

        col   = colors.get(b["vehicle_type"], "#ffffff")
        label = f'{b["vehicle_type"][0].upper()} {int(b["confidence"]*100)}%'

        # Box draw karo
        draw.rectangle([x1, y1, x2, y2], outline=col, width=width)

        # Label background
        text_x = x1
        text_y = max(0, y1 - 14)
        draw.rectangle(
            [text_x, text_y, text_x + len(label) * 6, text_y + 13],
            fill=col
        )
        draw.text((text_x + 2, text_y + 1), label, fill="#ffffff")

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return base64.b64encode(buf.getvalue()).decode()

# ── ENDPOINTS ─────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
def register():
    data     = request.json
    username = data.get("username", "").strip()
    email    = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not username or not email or not password:
        return jsonify({"success": False, "message": "Sab fields bharo!"}), 400
    if len(username) < 3:
        return jsonify({"success": False, "message": "Username kam se kam 3 characters ka hona chahiye!"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password kam se kam 6 characters ka hona chahiye!"}), 400
    if "@" not in email:
        return jsonify({"success": False, "message": "Valid email daalo!"}), 400

    result = register_user(username, email, password)
    return jsonify(result), 200 if result["success"] else 400

@app.route("/api/login", methods=["POST"])
def login():
    data     = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username aur password dono bharo!"}), 400

    result = login_user(username, password)
    return jsonify(result), 200 if result["success"] else 401

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Backend chal raha hai!"})

@app.route("/api/detect-and-predict", methods=["POST"])
def detect_and_predict():
    if "file" not in request.files:
        return jsonify({"error": "File nahi mila"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty file"}), 400

    allowed = {"jpg", "jpeg", "png", "webp"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        return jsonify({"error": "Sirf JPG/PNG/WEBP allowed hai"}), 400

    image_bytes = file.read()

    # YOLO detection
    count, boxes, type_counts = detect_vehicles_from_image(image_bytes)

    # ML prediction
    feats = make_features(count)
    pred  = int(model.predict(feats)[0])
    proba = model.predict_proba(feats)[0].tolist()
    conf  = round(max(proba) * 100, 1)

    # DB mein save karo
    save_prediction(count, CONGESTION_MAP[pred], conf)

    return jsonify({
        "vehicle_count":     count,
        "vehicle_breakdown": type_counts,
        "prediction":        CONGESTION_MAP[pred],
        "level":             pred,
        "color":             CONGESTION_COLOR[pred],
        "confidence":        conf,
        "probabilities": {
            "low":    round(proba[0] * 100, 1),
            "medium": round(proba[1] * 100, 1),
            "high":   round(proba[2] * 100, 1),
        },
        "annotated_image": draw_boxes(image_bytes, boxes),
        "timestamp":       datetime.now().isoformat()
    })

@app.route("/api/detect-video", methods=["POST"])
def detect_video():
    if "file" not in request.files:
        return jsonify({"error": "File nahi mila"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty file"}), 400

    allowed = {"mp4", "avi", "mov", "mkv", "webm"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        return jsonify({"error": "Sirf MP4/AVI/MOV/MKV allowed hai"}), 400

    # Temp file mein save karo
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        avg_count, max_count, frame_results, duration = process_video(tmp_path)

        # Avg count se prediction karo
        feats = make_features(avg_count)
        pred  = int(model.predict(feats)[0])
        proba = model.predict_proba(feats)[0].tolist()
        conf  = round(max(proba) * 100, 1)

        # DB mein save karo
        save_prediction(avg_count, CONGESTION_MAP[pred], conf)

        return jsonify({
            "avg_vehicle_count":  avg_count,
            "max_vehicle_count":  max_count,
            "video_duration":     duration,
            "frames_analyzed":    len(frame_results),
            "frame_results":      frame_results,
            "prediction":         CONGESTION_MAP[pred],
            "level":              pred,
            "color":              CONGESTION_COLOR[pred],
            "confidence":         conf,
            "probabilities": {
                "low":    round(proba[0] * 100, 1),
                "medium": round(proba[1] * 100, 1),
                "high":   round(proba[2] * 100, 1),
            },
        })
    finally:
        import os
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route("/api/history")
def history():
    return jsonify(get_history())

if __name__ == "__main__":
    app.run(debug=True, port=5000)