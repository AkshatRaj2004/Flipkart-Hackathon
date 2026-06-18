# TrafficWise AI

Smart City Traffic Operations Platform for Bengaluru Traffic Police.

## Quick Start

### With Docker (recommended)

```bash
cd trafficwise-ai
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend** (requires PostgreSQL with PostGIS):

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://trafficwise:trafficwise@localhost:5432/trafficwise
export CSV_PATH="../Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"
uvicorn app.main:app --reload --port 8000
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev
```

## Modules

1. Command Center Dashboard
2. Advanced Traffic Analytics
3. Digital Twin Map (clustering, heatmap, closures)
4. Event Registry (TanStack Table, search, filters)
5. AI Congestion Forecast Engine
6. What-If Simulator
7. AI Resource Optimization
8. TrafficWise AI Copilot
9. Smart Insights Engine
10. AI Alert Center
11. Reports & Exports (PDF, CSV, Excel)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, React Leaflet, Recharts
- **Backend**: FastAPI, Python, SQLAlchemy
- **Database**: PostgreSQL + PostGIS
- **AI**: Algorithmic congestion prediction, resource optimization, NLP copilot
