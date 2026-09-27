export default function HomePage() {
  return (
    <div>
      <h1>Philippine Tourist Arrivals - Forecasting Lab</h1>
      <div className="card">
        <p>
          Work through the pages in the sidebar, in order: Dataset → Clean → Features → Prepare →
          Train → Evaluate → Explain → Forecast.
        </p>
        <p>
          Each page calls its own FastAPI endpoint and depends on the one before it having been run
          at least once, the backend keeps pipeline state (cleaned data, selected features,
          scalers, trained model) in memory for the life of the `uvicorn` process, the same way the
          Streamlit app kept it in <code>st.session_state</code> for the life of one browser tab.
        </p>
      </div>
    </div>
  );
}
