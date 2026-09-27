"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type TrainResponse } from "@/lib/api";
import Msg from "@/components/Msg";

export default function TrainPage() {
  const [data, setData] = useState<TrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.runTrain());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    data?.loss_history.map((loss, i) => ({
      epoch: i + 1,
      loss,
      val_loss: data.val_loss_history[i],
    })) ?? [];

  return (
    <div>
      <h1>5. Train and tune the LSTM</h1>
      <p className="subtitle">
        Small hyperparameter grid search over LSTM units, dropout, and batch size - scored only on a
        validation split carved out of training data, never on the test set.
      </p>

      <button onClick={run} disabled={loading}>
        {loading ? "Training… this can take a while" : "Train & tune"}
      </button>

      {error && <Msg kind="error">{error}</Msg>}

      {data && (
        <div className="card">
          <Msg kind="success">
            Best hyperparameters: units={data.best_params.units}, dropout=
            {data.best_params.dropout}, batch_size={data.best_params.batch_size} (val_loss ={" "}
            {data.val_loss.toFixed(4)})
          </Msg>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                <XAxis dataKey="epoch" stroke="#93a1bb" label={{ value: "Epoch", position: "insideBottom", offset: -4, fill: "#93a1bb" }} />
                <YAxis stroke="#93a1bb" />
                <Tooltip contentStyle={{ background: "#121b2e", border: "1px solid #22304a" }} />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#4f8cff" dot={false} name="train loss" />
                <Line type="monotone" dataKey="val_loss" stroke="#e5b95c" dot={false} name="val loss" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
