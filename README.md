# Tourist Arrivals Forecasting - FastAPI + Next.js

```
tourist-app/
├── backend/
│   ├── main.py            # FastAPI app - one endpoint per pipeline stage
│   ├── pipeline.py         # Core logic, ported from the Streamlit pages/*.py
│   ├── requirements.txt
│   └── data/tourist_arrivals.csv
└── frontend/
    ├── app/                # Next.js App Router - one page per pipeline stage
    ├── components/         # Sidebar, page-transition wrapper, message banner
    ├── lib/api.ts           # Typed fetch client for the backend
    └── package.json
    
```

## Running it locally

Python 3.10+ and Node 18+ is needed

**1. Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This starts the API at `http://localhost:8000`. Visit `http://localhost:8000/docs`
for the interactive Swagger UI.

**2. Frontend** (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and work through the sidebar in order: Dataset ->
Clean -> Features -> Prepare -> Train -> Evaluate -> Explain -> Forecast.

## How state works and its limits

The backend keeps pipeline state (the cleaned dataframe, selected features,
fitted scalers, the trained model) in a single in-memory Python dict
(`pipeline.STATE`), scoped to the life of the `uvicorn` process. This mirrors
what `st.session_state` did in the Streamlit app, with one difference: it's
process-global, not per-browser-tab.

If a page depends on an earlier step that hasn't run yet, the backend responds
with `400` and a message like `"Run cleaning first."`, and the frontend surfaces
it as an error banner.

## What was added

- Custom charts via **Recharts** (loss curves, grouped metric bars, SHAP bar
  charts, dependence scatter plot) instead of Streamlit's built-in charts.
- Page transitions via **Framer Motion**.
- A spreadsheet-style editable table on the Forecast page built from plain
  HTML inputs (no `st.data_editor` equivalent needed).
- Clear separation of concerns: the backend has no UI code at all and can be
  called from anything (curl, a notebook, another frontend) via `/docs`.