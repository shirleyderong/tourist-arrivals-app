"use client";

import { useState } from "react";
import { api, type PrepareResponse } from "@/lib/api";
import Msg from "@/components/Msg";

export default function PreparePage() {
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [data, setData] = useState<PrepareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runPrepare(trainRatio));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>4. Prevent leakage and prepare sequences</h1>
      <p className="subtitle">
        Chronological split → scaler fit on training rows only → windowed into (N, L, F) sequences.
      </p>

      <div className="card">
        <label>
          Train split ratio: <strong>{Math.round(trainRatio * 100)}%</strong> train /{" "}
          {Math.round((1 - trainRatio) * 100)}% test
        </label>
        <input
          type="range"
          min={0.6}
          max={0.95}
          step={0.05}
          value={trainRatio}
          onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
        />
      </div>

      <button onClick={run} disabled={loading}>
        {loading ? "Preparing…" : "Run"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <p>
            Split used: {Math.round(data.train_ratio * 100)}% train /{" "}
            {Math.round((1 - data.train_ratio) * 100)}% test
          </p>
          <p>
            Train: {data.train_rows} rows ({data.train_range[0]} – {data.train_range[1]})
          </p>
          <p>
            Test: {data.test_rows} rows ({data.test_range[0]} – {data.test_range[1]})
          </p>
          <Msg kind="success">
            {data.train_windows} training windows, {data.test_windows} test windows, lookback ={" "}
            {data.lookback}
          </Msg>
        </div>
      )}
    </div>
  );
}
