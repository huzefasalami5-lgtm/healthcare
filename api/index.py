"""Vercel Serverless Function Entry Point for CuraReach 360 FastAPI Backend"""
import os
import sys

# Add backend directory to Python path so app modules import cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_dir = os.path.join(project_root, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set VERCEL environment flag if not already set
os.environ["VERCEL"] = "1"

# Import the FastAPI master app
from app.main import app

# Vercel's Python runtime expects 'app' or 'handler'
handler = app
