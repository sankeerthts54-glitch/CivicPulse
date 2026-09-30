"""
Seed data generator for CivicPulse AI.
Generates 1000 realistic citizen feedback records across 10 Indian states.
Run: python generate_seed.py
Output: seed_feedback.json
"""

import json
import random
import uuid
from datetime import datetime, timedelta

# ── Configuration ──────────────────────────────────────────────────────────────

STATES_DISTRICTS = {
    "Uttar Pradesh": ["Varanasi", "Lucknow", "Agra", "Prayagraj", "Gorakhpur", "Kanpur"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tirunelveli", "Tiruchirappalli"],
    "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Kalaburagi"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Satna"],
}

CATEGORIES = ["road", "water", "power", "health", "education", "sanitation", "digital"]

CATEGORY_TEMPLATES = {
    "road": [
        ("en", "The road in our area has huge potholes and is not repaired since months."),
        ("en", "Road connectivity to our village is very poor, especially during monsoon."),
        ("hi", "हमारे गांव की सड़क बहुत खराब है, महीनों से मरम्मत नहीं हुई।"),
        ("hi", "बारिश में सड़क पर पानी भर जाता है, गड्ढे बहुत गहरे हैं।"),
        ("ta", "எங்கள் பகுதியில் சாலை பழுதடைந்துள்ளது, பல மாதங்களாக சரிசெய்யவில்லை."),
        ("te", "మా గ్రామానికి రహదారి చాలా అధ్వాన్నంగా ఉంది, వర్షాకాలంలో తప్పించుకోవడం కష்టం."),
        ("mr", "आमच्या रस्त्यावर मोठे खड्डे आहेत, वाहनांना खूप त्रास होतो."),
        ("bn", "আমাদের এলাকার রাস্তা একেবারে ভাঙা, মাসের পর মাস কোনো মেরামত নেই।"),
    ],
    "water": [
        ("en", "No piped water supply for the past 3 weeks. We are buying water at high cost."),
        ("en", "Drinking water is contaminated and causing illness in children."),
        ("hi", "पानी की सप्लाई बंद है, तीन हफ्ते से नल में पानी नहीं आया।"),
        ("hi", "पीने का पानी दूषित है, बच्चे बीमार पड़ रहे हैं।"),
        ("ta", "குடிநீர் வழங்கல் மூன்று வாரங்களாக இல்லை, விலை கொடுத்து வாங்குகிறோம்."),
        ("kn", "ಕುಡಿಯುವ ನೀರಿನ ಸರಬರಾಜು ನಿಂತು ಮೂರು ವಾರವಾಯಿತು."),
        ("te", "త్రాగడానికి నీళ్ళు రాలేదు మూడు వారాలు, పిల్లలకు అనారోగ్యం వస్తోంది."),
        ("mr", "पाणी पुरवठा बंद आहे, विकत पाणी घ्यावे लागत आहे."),
    ],
    "power": [
        ("en", "Power cuts of 8-10 hours daily are destroying our livelihoods and affecting students."),
        ("en", "Transformer in our village is broken and not replaced for 2 months."),
        ("hi", "रोज 8-10 घंटे बिजली कटौती होती है, पढ़ाई और काम दोनों बाधित हो रहे हैं।"),
        ("hi", "हमारे गांव का ट्रांसफार्मर खराब है, दो महीने से ठीक नहीं हुआ।"),
        ("ta", "தினமும் 8-10 மணி நேரம் மின்சாரம் இல்லை, வாழ்க்கை மிகவும் கஷ்டமாக உள்ளது."),
        ("bn", "প্রতিদিন ৮-১০ ঘণ্টা লোডশেডিং হচ্ছে, ছাত্রছাত্রীরা পড়াশোনা করতে পারছে না।"),
        ("kn", "ಪ್ರತಿದಿನ 8-10 ಗಂಟೆ ವಿದ್ಯುತ್ ಕಡಿತ, ಜೀವನ ಕಷ್ಟವಾಗಿದೆ."),
    ],
    "health": [
        ("en", "Primary health center in our block has no doctor for the past month."),
        ("en", "Nearest hospital is 40 km away, ambulance takes hours to arrive."),
        ("hi", "हमारे ब्लॉक के स्वास्थ्य केंद्र में एक महीने से डॉक्टर नहीं है।"),
        ("ta", "அருகில் உள்ள மருத்துவமனை 40 கிமீ தூரத்தில் உள்ளது, அவசர சிகிச்சை கிடைப்பதில்லை."),
        ("te", "మా ఆరోగ్య కేంద్రంలో ఒక నెల నుండి డాక్టర్ లేరు, మందులు అయిపోయాయి."),
        ("mr", "आरोग्य केंद्रात डॉक्टर नाही, जवळचे रुग्णालय 40 किमी दूर आहे."),
        ("bn", "স্বাস্থ্য কেন্দ্রে এক মাস ধরে ডাক্তার নেই, ওষুধও শেষ।"),
    ],
    "education": [
        ("en", "Government school in our village has no teacher for 3 subjects since 6 months."),
        ("en", "School building is in very bad condition, roof leaks during rain."),
        ("hi", "सरकारी स्कूल में 6 महीने से 3 विषयों के शिक्षक नहीं हैं।"),
        ("ta", "அரசு பள்ளியில் 6 மாதமாக 3 பாடங்களுக்கு ஆசிரியர் இல்லை."),
        ("te", "ప్రభుత్వ పాఠశాలలో ఆరు నెలలు నుంచి ముగ్గురు ఉపాధ్యాయులు లేరు."),
        ("kn", "ಸರ್ಕಾರಿ ಶಾಲೆಯಲ್ಲಿ 6 ತಿಂಗಳಿಂದ ಮೂರು ವಿಷಯಗಳಿಗೆ ಶಿಕ್ಷಕರಿಲ್ಲ."),
    ],
    "sanitation": [
        ("en", "Open drains in our area overflow every monsoon, causing health hazards."),
        ("en", "No proper waste collection system in our ward for months."),
        ("hi", "हमारे मोहल्ले की नाली बंद है, बारिश में कचरा सड़कों पर बह जाता है।"),
        ("ta", "வடிகால்கள் நிரம்பி வழிகின்றன, கழிவுகள் சாலையில் பரவுகின்றன."),
        ("mr", "गटार भरून वाहते, पावसात सगळ्या रस्त्यावर पाणी भरते."),
    ],
    "digital": [
        ("en", "No mobile network connectivity in our village, we have to travel 10 km for internet."),
        ("en", "Government portal for ration card is not working for 2 weeks."),
        ("hi", "हमारे गांव में मोबाइल नेटवर्क नहीं है, इंटरनेट के लिए 10 किमी जाना पड़ता है।"),
        ("ta", "கிராமத்தில் மொபைல் நெட்வொர்க் இல்லை, அரசு போர்டல் வேலை செய்வதில்லை."),
        ("te", "మా గ్రామంలో మొబైల్ నెట్‌వర్క్ లేదు, ప్రభుత్వ పోర్టల్ పని చేయట్లేదు."),
    ],
}

CHANNELS = ["web", "text", "voice"]

# Approximate coordinates for districts
DISTRICT_COORDS = {
    "Varanasi": (25.3176, 82.9739), "Lucknow": (26.8467, 80.9462),
    "Agra": (27.1767, 78.0081), "Prayagraj": (25.4358, 81.8463),
    "Pune": (18.5204, 73.8567), "Nagpur": (21.1458, 79.0882),
    "Nashik": (19.9975, 73.7898), "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558), "Madurai": (9.9252, 78.1198),
    "Kolkata": (22.5726, 88.3639), "Howrah": (22.5958, 88.2636),
    "Siliguri": (26.7271, 88.3953), "Jaipur": (26.9124, 75.7873),
    "Jodhpur": (26.2389, 73.0243), "Udaipur": (24.5854, 73.7125),
    "Patna": (25.5941, 85.1376), "Gaya": (24.7955, 84.9994),
    "Bhagalpur": (25.2425, 86.9842), "Bengaluru": (12.9716, 77.5946),
    "Mysuru": (12.2958, 76.6394), "Hubballi": (15.3647, 75.1240),
    "Ahmedabad": (23.0225, 72.5714), "Surat": (21.1702, 72.8311),
    "Vadodara": (22.3072, 73.1812), "Bhubaneswar": (20.2961, 85.8245),
    "Cuttack": (20.4625, 85.8830), "Rourkela": (22.2604, 84.8536),
    "Bhopal": (23.2599, 77.4126), "Indore": (22.7196, 75.8577),
    "Jabalpur": (23.1815, 79.9864),
}

URGENCY_BY_CATEGORY = {
    "road": [2, 2, 3, 3, 4],
    "water": [3, 4, 4, 5, 5],
    "power": [3, 3, 4, 4, 5],
    "health": [4, 4, 5, 5, 5],
    "education": [2, 3, 3, 4, 4],
    "sanitation": [3, 3, 4, 4, 5],
    "digital": [2, 2, 3, 3, 4],
}

SENTIMENTS = ["negative", "negative", "negative", "neutral", "positive"]

# ── Generator ──────────────────────────────────────────────────────────────────

def random_date():
    start = datetime.now() - timedelta(days=90)
    delta = timedelta(seconds=random.randint(0, 90 * 24 * 3600))
    return (start + delta).isoformat() + "Z"


def generate_feedback(n=1000):
    records = []
    states = list(STATES_DISTRICTS.keys())

    for _ in range(n):
        state = random.choice(states)
        district = random.choice(STATES_DISTRICTS[state])
        category = random.choices(
            CATEGORIES, weights=[20, 20, 15, 20, 10, 10, 5]
        )[0]

        templates = CATEGORY_TEMPLATES.get(category, CATEGORY_TEMPLATES["road"])
        lang, raw_text = random.choice(templates)

        coords = DISTRICT_COORDS.get(district)
        if coords:
            lat = coords[0] + random.uniform(-0.3, 0.3)
            lng = coords[1] + random.uniform(-0.3, 0.3)
        else:
            lat, lng = None, None

        urgency = random.choice(URGENCY_BY_CATEGORY.get(category, [3]))
        sentiment = random.choice(SENTIMENTS)

        summary_map = {
            "road": f"Poor road condition in {district}, {state} causing accessibility issues.",
            "water": f"Water supply disruption in {district}, {state} affecting residents.",
            "power": f"Severe power cuts in {district}, {state} affecting daily life.",
            "health": f"Healthcare access issue in {district}, {state} — missing staff or facility.",
            "education": f"Teacher shortage or infrastructure issue at government school in {district}.",
            "sanitation": f"Drainage and waste management failure in {district}, {state}.",
            "digital": f"Lack of digital connectivity or government portal failure in {district}.",
        }

        record = {
            "feedbackId": str(uuid.uuid4()),
            "rawText": raw_text,
            "translatedText": raw_text if lang == "en" else summary_map[category],
            "language": lang,
            "state": state,
            "district": district,
            "location": {"lat": lat, "lng": lng} if lat else None,
            "channel": random.choice(CHANNELS),
            "status": "classified",
            "category": category,
            "urgency": urgency,
            "sentiment": sentiment,
            "summary": summary_map[category],
            "infrastructureType": category,
            "affectedScale": random.choice(["locality", "ward", "district"]),
            "createdAt": random_date(),
            "classifiedAt": random_date(),
        }
        records.append(record)

    return records


if __name__ == "__main__":
    print("Generating 1000 seed feedback records...")
    data = generate_feedback(1000)
    with open("seed_feedback.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated {len(data)} records -> seed_feedback.json")

    # Print summary
    from collections import Counter
    states = Counter(r["state"] for r in data)
    cats = Counter(r["category"] for r in data)
    langs = Counter(r["language"] for r in data)
    print("\n[Summary]")
    print("States:", dict(states.most_common(5)))
    print("Categories:", dict(cats.most_common()))
    print("Languages:", dict(langs.most_common()))
