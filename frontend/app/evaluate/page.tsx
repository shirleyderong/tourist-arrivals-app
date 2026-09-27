"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type EvaluateResponse } from "@/lib/api";
import Msg from "@/components/Msg";

const MODELS = ["LSTM", "Naive", "Seasonal naive"] as const;
const METRICS = ["MAE", "RMSE", "MAPE", "R2"] as const;

export default function EvaluatePage() {
  const [data, setData] = useState<EvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runEvaluate());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = METRICS.map((metric) => {
    const row: Record<string, string | number> = { metric };
    if (data) {
      for (const model of MODELS) {
        row[model] = data[model][metric];
      }
    }
    return row;
  });

  return (
    <div>
      <h1>6. Evaluate honestly</h1>
      <p className="subtitle">
        MAE, RMSE, MAPE, R² on held-out test months, scored against naive and seasonal-naive baselines.
      </p>

      <button onClick={run} disabled={loading}>
        {loading ? "Scoring…" : "Score on the test set"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {MODELS.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr key={metric}>
                    <td>{metric}</td>
                    {MODELS.map((m) => (
                      <td key={m}>{data[m][metric].toFixed(metric === "R2" ? 3 : 2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ width: "100%", height: 320, marginTop: 16 }}>
            <ResponsiveContainer>
              <BarChart data={chartData.filter((r) => r.metric !== "R2")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                <XAxis dataKey="metric" stroke="#93a1bb" />
                <YAxis stroke="#93a1bb" />
                <Tooltip contentStyle={{ background: "#121b2e", border: "1px solid #22304a" }} />
                <Legend />
                <Bar dataKey="LSTM" fill="#4f8cff" />
                <Bar dataKey="Naive" fill="#93a1bb" />
                <Bar dataKey="Seasonal naive" fill="#e5b95c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="subtitle">R² is left off the chart (different scale) — see the table above.</p>
        </div>
      )}
    </div>
  );
}
