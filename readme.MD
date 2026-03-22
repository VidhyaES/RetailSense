# RetailSense — Retail Analytics & Demand Forecasting Platform

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-orange?style=flat-square&logo=scikit-learn)

A production-grade full-stack retail analytics platform with ML-powered demand forecasting and anomaly detection.

---

## Live Features

- **ETL Pipeline** — 4-stage CSV ingestion: Extract → Validate → Transform → Load into PostgreSQL
- **EDA Dashboard** — Sales trends, category breakdowns, store performance, seasonality patterns
- **Demand Forecasting** — Random Forest + SARIMA ensemble with 30-day ahead predictions and confidence intervals
- **Anomaly Detection** — Isolation Forest detecting unusual sales spikes and drops with severity scoring
- **JWT Auth** — Secure token-based authentication with refresh token rotation
- **React Dashboard** — Sidebar navigation, KPI cards, interactive Recharts visualizations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 (normalized schema, indexed) |
| ML Models | scikit-learn (Random Forest, Isolation Forest), statsmodels (SARIMA) |
| Data Pipeline | Pandas ETL pipeline |
| Frontend | React 18 (Vite) + Recharts |
| Auth | JWT via SimpleJWT |
| Containerization | Docker (PostgreSQL) |

---

## Architecture
```
RetailSense/
├── products/              # Models: Category, Product, Store,
│   │                      #   SalesTransaction, ForecastLog
│   └── management/
│       └── commands/
│           └── seed_db.py # Seeds 5 categories, 27 products, 6 stores
├── data_ingestion/
│   ├── pipeline.py        # ETL: Extractor → Validator → Transformer → Loader
│   └── views.py           # POST /api/ingest/upload/
├── analytics/
│   ├── anomaly.py         # Isolation Forest anomaly detection engine
│   └── views.py           # 6 EDA endpoints
├── forecasting/
│   ├── engine.py          # Random Forest + SARIMA + Ensemble
│   └── views.py           # POST /api/forecast/run/
├── ml/
│   └── generate_data.py   # Synthetic retail data generator
└── frontend/
    └── src/
        ├── components/    # KPICard, SalesTrend, CategoryChart,
        │                  #   StoreTable, ForecastChart, AnomalyPanel
        └── pages/         # Login, Dashboard
```

---

## ML Models

### Demand Forecasting — Random Forest + SARIMA Ensemble
- **Random Forest** — 300 estimators, 28 engineered features (lag-1/7/14/28, rolling stats, calendar features), bootstrap confidence intervals
- **SARIMA(1,1,1)(1,1,0,7)** — weekly seasonality, 80% confidence intervals
- **Ensemble** — 60% RF + 40% SARIMA blend
- **Validation** — 3-fold TimeSeriesSplit cross-validation
- **Metrics** — MAE: ~5.7, RMSE: ~8.7 on grocery products

### Anomaly Detection — Isolation Forest
- Detects unusual daily sales patterns per product/store combination
- Features: daily qty, rolling mean/std (7/14 day), lag features, z-score, day-of-week
- Severity classification: Critical (score ≥ 0.85), High (≥ 0.70), Medium
- Direction labelling: Spike or Drop vs 7-day rolling average

---

## API Reference

### Authentication
```bash
POST /api/auth/token/          # Get JWT access + refresh tokens
POST /api/auth/token/refresh/  # Refresh access token
```

### ETL / Ingestion
```bash
POST /api/ingest/upload/       # Upload sales CSV → runs ETL pipeline
GET  /api/ingest/status/       # Database summary stats
```

### Analytics
```bash
GET /api/analytics/sales-trend/?granularity=daily&days=90
GET /api/analytics/category-summary/?days=90
GET /api/analytics/top-products/?days=30&limit=10
GET /api/analytics/store-performance/?days=90
GET /api/analytics/seasonality/
GET /api/analytics/anomalies/?days=90&severity=all
```

### Forecasting
```bash
POST /api/forecast/run/        # Train models + generate forecast
GET  /api/forecast/results/    # Retrieve stored forecast
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop

### 1. Clone the repo
```bash
git clone https://github.com/VidhyaES/RetailSense.git
cd RetailSense
```

### 2. Start PostgreSQL
```bash
docker run --name retailsense_db \
  -e POSTGRES_DB=retailsense_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:15-alpine

docker update --restart always retailsense_db
```

### 3. Backend setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_db
python manage.py createsuperuser
python manage.py runserver
```

### 4. Generate + upload data
```bash
python ml/generate_data.py

# Get token
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Upload CSV
curl -X POST http://127.0.0.1:8000/api/ingest/upload/ \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/sales_transactions.csv"
```

### 5. Frontend setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## CSV Upload Format

| Column | Required | Example |
|---|---|---|
| transaction_id | Yes | TXN00000001 |
| product_sku | Yes | GRO-RICE-001 |
| store_code | Yes | KCH001 |
| quantity | Yes | 3 |
| unit_price | Yes | 285.00 |
| sold_at | Yes | 2025-06-15T14:30:00 |
| discount_pct | No | 10 |
| payment_method | No | upi |

---

## Dataset

Synthetic data generated with realistic patterns:
- **Seasonal effects** — peak months per category (Electronics: Oct-Dec, Clothing: Apr-May/Oct-Nov)
- **Day-of-week effects** — weekend multipliers per category
- **Promotion spikes** — random 5% chance of 1.8-2.5x demand spike
- **6 stores** — Kochi (×2), Trivandrum, Bangalore (×2), Online
- **27 products** across 5 categories

---

## Author

**Vidhya ES** — AI/ML Engineer  
[Portfolio](https://vidhya-es-portfolio.vercel.app) · [GitHub](https://github.com/VidhyaES) · [LinkedIn](https://linkedin.com/in/vidhya-es-9946ufg)