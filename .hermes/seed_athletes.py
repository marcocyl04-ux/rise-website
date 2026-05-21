#!/usr/bin/env python3
"""Seed 3 test athletes with varied compliance patterns for coach dashboard."""
import json, os, sys, urllib.request, urllib.error
from datetime import date, timedelta

URL = "https://zeczlwypqqvvpraosodv.supabase.co"
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TODAY = date(2026, 5, 22)

ATHLETES = [
    {"id": "19c74037-cf61-4b8a-9853-378d74f81487", "email": "jason@test.rise",
     "full_name": "Jason Wong",  "pattern": "good"},
    {"id": "9c42c438-fdc8-44d6-8bd2-54de30f8deff", "email": "ryan@test.rise",
     "full_name": "Ryan Chan",   "pattern": "slipping"},
    {"id": "9bd9d3ee-32ea-4dda-a9b5-744347bbee6f", "email": "emily@test.rise",
     "full_name": "Emily Lam",   "pattern": "new"},
]

def req(method, path, payload=None, prefer=None):
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(f"{URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            body = resp.read().decode()
            return resp.status, (json.loads(body) if body else None)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return e.code, body

def upsert(table, rows, on_conflict=None):
    path = f"/rest/v1/{table}"
    if on_conflict:
        path += f"?on_conflict={on_conflict}"
    code, body = req("POST", path, rows, prefer="resolution=merge-duplicates,return=representation")
    print(f"  upsert {table}: {code} ({len(rows)} rows)")
    if code >= 300:
        print(f"    body: {body}")
    return body

def iso(d): return d.isoformat()

# 1) Insert profiles
print("Inserting user_profiles...")
profiles = [{
    "id": a["id"],
    "email": a["email"],
    "full_name": a["full_name"],
    "role": "athlete",
    "team_id": "rise-hk",
    "language": "en",
} for a in ATHLETES]
upsert("user_profiles", profiles, on_conflict="id")

# 2) Insert baselines
print("Inserting baseline_intake...")
baselines = []
for a in ATHLETES:
    if a["full_name"] == "Jason Wong":
        baselines.append({"user_id": a["id"], "weight_kg": 72.0, "age": 16,
                          "growth_rate": "moderate", "primary_goal": "muscle_gain",
                          "protein_target_g": 136.8})
    elif a["full_name"] == "Ryan Chan":
        baselines.append({"user_id": a["id"], "weight_kg": 68.5, "age": 15,
                          "growth_rate": "fast", "primary_goal": "muscle_gain",
                          "protein_target_g": 130.2})
    elif a["full_name"] == "Emily Lam":
        baselines.append({"user_id": a["id"], "weight_kg": 58.0, "age": 14,
                          "growth_rate": "moderate", "primary_goal": "maintenance",
                          "protein_target_g": 110.2})
upsert("baseline_intake", baselines, on_conflict="user_id")

# 3) Insert daily_weight rows
print("Inserting daily_weight...")
weights = []
# Jason: 7 days of weights, latest today, consistent (small fluctuation)
jason_base = 72.0
for i in range(7):
    d = TODAY - timedelta(days=i)
    w = jason_base + (0.2 if i % 2 == 0 else -0.1) + (0.1 * (i % 3))
    weights.append({"user_id": ATHLETES[0]["id"], "weight_kg": round(w, 1), "logged_date": iso(d)})

# Ryan: weights ending 4 days ago (no recent log) + a big drop suggesting illness
# 8 days ago: 70.5, 7d: 70.3, 6d: 70.0, 5d: 69.8, 4d: 67.0 (big drop), then NONE
ryan_seq = [(8, 70.5), (7, 70.3), (6, 70.0), (5, 69.8), (4, 67.0)]
for days_ago, w in ryan_seq:
    weights.append({"user_id": ATHLETES[1]["id"], "weight_kg": w,
                    "logged_date": iso(TODAY - timedelta(days=days_ago))})

# Emily: no weight logs
upsert("daily_weight", weights, on_conflict="user_id,logged_date")

# 4) Insert meal_logs
print("Inserting meal_logs...")
SLOTS = ["breakfast", "snack_1", "lunch", "snack_2", "dinner", "snack_3"]

def meal(uid, slot, d, items, fb=None):
    total = sum(it["protein_g"] for it in items)
    return {
        "user_id": uid, "meal_slot": slot, "logged_date": iso(d),
        "food_items": items, "total_protein_g": total, "ai_feedback": fb,
    }

CHICKEN = {"name": "Chicken breast", "name_zh": "鸡胸肉", "protein_g": 35, "confidence": 1, "portion_label": "1 palm"}
EGGS = {"name": "Eggs", "name_zh": "蛋", "protein_g": 12, "confidence": 1, "portion_label": "2 large"}
RICE_BEEF = {"name": "Beef and rice bowl", "name_zh": "牛肉饭", "protein_g": 28, "confidence": 1, "portion_label": "1 bowl"}
YOGURT = {"name": "Greek yogurt", "name_zh": "希腊乳酪", "protein_g": 17, "confidence": 1, "portion_label": "1 cup"}
SALMON = {"name": "Salmon", "name_zh": "三文鱼", "protein_g": 22, "confidence": 1, "portion_label": "1 fillet"}
SHAKE = {"name": "Protein shake", "name_zh": "蛋白奶昔", "protein_g": 25, "confidence": 1, "portion_label": "1 scoop"}
TOFU = {"name": "Tofu", "name_zh": "豆腐", "protein_g": 10, "confidence": 1, "portion_label": "1 block"}
TOAST = {"name": "Whole wheat toast", "name_zh": "全麦多士", "protein_g": 5, "confidence": 1, "portion_label": "2 slices"}

meals = []

# Jason: 5-6 meals/day for last 3 days (good compliance)
JASON_ID = ATHLETES[0]["id"]
for days_ago in [0, 1, 2]:
    d = TODAY - timedelta(days=days_ago)
    # Today (days_ago=0) — log only 3 so "meals today" shows progress
    if days_ago == 0:
        plan = [("breakfast", [EGGS, TOAST]), ("snack_1", [SHAKE]), ("lunch", [CHICKEN, RICE_BEEF])]
    else:
        plan = [("breakfast", [EGGS, TOAST]), ("snack_1", [SHAKE]), ("lunch", [CHICKEN, RICE_BEEF]),
                ("snack_2", [YOGURT]), ("dinner", [SALMON, RICE_BEEF])]
        if days_ago == 1:
            plan.append(("snack_3", [YOGURT]))
    for slot, items in plan:
        fb = "Big numbers today, Jason. Keep the streak alive." if slot == "dinner" and days_ago == 1 else None
        meals.append(meal(JASON_ID, slot, d, items, fb))

# Ryan: slipping — only 2-3 meals yesterday and day before, none today
RYAN_ID = ATHLETES[1]["id"]
plans_ryan = {
    1: [("breakfast", [EGGS]), ("lunch", [RICE_BEEF])],  # 2 meals
    2: [("breakfast", [EGGS]), ("lunch", [RICE_BEEF]), ("dinner", [TOFU])],  # 3 meals
    3: [("breakfast", [EGGS, TOAST]), ("snack_1", [SHAKE]), ("lunch", [CHICKEN]),
        ("snack_2", [YOGURT]), ("dinner", [SALMON])],  # was OK before
}
for days_ago, plan in plans_ryan.items():
    d = TODAY - timedelta(days=days_ago)
    for slot, items in plan:
        meals.append(meal(RYAN_ID, slot, d, items))

# Emily: new — only 1 meal logged today
EMILY_ID = ATHLETES[2]["id"]
meals.append(meal(EMILY_ID, "breakfast", TODAY, [EGGS, TOAST],
                  "Welcome to RISE, Emily! Solid first meal."))

upsert("meal_logs", meals, on_conflict="user_id,meal_slot,logged_date")

print("\nDone.")
