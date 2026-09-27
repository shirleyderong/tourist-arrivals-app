import itertools
from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.preprocessing import MinMaxScaler
from statsmodels.stats.outliers_influence import variance_inflation_factor

STATE: dict[str, Any] = {}

DATA_PATH = "data/tourist_arrivals.csv"

CANDIDATES = [
    "quarter", "is_holiday_peak", "temp_mean_c", "temp_min_c", "temp_max_c",
    "rainfall_mm", "rainy_days", "humidity_pct", "typhoon_count",
    "typhoon_max_wind_kt", "storm_signal_days", "pm25_ugm3", "wave_height_m",
    "season_Dry", "season_Transition", "season_Wet",
    "monsoon_Amihan", "monsoon_Habagat", "monsoon_Transition",
]

LOOKBACK = 12
SEASONAL_PERIOD = 12
PARAM_GRID = {"units": [32, 64], "dropout": [0.1, 0.3], "batch_size": [16, 32]}

def load_dataset() -> dict:
    df = (
        pd.read_csv(DATA_PATH, parse_dates=["date"], skiprows=2)
        .sort_values("date")
        .reset_index(drop=True)
    )
    STATE["raw_df"] = df

    expected = pd.date_range(df["date"].min(), df["date"].max(), freq="MS")
    missing_months = expected.difference(df["date"])

    head = df.head().copy()
    head["date"] = head["date"].astype(str)

    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "head": head.to_dict(orient="records"),
        "missing_months": [str(d.date()) for d in missing_months],
        "date_min": str(df["date"].min().date()),
        "date_max": str(df["date"].max().date()),
    }

def run_cleaning() -> dict:
    if "raw_df" not in STATE:
        raise ValueError("Load the dataset first.")
    df = STATE["raw_df"].copy()

    # 1. Duplicates
    duplicates_removed = int(df.duplicated(subset="date").sum())
    df = df.drop_duplicates(subset="date", keep="first")

    # 2. Encode categoricals before interpolating
    df = pd.get_dummies(df, columns=["season", "monsoon"], dtype=float)

    # 3. Missing-value report (computed BEFORE interpolation, so it's meaningful)
    numeric_cols = df.select_dtypes(include=["number"]).columns
    missing = df[numeric_cols].isna().sum()
    missing = missing[missing > 0]

    # 4. Interpolate numeric columns
    df[numeric_cols] = df[numeric_cols].interpolate(method="linear")

    # 5. Flag outliers in arrivals via IQR
    q1, q3 = df["arrivals"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    flagged = df[(df["arrivals"] < lower) | (df["arrivals"] > upper)]
    flagged_out = flagged[["date", "arrivals"]].copy()
    flagged_out["date"] = flagged_out["date"].astype(str)

    STATE["clean_df"] = df
    report = {
        "duplicates_removed": duplicates_removed,
        "missing": {k: int(v) for k, v in missing.to_dict().items()},
        "flagged": flagged_out.to_dict(orient="records"),
    }
    STATE["clean_report"] = report
    return report

def run_feature_selection() -> dict:
    if "clean_df" not in STATE:
        raise ValueError("Run cleaning first.")
    df = STATE["clean_df"]

    results = []
    for col in CANDIDATES:
        if col in df.columns:
            valid = df[[col, "arrivals"]].dropna()
            if len(valid) > 0:
                rho, p_value = spearmanr(valid[col], valid["arrivals"])
                results.append({"feature": col, "rho": float(rho), "p_value": float(p_value)})

    kept = [r["feature"] for r in results if abs(r["rho"]) > 0.10 and r["p_value"] < 0.05]

    X = df[kept].dropna()
    vif_log = []
    while X.shape[1] > 0:
        vifs = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        max_vif = max(vifs)
        if max_vif < 5:
            break
        drop_col = X.columns[vifs.index(max_vif)]
        vif_log.append({"dropped": drop_col, "vif": float(max_vif)})
        X = X.drop(columns=[drop_col])

    STATE["selected_features"] = list(X.columns)
    report = {"results": results, "vif_log": vif_log, "selected_features": list(X.columns)}
    STATE["feature_report"] = report
    return report

def make_sequences(X, y, lookback):
    Xs, ys = [], []
    for i in range(len(X) - lookback):
        Xs.append(X[i:i + lookback])
        ys.append(y[i + lookback])
    return np.array(Xs), np.array(ys)


def run_prepare(train_ratio: float = 0.80) -> dict:
    if "selected_features" not in STATE:
        raise ValueError("Run feature selection first.")
    if not (0.5 <= train_ratio <= 0.95):
        raise ValueError("train_ratio must be between 0.5 and 0.95.")

    df = STATE["clean_df"]
    split_idx = int(len(df) * train_ratio)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    cols = STATE["selected_features"]

    scaler_X = MinMaxScaler().fit(train_df[cols])
    scaler_y = MinMaxScaler().fit(train_df[["arrivals"]])

    train_X = scaler_X.transform(train_df[cols])
    test_X = scaler_X.transform(test_df[cols])
    train_y = scaler_y.transform(train_df[["arrivals"]])
    test_y = scaler_y.transform(test_df[["arrivals"]])

    X_train_seq, y_train_seq = make_sequences(train_X, train_y, LOOKBACK)
    X_test_seq, y_test_seq = make_sequences(test_X, test_y, LOOKBACK)

    STATE.update(
        scaler_X=scaler_X,
        scaler_y=scaler_y,
        X_train_seq=X_train_seq,
        y_train_seq=y_train_seq,
        X_test_seq=X_test_seq,
        y_test_seq=y_test_seq,
        test_df=test_df,
    )

    report = {
        "train_ratio": train_ratio,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_range": [str(train_df["date"].min().date()), str(train_df["date"].max().date())],
        "test_range": [str(test_df["date"].min().date()), str(test_df["date"].max().date())],
        "train_windows": len(X_train_seq),
        "test_windows": len(X_test_seq),
        "lookback": LOOKBACK,
    }
    STATE["prepare_report"] = report
    return report

def run_train() -> dict:
    if "X_train_seq" not in STATE:
        raise ValueError("Run prepare first.")

    # Imported lazily so the API can start up without TF loaded until needed.
    from tensorflow.keras.callbacks import EarlyStopping
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.models import Sequential

    X_train_seq = STATE["X_train_seq"]
    y_train_seq = STATE["y_train_seq"]
    lookback, n_features = X_train_seq.shape[1], X_train_seq.shape[2]

    best_val_loss = float("inf")
    best_params = None
    best_model = None
    best_history = None

    for units, dropout, batch_size in itertools.product(*PARAM_GRID.values()):
        candidate = Sequential([
            LSTM(units, input_shape=(lookback, n_features)),
            Dropout(dropout),
            Dense(1),
        ])
        candidate.compile(optimizer="adam", loss="mse")
        hist = candidate.fit(
            X_train_seq, y_train_seq,
            validation_split=0.15, epochs=100, batch_size=batch_size,
            callbacks=[EarlyStopping(patience=8, restore_best_weights=True)],
            verbose=0,
        )
        val_loss = min(hist.history["val_loss"])
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_params = {"units": units, "dropout": dropout, "batch_size": batch_size}
            best_model, best_history = candidate, hist.history

    STATE["model"] = best_model
    report = {
        "best_params": best_params,
        "val_loss": float(best_val_loss),
        "loss_history": [float(x) for x in best_history["loss"]],
        "val_loss_history": [float(x) for x in best_history["val_loss"]],
    }
    STATE["train_report"] = report
    return report

def score(actual, pred) -> dict:
    mae = float(np.mean(np.abs(actual - pred)))
    rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
    mape = float(np.mean(np.abs((actual - pred) / actual)) * 100)
    ss_res = np.sum((actual - pred) ** 2)
    ss_tot = np.sum((actual - actual.mean()) ** 2)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "R2": float(1 - ss_res / ss_tot)}


def run_evaluate() -> dict:
    if "model" not in STATE:
        raise ValueError("Run training first.")

    model = STATE["model"]
    X_test_seq = STATE["X_test_seq"]
    y_test_seq = STATE["y_test_seq"]
    scaler_y = STATE["scaler_y"]

    pred_scaled = model.predict(X_test_seq, verbose=0)
    pred = scaler_y.inverse_transform(pred_scaled)
    actual = scaler_y.inverse_transform(y_test_seq)

    lookback = X_test_seq.shape[1]
    n_windows = len(X_test_seq)
    test_arrivals = STATE["test_df"]["arrivals"].to_numpy()

    if lookback < SEASONAL_PERIOD:
        raise ValueError(
            f"Seasonal naive needs a lookback of at least {SEASONAL_PERIOD} months; got {lookback}"
        )

    naive = np.array(
        [test_arrivals[i + lookback - 1] for i in range(n_windows)]
    ).reshape(-1, 1)
    seasonal_naive = np.array(
        [test_arrivals[i + lookback - SEASONAL_PERIOD] for i in range(n_windows)]
    ).reshape(-1, 1)

    report = {
        "LSTM": score(actual, pred),
        "Naive": score(actual, naive),
        "Seasonal naive": score(actual, seasonal_naive),
    }
    STATE["evaluate_report"] = report
    return report

def run_explain() -> dict:
    if "model" not in STATE:
        raise ValueError("Run training first.")

    import shap  # lazy import, same reasoning as tensorflow above

    X_train_seq = STATE["X_train_seq"]
    X_test_seq = STATE["X_test_seq"]
    features = STATE["selected_features"]
    model = STATE["model"]

    lookback, n_features = X_train_seq.shape[1], X_train_seq.shape[2]

    def predict_flat(flat_x):
        seq = flat_x.reshape(-1, lookback, n_features)
        return model.predict(seq, verbose=0).reshape(-1)

    rng = np.random.default_rng()
    n_bg = min(50, len(X_train_seq))
    background = X_train_seq[rng.choice(len(X_train_seq), n_bg, replace=False)]
    background_summary = shap.kmeans(background.reshape(len(background), -1), min(10, n_bg))
    test_sample = X_test_seq[:20]

    explainer = shap.KernelExplainer(predict_flat, background_summary)
    shap_values = explainer.shap_values(test_sample.reshape(len(test_sample), -1), nsamples=100)

    if isinstance(shap_values, list):
        shap_values = shap_values[0]
    shap_values = shap_values.reshape(len(test_sample), lookback, n_features)

    mean_abs = np.abs(shap_values).mean(axis=(0, 1))
    top_idx = int(np.argmax(mean_abs))

    report = {
        "global_importance": dict(zip(features, mean_abs.tolist())),
        "one_forecast": dict(zip(features, shap_values[0].sum(axis=0).tolist())),
        "top_feature": features[top_idx],
        "dependence": {
            "value": [float(X_test_seq[i, -1, top_idx]) for i in range(len(shap_values))],
            "shap": [float(shap_values[i, -1, top_idx]) for i in range(len(shap_values))],
        },
    }
    STATE["explain_report"] = report
    return report

def get_forecast_default() -> dict:
    if "model" not in STATE:
        raise ValueError("Run training first.")

    cols = STATE["selected_features"]
    X_train_seq = STATE["X_train_seq"]
    scaler_X = STATE["scaler_X"]

    last_window_scaled = X_train_seq[-1]
    last_window = scaler_X.inverse_transform(last_window_scaled)
    return {"columns": cols, "window": last_window.tolist()}


def run_forecast(window: list[list[float]]) -> dict:
    if "model" not in STATE:
        raise ValueError("Run training first.")

    cols = STATE["selected_features"]
    lookback = STATE["X_train_seq"].shape[1]
    scaler_X = STATE["scaler_X"]
    scaler_y = STATE["scaler_y"]
    model = STATE["model"]

    arr = np.array(window, dtype=float)
    if arr.shape != (lookback, len(cols)):
        raise ValueError(f"Expected a ({lookback}, {len(cols)}) window, got {arr.shape}.")

    X = scaler_X.transform(arr).reshape(1, lookback, len(cols))
    pred_scaled = model.predict(X, verbose=0)
    pred = float(scaler_y.inverse_transform(pred_scaled)[0, 0])
    STATE["forecast_report"] = pred
    return {"predicted_arrivals": pred}

def get_status() -> dict:
    return {
        "dataset": "raw_df" in STATE,
        "clean": "clean_df" in STATE,
        "features": "selected_features" in STATE,
        "prepare": "X_train_seq" in STATE,
        "train": "model" in STATE,
        "evaluate": "evaluate_report" in STATE,
        "explain": "explain_report" in STATE,
    }
