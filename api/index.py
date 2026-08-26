import sys
import os

# Menambahkan root project ke sys.path agar Flask app dapat diimpor
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app import app

# Handler untuk Vercel Serverless Function
app = app

if __name__ == '__main__':
    app.run()
