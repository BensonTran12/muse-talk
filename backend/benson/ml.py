import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
from preprocess import preprocess_eeg

# Step 1: Load dataset
df = pd.read_csv("eeg_training_data.csv")

# Step 2: Preprocess using helper module
X, y, encoder, pca = preprocess_eeg(df)  # or X, y, _, encoder, pca if 5 returns
print("✅ Preprocessing done. Feature shape:", X.shape)

# Step 3: Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 4: Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Step 5: Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

# Step 6: Save model, encoder, and PCA
joblib.dump(model, "model.joblib")
joblib.dump(encoder, "encoder.joblib")
joblib.dump(pca, "pca.joblib")
print("✅ Model, encoder, and PCA saved successfully")