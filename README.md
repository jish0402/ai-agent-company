# AI Agent Company

## Railway Deployment Instructions

This is a monorepo with two services:

1. **Backend** (Python FastAPI): `/backend`
2. **Frontend** (React + Vite): `/frontend`

### Deploy to Railway:

1. Create two separate Railway services:
   - Deploy backend from `/backend` folder  
   - Deploy frontend from `/frontend` folder

2. Set environment variables:
   - Backend: `OPENAI_API_KEY`
   - Frontend: `VITE_API_BASE_URL` (backend service URL)

### Local Development:
```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend  
cd frontend
npm install
npm run dev
```