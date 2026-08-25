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
| `Frontend/` | `npm run lint` | ESLint (strict — zero warnings allowed) |
| `Frontend/` | `npm run build` | Type-check (`tsc -b`) then Vite build |

The Python service **must** be running before hitting any `/api/algorithm/*` endpoints from the frontend.

## Key Wiring

| Frontend Call | Backend Route | Python Endpoint | Purpose |
|---|---|---|---|
| `POST /api/algorithm/train` | `algorithmRoutes.ts` → `algorithmController.ts` | `POST /train` | Train linear regression on bike data |
| `POST /api/algorithm/predict` | `algorithmRoutes.ts` → `algorithmController.ts` | `POST /predict` | Predict price from cc + horsePower |
| `GET /api/algorithm/info` | `algorithmRoutes.ts` → `algorithmController.ts` | `GET /model/info` | Get model status and parameters |
| `N/A` | `POST /api/recommend` | `POST /recommend` | KNN bike recommendation |
| `N/A` | `N/A` | `POST /recommend/heuristic` | Heuristic recommendation (popularity, rating, proximity, price) |

## Algorithm (`algorithm/main.py`)

All ML logic lives in `main.py`:
- `LinearRegressionScratch` class — from-scratch linear regression (gradient descent + normal equation)
- `recommend_bikes_knn()` — KNN-based bike recommendation using `NearestNeighbors`
- `rank_bikes()` / `recommend_heuristic()` — heuristic recommendation by popularity, rating, proximity, price
- Model is persisted to `algorithm/saved_model.pkl` — a pre-trained model already exists
- Python deps: `algorithm/requirements.txt` (fastapi, scikit-learn, numpy, pandas, etc.)

## Database

- MongoDB on `localhost:27017` — connection string is **hardcoded** in `Backend/config/db.ts` (no env var)
- Mongoose models in `Backend/models/`: `bike.ts`, `booking.ts`, `user.ts`, `review.ts`, `payment.ts`

## Payment Methods

- **Khalti** — fully integrated (KPG-2 Web Checkout). Requires `KHALTI_SECRET_KEY`, `KHALTI_API_URL`, `FRONTEND_URL`, `BACKEND_URL` in `Backend/.env`. Uses sandbox API at `https://dev.khalti.com/api/v2`.
- **Cash on Pickup** — UI option in `PaymentForm.tsx`, calls `createBooking()` directly without payment processing.

### Khalti Payment Flow
1. User selects Khalti on `/payment` page → frontend creates a pending booking via `POST /api/booking/pending`
2. Frontend calls `POST /api/payment/khalti/initiate` → backend validates booking, calls Khalti `/epayment/initiate/`, returns `payment_url`
3. Frontend redirects user to Khalti payment page
4. User completes payment → Khalti redirects to `GET /api/payment/khalti/callback`
5. Backend calls Khalti `/epayment/lookup/` to verify (server-to-server), updates Payment + Booking on success
6. Redirects to `/Profile?payment=success`

### Khalti API Endpoints
- `POST /api/payment/khalti/initiate` — (auth required) initiate payment
- `GET /api/payment/khalti/callback` — Khalti redirect callback (no auth)
- `POST /api/payment/khalti/verify` — (auth required) manual verification via pidx

## Port Conflicts

Port 5000 is commonly left occupied. Kill with:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

## Gotchas

- The root `package.json` mixes frontend and backend dependencies (React, Leaflet). Each sub-project has its own `package.json` — install deps in `Backend/` and `Frontend/` separately.
- No backend tests exist. The algorithm service has `test_client.py` as its only test suite.
- No CI/CD workflows are configured.
- Frontend lint is strict: `--max-warnings 0` — any warning fails the lint.
- CORS is configured for `http://localhost:5173` in `app.ts` but `app.use(cors())` is called without options, effectively allowing all origins.
