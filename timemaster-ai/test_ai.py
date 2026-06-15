import urllib.request
import urllib.error
import json
import sys

url = "http://localhost:8082/api/ai/chat"
token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRpbWVtYXN0ZXIuY29tIiwidXNlcklkIjoxLCJpYXQiOjE3ODE1MjE2MjgsImV4cCI6MTc4MjEyNjQyOH0.0nHTmhaackcM7is8KPRV2rk82-eboqBDfM_GcSU283U"

data = {
    "message": "Hôm nay tôi có những công việc nào?"
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json; charset=utf-8"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("Success:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
