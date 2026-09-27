"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Msg from "@/components/Msg";

export default function ForecastPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [window, setWindow] = useState<number[][]>([]);
  const [loadingDefault, setLoadingDefault] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.forecastDefault();
        setColumns(res.columns);
        setWindow(res.window);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingDefault(false);
      }
    })();
  }, []);

  const updateCell = (row: number, col: number, value: string) => {
    const next = window.map((r) => [...r]);
    next[row][col] = value === "" ? 0 : parseFloat(value);
    setWindow(next);
  };

  const runForecast = async () => {
    setLoadingForecast(true);
    setError(null);
    try {
      const res = await api.runForecast(window);
      setPrediction(res.predicted_arrivals);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div>
      <h1>8. Forecast</h1>
      <p className="subtitle">
        Edit the last {window.length || "…"} months of readings below, prefilled with the real last
        training window, then get a next-month forecast.
      </p>

      {error && <Msg kind="error">{error}</Msg>}

      {loadingDefault ? (
        <Msg kind="info">Loading the default window…</Msg>
      ) : (
        columns.length > 0 && (
          <div className="card">
            <div style={{ overflowX: "auto" }}>
              <table className="editor-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    {columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {window.map((row, i) => (
                    <tr key={i}>
                      <td>t-{window.length - i}</td>
                      {row.map((val, j) => (
                        <td key={j}>
                          <input
                            type="number"
                            value={val}
                            step="any"
                            onChange={(e) => updateCell(i, j, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={runForecast} disabled={loadingForecast} style={{ marginTop: 16 }}>
              {loadingForecast ? "Forecasting…" : "Forecast next month"}
            </button>

            {prediction !== null && (
              <div style={{ marginTop: 16 }}>
                <p className="subtitle">Predicted arrivals</p>
                <div className="big-stat">{Math.round(prediction).toLocaleString()}</div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
