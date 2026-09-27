const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface StatusResponse {
  dataset: boolean;
  clean: boolean;
  features: boolean;
  prepare: boolean;
  train: boolean;
  evaluate: boolean;
  explain: boolean;
}

export interface DatasetResponse {
  rows: number;
  cols: number;
  columns: string[];
  head: Record<string, string | number>[];
  missing_months: string[];
  date_min: string;
  date_max: string;
}

export interface CleanResponse {
  duplicates_removed: number;
  missing: Record<string, number>;
  flagged: { date: string; arrivals: number }[];
}

export interface FeatureResult {
  feature: string;
  rho: number;
  p_value: number;
}

export interface VifDrop {
  dropped: string;
  vif: number;
}

export interface FeatureResponse {
  results: FeatureResult[];
  vif_log: VifDrop[];
  selected_features: string[];
}

export interface PrepareResponse {
  train_ratio: number;
  train_rows: number;
  test_rows: number;
  train_range: [string, string];
  test_range: [string, string];
  train_windows: number;
  test_windows: number;
  lookback: number;
}

export interface TrainResponse {
  best_params: { units: number; dropout: number; batch_size: number };
  val_loss: number;
  loss_history: number[];
  val_loss_history: number[];
}

export interface ScoreBlock {
  MAE: number;
  RMSE: number;
  MAPE: number;
  R2: number;
}

export interface EvaluateResponse {
  LSTM: ScoreBlock;
  Naive: ScoreBlock;
  "Seasonal naive": ScoreBlock;
}

export interface ExplainResponse {
  global_importance: Record<string, number>;
  one_forecast: Record<string, number>;
  top_feature: string;
  dependence: { value: number[]; shap: number[] };
}

export interface ForecastDefaultResponse {
  columns: string[];
  window: number[][];
}

export interface ForecastResponse {
  predicted_arrivals: number;
}

export const api = {
  status: () => request<StatusResponse>("/api/status"),
  loadDataset: () => request<DatasetResponse>("/api/dataset/load", { method: "POST" }),
  runClean: () => request<CleanResponse>("/api/clean/run", { method: "POST" }),
  runFeatures: () => request<FeatureResponse>("/api/features/run", { method: "POST" }),
  runPrepare: (train_ratio: number) =>
    request<PrepareResponse>("/api/prepare/run", {
      method: "POST",
      body: JSON.stringify({ train_ratio }),
    }),
  runTrain: () => request<TrainResponse>("/api/train/run", { method: "POST" }),
  runEvaluate: () => request<EvaluateResponse>("/api/evaluate/run", { method: "POST" }),
  runExplain: () => request<ExplainResponse>("/api/explain/run", { method: "POST" }),
  forecastDefault: () => request<ForecastDefaultResponse>("/api/forecast/default"),
  runForecast: (window: number[][]) =>
    request<ForecastResponse>("/api/forecast/run", {
      method: "POST",
      body: JSON.stringify({ window }),
    }),
};
