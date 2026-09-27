export default function HomePage() {
  const itinerary = [
    { num: "01", title: "Dataset", desc: "Unpack the historical tourist arrivals and climate records." },
    { num: "02", title: "Clean", desc: "Filter out the noise, interpolate gaps, and prepare the raw data." },
    { num: "03", title: "Features", desc: "Use Spearman & VIF to pinpoint the exact climate drivers." },
    { num: "04", title: "Prepare", desc: "Chronologically split and window the data to prevent time-travel leakage." },
    { num: "05", title: "Train", desc: "Train a Long Short-Term Memory (LSTM) neural network." },
    { num: "06", title: "Evaluate", desc: "Test the AI against seasonal baselines to ensure genuine learning." },
    { num: "07", title: "Explain", desc: "Illuminate the black box with SHAP to see exactly why it predicts what it does." },
    { num: "08", title: "Forecast", desc: "Adjust current climate readings and predict next month's arrivals." },
  ];

  return (
    <div>
      <div className="hero">
        <h1>Philippine Tourist Arrivals</h1>
      </div>

      <div className="card">
        <p style={{ color: "var(--muted)" }}>
          Navigate through the sidebar stages in order. The FastAPI backend keeps your state 
          (cleaned data, scalers, and models) safely in memory for the duration of your journey.
        </p>
        
        <div className="itinerary-grid">
          {itinerary.map((step, idx) => (
            <div className="itinerary-step" key={idx}>
              <div className="step-number">{step.num}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}