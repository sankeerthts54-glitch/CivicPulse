"""
Upload seed data to Firestore.
Run AFTER generate_seed.py.

Usage:
  pip install firebase-admin
  set GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
  python upload_seed.py
"""

import json
import sys
import firebase_admin
from firebase_admin import credentials, firestore

PROJECT_ID = "civicpulse-ai"  # Change to your Firebase project ID

def upload_seed():
    try:
        with open("seed_feedback.json", encoding="utf-8") as f:
            records = json.load(f)
    except FileNotFoundError:
        print("❌ seed_feedback.json not found. Run generate_seed.py first.")
        sys.exit(1)

    # Init Firebase
    try:
        cred = credentials.ApplicationDefault()
    except Exception:
        print("⚠️  No default credentials. Set GOOGLE_APPLICATION_CREDENTIALS or log in with 'gcloud auth application-default login'")
        sys.exit(1)

    firebase_admin.initialize_app(cred, {"projectId": PROJECT_ID})
    db = firestore.client()

    print(f"Uploading {len(records)} records to Firestore...")
    batch = db.batch()
    count = 0

    for i, record in enumerate(records):
        doc_ref = db.collection("feedback").document(record["feedbackId"])

        # Convert location dict to GeoPoint
        if record.get("location") and record["location"].get("lat"):
            record["location"] = firestore.GeoPoint(
                record["location"]["lat"], record["location"]["lng"]
            )

        batch.set(doc_ref, record)
        count += 1

        # Commit in batches of 500
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"  Committed {count}/{len(records)}...")

    batch.commit()
    print(f"✅ Uploaded {count} records to Firestore!")

if __name__ == "__main__":
    upload_seed()
