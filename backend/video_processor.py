import cv2
import numpy as np
from PIL import Image
import io
from yolo_detector import detect_vehicles_from_image

def process_video(video_path, sample_every=30):
    """
    Video ke har 30th frame se vehicle count karo
    Returns: avg_count, max_count, frame_results
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        return None, None, []
    
    total_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps           = cap.get(cv2.CAP_PROP_FPS)
    duration      = round(total_frames / fps, 1) if fps > 0 else 0
    
    frame_results = []
    frame_num     = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Har 30th frame process karo
        if frame_num % sample_every == 0:
            # Frame ko bytes mein convert karo
            _, buffer   = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            count, boxes, type_counts = detect_vehicles_from_image(frame_bytes)
            frame_results.append({
                "frame":       frame_num,
                "time_sec":    round(frame_num / fps, 1) if fps > 0 else 0,
                "count":       count,
                "breakdown":   type_counts
            })
        
        frame_num += 1
    
    cap.release()
    
    if not frame_results:
        return 0, 0, []
    
    counts    = [r["count"] for r in frame_results]
    avg_count = round(sum(counts) / len(counts))
    max_count = max(counts)
    
    return avg_count, max_count, frame_results, duration