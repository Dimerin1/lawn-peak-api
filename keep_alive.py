import requests
import time
import sys

API_URL = "https://lawn-peak-api.onrender.com/health"
INTERVAL = 840  # 14 minutes (just under Render's 15-minute limit)

def keep_alive():
    while True:
        try:
            response = requests.get(API_URL)
            status = "✓" if response.status_code == 200 else "✗"
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Health check: {status}", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error: {str(e)}", flush=True)
        
        time.sleep(INTERVAL)

if __name__ == "__main__":
    print("Starting health check service...", flush=True)
    keep_alive()
