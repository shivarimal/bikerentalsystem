# Bike Rental System — Agent Guide

## Architecture

- **Backend** (`Backend/`): Node.js + Express + TypeScript, port **5000**
- **Frontend** (`Frontend/`): React + TypeScript + Vite, port **5173**
- **Algorithm** (`algorithm/`): Python FastAPI (port **8000**), all ML logic in `algorithm/main.py` — no separate recommendation.py

The backend proxies ML/algorithm requests to the Python service. Both servers must be running for full functionality.

## Commands

| Location | Command | Description |
|---|---|---|
| `Backend/` | `npm run dev` | Start backend on port 5000 (via ts-node) |
| `Frontend/` | `npm run dev` | Start frontend dev server on port 5173 |
| `algorithm/` | `uvicorn main:app --reload` | Start Python ML API on port 8000 |
| `algorithm/` | `python test_client.py` | Run all algorithm API tests |

The Python service **must** be running before hitting any `/api/algorithm/*` endpoints from the frontend.

## Key Wiring

| Frontend Call | Backend Route | Python Endpoint | Purpose |
|---|---|---|---|
| `POST /api/algorithm/train` | `algorithmRoutes.ts` → `algorithmController.ts` | `POST /train` | Train linear regression on bike data |
| `POST /api/algorithm/predict` | `algorithmRoutes.ts` → `algorithmController.ts` | `POST /predict` | Predict price from cc + horsePower |
| `GET /api/algorithm/info` | `algorithmRoutes.ts` → `algorithmController.ts` | `GET /model/info` | Get model status and parameters |
| `N/A` | `POST /api/recommend` | `POST /recommend` | KNN bike recommendation |

## Algorithm (`algorithm/main.py`)

All ML logic lives in `main.py`:
- `LinearRegressionScratch` class — from-scratch linear regression (gradient descent + normal equation)
- `recommend_bikes_knn()` — KNN-based bike recommendation using `NearestNeighbors`
- `rank_bikes()` / `recommend_heuristic()` — heuristic recommendation by popularity, rating, proximity, price
- Both `/recommend` (KNN) and `/recommend/heuristic` endpoints

## Controller Rules

- Express controllers **must not** return `res.json(...)` — just call `res.json(...)` without `return` to avoid `Promise<Response>` type mismatches with Express handler signatures.
- Use explicit `Promise<void>` return type on controller functions.

## Stripe Keys

The backend reads `STRIPE_SECRET_KEY` from `Backend/.env`; the frontend reads `VITE_STRIPE_PUBLISHABLE_KEY` from `Frontend/.env`. Both must be real Stripe test keys for the same account. A common mistake: the secret key ends up in the `STRIPE_PUBLISHABLE_KEY` variable while `STRIPE_SECRET_KEY` holds a dummy placeholder — payment intents will return 500.

## Port Conflicts

Port 5000 is commonly left occupied. Kill with:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```
