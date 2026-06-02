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
from database import (init_db, save_prediction, get_history,
                      save_emergency_alert, get_emergency_alerts,
                      update_route_cleared)
from yolo_detector import detect_vehicles_from_image
from signal_timing import calculate_green_time, calculate_phase_timing, get_signal_schedule

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
        width = 5 if b.get("is_emergency") else 3
        draw.rectangle([x1, y1, x2, y2], outline=col, width=width)

        # Ambulance ke liye blink effect (double border)
        if b.get("is_emergency"):
            draw.rectangle(
                [x1-3, y1-3, x2+3, y2+3],
                outline="#ffffff", width=2
            )
            label = f'🚑 AMBULANCE {int(b["confidence"]*100)}%'

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

    image_bytes  = file.read()
    location_name = request.form.get("location_name", "Unknown Location")

    # YOLO detection — ambulance bhi check hoga
    count, boxes, type_counts, ambulance_detected = detect_vehicles_from_image(image_bytes)

    # ML prediction
    feats = make_features(count)
    pred  = int(model.predict(feats)[0])
    proba = model.predict_proba(feats)[0].tolist()
    conf  = round(max(proba) * 100, 1)

    save_prediction(count, CONGESTION_MAP[pred], conf)

    # Emergency alert save karo
    alert_id = None
    if ambulance_detected:
        alert_id = save_emergency_alert(location_name, count, CONGESTION_MAP[pred])

    return jsonify({
        "vehicle_count":      count,
        "vehicle_breakdown":  type_counts,
        "prediction":         CONGESTION_MAP[pred],
        "level":              pred,
        "color":              CONGESTION_COLOR[pred],
        "confidence":         conf,
        "probabilities": {
            "low":    round(proba[0] * 100, 1),
            "medium": round(proba[1] * 100, 1),
            "high":   round(proba[2] * 100, 1),
        },
        "annotated_image":    draw_boxes(image_bytes, boxes),
        "timestamp":          datetime.now().isoformat(),
        # Emergency data
        "ambulance_detected": ambulance_detected,
        "emergency_alert": {
            "id":             alert_id,
            "signal_status":  "GREEN" if ambulance_detected else "NORMAL",
            "message":        "🚑 AMBULANCE DETECTED — Signal GREEN kiya gaya!" if ambulance_detected else None,
        } if ambulance_detected else None
    })


@app.route("/api/emergency/alerts", methods=["GET"])
def emergency_alerts():
    return jsonify(get_emergency_alerts())


@app.route("/api/emergency/clear-route/<int:alert_id>", methods=["POST"])
def clear_route(alert_id):
    update_route_cleared(alert_id, True)
    return jsonify({"success": True, "message": "Route cleared!"})

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

@app.route("/api/signal/calculate", methods=["POST"])
def calculate_signal():
    """
    Multiple lanes ka dynamic timing calculate karo
    Body: {"lanes": [{"name": "Lane A", "vehicle_count": 80}, ...]}
    """
    data  = request.json
    lanes = data.get("lanes", [])

    if not lanes:
        return jsonify({"error": "Lanes data nahi mila"}), 400

    timing   = calculate_phase_timing(lanes)
    schedule = get_signal_schedule(lanes)

    return jsonify({
        "timing":   timing,
        "schedule": schedule,
        "total_vehicles": sum(l["vehicle_count"] for l in lanes),
        "total_cycle":    sum(t["green_time"] + 3 for t in timing),
    })


@app.route("/api/signal/from-image", methods=["POST"])
def signal_from_image():
    """
    Image upload karo → YOLO count karo → Signal timing calculate karo
    """
    if "file" not in request.files:
        return jsonify({"error": "File nahi mila"}), 400

    file        = request.files["file"]
    lane_name   = request.form.get("lane_name", "Lane A")
    image_bytes = file.read()

    count, boxes, type_counts, ambulance_detected = detect_vehicles_from_image(image_bytes)

    # Single lane timing
    green_time = calculate_green_time(count)

    if count > 50:
        level = "High"
    elif count > 20:
        level = "Medium"
    else:
        level = "Low"

    save_prediction(count, level, 95.0)

    return jsonify({
        "lane_name":          lane_name,
        "vehicle_count":      count,
        "vehicle_breakdown":  type_counts,
        "green_time":         green_time,
        "red_time":           BASE_GREEN if False else 30,
        "yellow_time":        3,
        "level":              level,
        "annotated_image":    draw_boxes(image_bytes, boxes),
        "ambulance_detected": ambulance_detected,
        "recommendation":
            "🚨 Extend green — heavy congestion" if count > 60 else
            "⚠️ Normal green — moderate traffic" if count > 30 else
            "✅ Reduce green — light traffic",
    })

@app.route("/api/history")
def history():
    return jsonify(get_history())

if __name__ == "__main__":
    app.run(debug=True, port=5000)