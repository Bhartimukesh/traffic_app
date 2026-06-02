import numpy as np
from PIL import Image, ImageDraw
import io
import base64

# ── ACCIDENT DETECTION LOGIC ────────────────────────────
# YOLO mein koi "accident" class nahi hai
# Hum heuristics use karenge:
# 1. Collision — 2+ vehicles ke bounding boxes bahut zyada overlap
# 2. Overturned — vehicle ka aspect ratio abnormal (width >> height)
# 3. Wrong lane — vehicle unusual angle pe
# 4. Cluster — bahut zyada vehicles ek jagah jam (pile-up)

IOU_COLLISION_THRESH  = 0.15   # 15%+ overlap = possible collision
ASPECT_RATIO_THRESH   = 2.8    # width/height > 2.8 = possibly overturned
CLUSTER_DISTANCE      = 80     # pixels mein — kitne paas vehicles hain
CLUSTER_MIN_COUNT     = 4      # minimum vehicles in cluster = congestion hotspot


def calculate_iou(box1, box2):
    """2 bounding boxes ka overlap calculate karo"""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    if x2 <= x1 or y2 <= y1:
        return 0.0

    intersection = (x2 - x1) * (y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


def check_overturned(box):
    """
    Vehicle overturned hai kya check karo
    Normal car: height > width (portrait)
    Overturned car: width >> height (landscape bahut zyada)
    """
    x1, y1, x2, y2 = box
    width  = x2 - x1
    height = y2 - y1

    if height == 0:
        return False

    aspect_ratio = width / height
    return aspect_ratio > ASPECT_RATIO_THRESH


def check_cluster(boxes, min_count=CLUSTER_MIN_COUNT):
    """
    Ek jagah bahut saari gaadiyaan hain kya (pile-up / jam)
    """
    if len(boxes) < min_count:
        return []

    clusters = []
    used     = set()

    for i, box1 in enumerate(boxes):
        if i in used:
            continue

        cluster    = [i]
        cx1        = (box1[0] + box1[2]) / 2
        cy1        = (box1[1] + box1[3]) / 2

        for j, box2 in enumerate(boxes):
            if i == j or j in used:
                continue

            cx2 = (box2[0] + box2[2]) / 2
            cy2 = (box2[1] + box2[3]) / 2

            dist = ((cx1 - cx2)**2 + (cy1 - cy2)**2) ** 0.5

            if dist < CLUSTER_DISTANCE:
                cluster.append(j)

        if len(cluster) >= min_count:
            clusters.append(cluster)
            used.update(cluster)

    return clusters


def detect_accidents(boxes):
    """
    Main accident detection function
    boxes = list of {"bbox": [x1,y1,x2,y2], "vehicle_type": ..., "confidence": ...}

    Returns:
        accidents = list of detected accident events
        severity  = "Critical" / "High" / "Medium" / "None"
    """
    accidents    = []
    accident_ids = set()  # which box indices are in accident

    bboxes = [b["bbox"] for b in boxes]

    # ── 1. COLLISION DETECTION ──────────────────────────
    for i in range(len(bboxes)):
        for j in range(i + 1, len(bboxes)):
            iou = calculate_iou(bboxes[i], bboxes[j])

            if iou >= IOU_COLLISION_THRESH:
                # Center distance bhi check karo
                cx_i = (bboxes[i][0] + bboxes[i][2]) / 2
                cy_i = (bboxes[i][1] + bboxes[i][3]) / 2
                cx_j = (bboxes[j][0] + bboxes[j][2]) / 2
                cy_j = (bboxes[j][1] + bboxes[j][3]) / 2
                dist = ((cx_i - cx_j)**2 + (cy_i - cy_j)**2) ** 0.5

                severity_score = iou * 100

                accidents.append({
                    "type":        "collision",
                    "description": f"Vehicle collision detected — {boxes[i]['vehicle_type']} & {boxes[j]['vehicle_type']}",
                    "severity":    "Critical" if iou > 0.4 else "High" if iou > 0.25 else "Medium",
                    "iou_score":   round(iou * 100, 1),
                    "box_indices": [i, j],
                    "center":      [round((cx_i + cx_j) / 2), round((cy_i + cy_j) / 2)],
                    "bbox":        [
                        min(bboxes[i][0], bboxes[j][0]),
                        min(bboxes[i][1], bboxes[j][1]),
                        max(bboxes[i][2], bboxes[j][2]),
                        max(bboxes[i][3], bboxes[j][3]),
                    ]
                })
                accident_ids.update([i, j])

    # ── 2. OVERTURNED VEHICLE DETECTION ─────────────────
    for i, box in enumerate(bboxes):
        if check_overturned(box):
            width  = box[2] - box[0]
            height = box[3] - box[1]
            ratio  = round(width / max(height, 1), 2)

            accidents.append({
                "type":        "overturned",
                "description": f"Overturned {boxes[i]['vehicle_type']} detected — aspect ratio {ratio}",
                "severity":    "Critical",
                "iou_score":   0,
                "box_indices": [i],
                "center":      [round((box[0] + box[2]) / 2), round((box[1] + box[3]) / 2)],
                "bbox":        box,
                "aspect_ratio": ratio
            })
            accident_ids.add(i)

    # ── 3. CLUSTER / PILE-UP DETECTION ──────────────────
    clusters = check_cluster(bboxes)
    for cluster in clusters:
        cluster_boxes = [bboxes[i] for i in cluster]
        min_x = min(b[0] for b in cluster_boxes)
        min_y = min(b[1] for b in cluster_boxes)
        max_x = max(b[2] for b in cluster_boxes)
        max_y = max(b[3] for b in cluster_boxes)

        accidents.append({
            "type":        "pileup",
            "description": f"Vehicle pile-up detected — {len(cluster)} vehicles clustered",
            "severity":    "High",
            "iou_score":   0,
            "box_indices": cluster,
            "center":      [round((min_x + max_x) / 2), round((min_y + max_y) / 2)],
            "bbox":        [min_x, min_y, max_x, max_y],
            "count":       len(cluster)
        })
        accident_ids.update(cluster)

    # Overall severity
    if not accidents:
        overall_severity = "None"
    elif any(a["severity"] == "Critical" for a in accidents):
        overall_severity = "Critical"
    elif any(a["severity"] == "High" for a in accidents):
        overall_severity = "High"
    else:
        overall_severity = "Medium"

    return accidents, overall_severity, list(accident_ids)


def draw_accident_boxes(image_bytes, boxes, accidents, accident_ids):
    """
    Accident wale boxes special highlight karo
    """
    img  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    NORMAL_COLORS = {
        "car":        "#3b82f6",
        "motorcycle": "#a855f7",
        "bus":        "#f97316",
        "truck":      "#ef4444",
        "ambulance":  "#ff0000",
    }

    ACCIDENT_COLORS = {
        "collision":  "#ff0000",
        "overturned": "#ff6600",
        "pileup":     "#ff00ff",
    }

    # Normal vehicles draw karo
    for i, b in enumerate(boxes):
        x1, y1, x2, y2 = b["bbox"]
        is_accident = i in accident_ids

        if is_accident:
            continue  # Accident wale baad mein

        col   = NORMAL_COLORS.get(b["vehicle_type"], "#ffffff")
        label = f'{b["vehicle_type"][0].upper()} {int(b["confidence"]*100)}%'
        draw.rectangle([x1, y1, x2, y2], outline=col, width=2)
        draw.rectangle([x1, max(0, y1-13), x1 + len(label)*6, max(0, y1)], fill=col)
        draw.text((x1+2, max(0, y1-12)), label, fill="#fff")

    # Accident wale vehicles highlight karo
    for accident in accidents:
        ax1, ay1, ax2, ay2 = accident["bbox"]
        acc_color = ACCIDENT_COLORS.get(accident["type"], "#ff0000")

        # Outer glow effect
        for offset in [6, 4, 2]:
            draw.rectangle(
                [ax1-offset, ay1-offset, ax2+offset, ay2+offset],
                outline=acc_color,
                width=1
            )

        # Main thick box
        draw.rectangle([ax1, ay1, ax2, ay2], outline=acc_color, width=4)

        # Label
        acc_label = {
            "collision":  "⚠ COLLISION",
            "overturned": "⚠ OVERTURNED",
            "pileup":     "⚠ PILE-UP",
        }.get(accident["type"], "⚠ ACCIDENT")

        label_w = len(acc_label) * 7 + 4
        draw.rectangle(
            [ax1, ay1-18, ax1 + label_w, ay1],
            fill=acc_color
        )
        draw.text((ax1+2, ay1-16), acc_label, fill="#ffffff")

    # Individual accident vehicle boxes
    for i in accident_ids:
        if i >= len(boxes):
            continue
        b   = boxes[i]
        x1, y1, x2, y2 = b["bbox"]
        draw.rectangle([x1, y1, x2, y2], outline="#ff0000", width=3)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return base64.b64encode(buf.getvalue()).decode()