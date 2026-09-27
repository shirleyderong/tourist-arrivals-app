"use client";

import { useState } from "react";
import { api, type FeatureResponse } from "@/lib/api";
import Msg from "@/components/Msg";

export default function FeaturesPage() {
  const [data, setData] = useState<FeatureResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runFeatures());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>3. Feature selection</h1>
      <p className="subtitle">Spearman filter (|ρ| &gt; 0.10, α = 0.05), then iterative VIF (&lt; 5).</p>

      <button onClick={run} disabled={loading}>
        {loading ? "Running…" : "Run Spearman + VIF"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <h2>Spearman results</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>ρ</th>
                  <th>p-value</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.feature}>
                    <td>{r.feature}</td>
                    <td>{r.rho.toFixed(3)}</td>
                    <td>{r.p_value.toExponential(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>VIF removals</h2>
          {data.vif_log.length === 0 ? (
            <Msg kind="info">No features removed by VIF.</Msg>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dropped</th>
                    <th>VIF</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vif_log.map((v) => (
                    <tr key={v.dropped}>
                      <td>{v.dropped}</td>
                      <td>{v.vif.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Msg kind="success">Selected features: {data.selected_features.join(", ")}</Msg>
        </div>
      )}
    </div>
  );
}
