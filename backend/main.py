from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pipeline

app = FastAPI(title="Tourist Arrivals Forecasting API")

# Allow the Next.js dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PrepareRequest(BaseModel):
    train_ratio: float = 0.80


class ForecastRequest(BaseModel):
    window: List[List[float]]


def _run(fn, *args):
    """Translate pipeline ValueErrors (missing prerequisite step) into 400s,
    and anything unexpected into a 500 with the message surfaced, so the
    frontend can show it instead of a silent failure."""
    try:
        return fn(*args)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/status")
def status():
    return pipeline.get_status()


@app.post("/api/dataset/load")
def dataset_load():
    return _run(pipeline.load_dataset)


@app.post("/api/clean/run")
def clean_run():
    return _run(pipeline.run_cleaning)


@app.post("/api/features/run")
def features_run():
    return _run(pipeline.run_feature_selection)


@app.post("/api/prepare/run")
def prepare_run(req: PrepareRequest):
    return _run(pipeline.run_prepare, req.train_ratio)


@app.post("/api/train/run")
def train_run():
    return _run(pipeline.run_train)


@app.post("/api/evaluate/run")
def evaluate_run():
    return _run(pipeline.run_evaluate)


@app.post("/api/explain/run")
def explain_run():
    return _run(pipeline.run_explain)


@app.get("/api/forecast/default")
def forecast_default():
    return _run(pipeline.get_forecast_default)


@app.post("/api/forecast/run")
def forecast_run(req: ForecastRequest):
    return _run(pipeline.run_forecast, req.window)
