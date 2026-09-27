"use client";

import { useState } from "react";
import { api, type DatasetResponse } from "@/lib/api";
import Msg from "@/components/Msg";

export default function DatasetPage() {
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.loadDataset());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>1. Dataset summary</h1>
      <p className="subtitle">Load the CSV, confirm its schema, and check for gaps in the monthly sequence.</p>

      <button onClick={run} disabled={loading}>
        {loading ? "Loading…" : "Load dataset"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <p>
            <strong>{data.rows}</strong> rows, <strong>{data.cols}</strong> columns (
            {data.date_min} – {data.date_max})
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(data.head[0]).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.head.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.missing_months.length ? (
            <Msg kind="warning">Missing months: {data.missing_months.join(", ")}</Msg>
          ) : (
            <Msg kind="success">No gaps in the monthly sequence.</Msg>
          )}
        </div>
      )}
    </div>
  );
}
