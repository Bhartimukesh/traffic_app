import pandas as pd
import numpy as np

np.random.seed(42)
n = 3000

hours  = np.random.randint(0, 24, n)
days   = np.random.randint(0, 7, n)
months = np.random.randint(1, 13, n)

def vehicle_count(hour, day):
    base = 2
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        base += np.random.randint(15, 40)
    elif 11 <= hour <= 16:
        base += np.random.randint(8, 18)
    else:
        base += np.random.randint(1, 8)
    if day >= 5:
        base = int(base * 0.65)
    return base

counts = [vehicle_count(h, d) for h, d in zip(hours, days)]

def label(count):
    if count >= 25:   return 2   # High
    elif count >= 12: return 1   # Medium
    else:             return 0   # Low

df = pd.DataFrame({
    "hour":             hours,
    "day_of_week":      days,
    "month":            months,
    "vehicle_count":    counts,
    "is_weekend":       (days >= 5).astype(int),
    "is_rush_hour":     (((hours >= 8) & (hours <= 10)) |
                         ((hours >= 17) & (hours <= 20))).astype(int),
    "congestion_level": [label(c) for c in counts]
})

df.to_csv("data/traffic_data.csv", index=False)
print(f"Dataset ready: {len(df)} rows")
print(df["congestion_level"].value_counts())
print(f"\nThresholds:")
print(f"  Low    = count < 12")
print(f"  Medium = count 12-24")
print(f"  High   = count >= 25")