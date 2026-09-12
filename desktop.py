import threading
import uvicorn
import webview
import sys
import os

# Add the backend folder to Python's module path so it can import main.py
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
from main import app

def start_server():
    # Run FastAPI quietly in the background
    uvicorn.run(app, host="127.0.0.1", port=3000, log_level="critical")

if __name__ == "__main__":
    # 1. Start the web server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Create the native desktop window (Powered by Windows 11 Edge WebView2)
    webview.create_window(
        'Splenda', 
        'http://127.0.0.1:3000', 
        width=1280, 
        height=720,
        min_size=(1024, 768)
    )
    webview.start()