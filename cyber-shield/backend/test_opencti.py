#!/usr/bin/env python
"""Test OpenCTI integration"""
import requests
import json

base_url = "http://127.0.0.1:5001"

print("Testing OpenCTI endpoints...")
print("=" * 50)

# Test 1: Status endpoint
print("\n1. Testing /api/opencti/status")
try:
    r = requests.get(f"{base_url}/api/opencti/status")
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Response: {json.dumps(r.json(), indent=2)}")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

# Test 2: Bulk submit endpoint (with mock data)
print("\n2. Testing /api/opencti/alerts/bulk-submit")
try:
    payload = {"alert_ids": [1001, 1002]}
    r = requests.post(f"{base_url}/api/opencti/alerts/bulk-submit", 
                     json=payload,
                     headers={"Content-Type": "application/json"})
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Success: {data.get('success_count')}, Failed: {data.get('fail_count')}")
        print(f"   Response: {json.dumps(data, indent=2)}")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

# Test 3: Check if alerts endpoint works
print("\n3. Testing /api/alerts (baseline)")
try:
    r = requests.get(f"{base_url}/api/alerts")
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Alerts endpoint is working")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

print("\n" + "=" * 50)
print("Test complete!")
