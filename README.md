# 🚜 AgriKurdistan

A highly secure, direct-to-market agricultural wholesale exchange platform built for the Kurdistan Region.

## Features
- **Smart Escrow System**: JWT-backed secure transactions for buying crops.
- **Role-Based Access Control**: Strict segregation between Farmers and Buyers.
- **XSS & Rate-Limiting**: Built-in enterprise-grade security.
- **Glassmorphic UI**: Premium frontend interface using Tailwind CSS.

## Files
- `index.html`: The frontend Dashboard UI. (Can be hosted on GitHub Pages).
- `backend.py`: The FastAPI Python backend server.
- `requirements.txt`: Python dependencies for the backend.

## How to run the backend locally
1. Install dependencies: `pip install -r requirements.txt`
2. Run the server: `python -m uvicorn backend:app --reload`
3. View the API documentation at `http://localhost:8000/docs`

## Hosting the UI on GitHub Pages
1. Push this repository to GitHub.
2. Go to the repository **Settings** > **Pages**.
3. Select the `main` branch as the source and click Save.
4. Your `index.html` dashboard will be live for everyone to see!
