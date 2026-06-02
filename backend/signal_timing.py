# Dynamic Signal Timing Algorithm
# Vehicle count ke hisaab se green time calculate karta hai

MIN_GREEN  = 10   # seconds
MAX_GREEN  = 90   # seconds
BASE_GREEN = 30   # seconds

def calculate_green_time(vehicle_count):
    """
    Vehicle count se green time calculate karo
    Formula: Base + (count * factor) — clamped between min/max
    """
    if vehicle_count <= 0:
        return MIN_GREEN

    # Linear scaling
    factor     = 0.6   # har vehicle ke liye 0.6 second extra
    green_time = BASE_GREEN + (vehicle_count * factor)

    # Clamp between min aur max
    green_time = max(MIN_GREEN, min(MAX_GREEN, green_time))

    return round(green_time)


def calculate_phase_timing(lanes):
    """
    Multiple lanes ka timing calculate karo
    lanes = [{"name": "Lane A", "vehicle_count": 80}, ...]
    Returns optimized timing for each lane
    """
    if not lanes:
        return []

    total_vehicles = sum(lane["vehicle_count"] for lane in lanes)
    results        = []

    for lane in lanes:
        count      = lane["vehicle_count"]
        green_time = calculate_green_time(count)

        # Traffic level determine karo
        if count > 50:
            level = "High"
            color = "#ef4444"
        elif count > 20:
            level = "Medium"
            color = "#eab308"
        else:
            level = "Low"
            color = "#22c55e"

        # Priority score (higher = more green time)
        priority = round((count / max(total_vehicles, 1)) * 100, 1)

        # Recommendation
        if count > 60:
            recommendation = "🚨 Extend green — heavy congestion"
        elif count > 30:
            recommendation = "⚠️ Normal green — moderate traffic"
        else:
            recommendation = "✅ Reduce green — light traffic"

        results.append({
            "lane_name":      lane["name"],
            "vehicle_count":  count,
            "green_time":     green_time,
            "red_time":       BASE_GREEN,
            "yellow_time":    3,
            "level":          level,
            "color":          color,
            "priority_score": priority,
            "recommendation": recommendation,
            "cycle_time":     green_time + 3 + BASE_GREEN,  # green + yellow + red
        })

    # Total cycle time
    total_cycle = sum(r["green_time"] + 3 for r in results)
    for r in results:
        r["total_cycle"] = total_cycle

    return results


def get_signal_schedule(lanes):
    """
    Poora signal schedule banao — kaun si lane kab green hogi
    """
    timing = calculate_phase_timing(lanes)
    schedule = []
    current_time = 0

    for phase in timing:
        schedule.append({
            "lane":       phase["lane_name"],
            "start_sec":  current_time,
            "green_end":  current_time + phase["green_time"],
            "yellow_end": current_time + phase["green_time"] + 3,
            "end_sec":    current_time + phase["green_time"] + 3 + phase["red_time"],
            "green_time": phase["green_time"],
        })
        current_time += phase["green_time"] + 3

    return schedule