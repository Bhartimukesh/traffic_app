from ultralytics import YOLO
import numpy as np
from PIL import Image
import io

model = YOLO("yolov8s.pt")

VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

def detect_vehicles_from_image(image_source):
    if isinstance(image_source, bytes):
        image = Image.open(io.BytesIO(image_source)).convert("RGB")
        orig_w, orig_h = image.size
        if orig_w < 1920:
            new_w = 1920
            new_h = int(orig_h * new_w / orig_w)
            image = image.resize((new_w, new_h), Image.LANCZOS)
        image_source = np.array(image)

    h, w = image_source.shape[:2]
    all_boxes = []

    # Pass 1 — full image — sabhi vehicles
    results1 = model(
        image_source,
        verbose=False,
        conf=0.12,
        iou=0.35,
        imgsz=1280,
        classes=[2, 3, 5, 7],
        agnostic_nms=True
    )
    for result in results1:
        for box in result.boxes:
            class_id = int(box.cls[0])
            if class_id in VEHICLE_CLASSES:
                x1, y1, x2, y2 = [round(v, 1) for v in box.xyxy[0].tolist()]
                all_boxes.append({
                    "vehicle_type": VEHICLE_CLASSES[class_id],
                    "confidence":   round(float(box.conf[0]), 2),
                    "bbox":         [x1, y1, x2, y2]
                })

    # Pass 2 — upar wala half crop — door ki gaadiyaan
    top_half = image_source[:h//2, :]
    results2 = model(
        top_half,
        verbose=False,
        conf=0.10,
        iou=0.35,
        imgsz=1280,
        classes=[2, 3, 5, 7],
        agnostic_nms=True
    )
    for result in results2:
        for box in result.boxes:
            class_id = int(box.cls[0])
            if class_id in VEHICLE_CLASSES:
                x1, y1, x2, y2 = [round(v, 1) for v in box.xyxy[0].tolist()]
                all_boxes.append({
                    "vehicle_type": VEHICLE_CLASSES[class_id],
                    "confidence":   round(float(box.conf[0]), 2),
                    "bbox":         [x1, y1, x2, y2]
                })

    # Sirf exact same boxes hatao — 0.85 threshold
    final_boxes = remove_duplicates(all_boxes, overlap_thresh=0.85)

    type_counts = {}
    for box in final_boxes:
        t = box["vehicle_type"]
        type_counts[t] = type_counts.get(t, 0) + 1

    return len(final_boxes), final_boxes, type_counts


def remove_duplicates(boxes, overlap_thresh=0.85):
    if not boxes:
        return boxes

    boxes = sorted(boxes, key=lambda x: x["confidence"], reverse=True)
    final = []

    for box in boxes:
        is_duplicate = False
        x1, y1, x2, y2 = box["bbox"]

        for existing in final:
            ex1, ey1, ex2, ey2 = existing["bbox"]
            ix1 = max(x1, ex1)
            iy1 = max(y1, ey1)
            ix2 = min(x2, ex2)
            iy2 = min(y2, ey2)

            if ix2 > ix1 and iy2 > iy1:
                intersection = (ix2 - ix1) * (iy2 - iy1)
                area1 = (x2 - x1) * (y2 - y1)
                area2 = (ex2 - ex1) * (ey2 - ey1)
                union = area1 + area2 - intersection
                iou = intersection / union if union > 0 else 0
                if iou > overlap_thresh:
                    is_duplicate = True
                    break

        if not is_duplicate:
            final.append(box)

    return final