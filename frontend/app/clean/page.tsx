"use client";

import { useState } from "react";
import { api, type CleanResponse } from "@/lib/api";
import Msg from "@/components/Msg";

export default function CleanPage() {
  const [data, setData] = useState<CleanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runClean());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>2. Clean the data</h1>
      <p className="subtitle">Duplicates, one-hot encoding, missing-value interpolation, and an IQR outlier check.</p>

      <button onClick={run} disabled={loading}>
        {loading ? "Cleaning…" : "Run cleaning"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <p>Duplicates removed: <strong>{data.duplicates_removed}</strong></p>

          <h2>Missing values by column</h2>
          {Object.keys(data.missing).length === 0 ? (
            <Msg kind="success">No missing values found.</Msg>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Missing count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.missing).map(([col, count]) => (
                    <tr key={col}>
                      <td>{col}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2>Flagged outliers (arrivals, IQR rule)</h2>
          {data.flagged.length === 0 ? (
            <Msg kind="info">No outliers flagged.</Msg>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Arrivals</th>
                  </tr>
                </thead>
                <tbody>
                  {data.flagged.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.arrivals.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
