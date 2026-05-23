import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv("data/traffic_data.csv")

features = ["hour", "day_of_week", "month", "vehicle_count",
            "is_weekend", "is_rush_hour"]
X = df[features]
y = df["congestion_level"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc    = accuracy_score(y_test, y_pred)

print(f"Accuracy: {acc*100:.1f}%")
print(classification_report(y_test, y_pred,
      target_names=["Low", "Medium", "High"]))

# Model save karo
joblib.dump(model, "models/traffic_model.pkl")
print("Model saved → models/traffic_model.pkl")

# Confusion matrix image save karo (report ke liye)
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Low","Medium","High"],
            yticklabels=["Low","Medium","High"])
plt.title(f"Confusion Matrix  (Accuracy: {acc*100:.1f}%)")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig("models/confusion_matrix.png")
print("Confusion matrix saved → models/confusion_matrix.png")