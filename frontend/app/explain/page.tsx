"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type ExplainResponse } from "@/lib/api";
import Msg from "@/components/Msg";

function toChartData(record: Record<string, number>) {
  return Object.entries(record)
    .map(([feature, value]) => ({ feature, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export default function ExplainPage() {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runExplain());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>7. Explain with SHAP</h1>
      <p className="subtitle">
        Global feature importance, one forecast&apos;s feature contributions, and a dependence plot
        for the top predictor — computed with a model-agnostic KernelExplainer.
      </p>

      <button onClick={run} disabled={loading}>
        {loading ? "Computing SHAP values… this takes a minute" : "Compute SHAP values"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <>
          <div className="card">
            <h2>Global feature importance</h2>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={toChartData(data.global_importance)} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                  <XAxis type="number" stroke="#93a1bb" />
                  <YAxis type="category" dataKey="feature" stroke="#93a1bb" width={140} />
                  <Tooltip contentStyle={{ background: "#121b2e", border: "1px solid #22304a" }} />
                  <Bar dataKey="value" fill="#4f8cff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2>One forecast — feature contributions</h2>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={toChartData(data.one_forecast)} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                  <XAxis type="number" stroke="#93a1bb" />
                  <YAxis type="category" dataKey="feature" stroke="#93a1bb" width={140} />
                  <Tooltip contentStyle={{ background: "#121b2e", border: "1px solid #22304a" }} />
                  <Bar dataKey="value" fill="#35c186" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2>Dependence plot — {data.top_feature}</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                  <XAxis
                    type="number"
                    dataKey="value"
                    name={data.top_feature}
                    stroke="#93a1bb"
                  />
                  <YAxis type="number" dataKey="shap" name="SHAP value" stroke="#93a1bb" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ background: "#121b2e", border: "1px solid #22304a" }}
                  />
                  <Scatter
                    data={data.dependence.value.map((v, i) => ({ value: v, shap: data.dependence.shap[i] }))}
                    fill="#e5b95c"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="subtitle">
              This shows the relationship the model learned, not a controlled experiment — treat it
              as &quot;the model leans on this,&quot; not causation.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
