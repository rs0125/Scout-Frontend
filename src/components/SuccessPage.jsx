function SuccessPage({ warehouseId, onStartOver }) {
  return (
    <div className="success-page">
      <div className="success-page__card">
        <div className="success-page__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="success-page__title">Warehouse submitted</h2>
        <p className="success-page__subtitle">The warehouse has been created successfully.</p>

        <div className="success-page__id-block">
          <span className="success-page__id-label">Warehouse ID</span>
          <span className="success-page__id-value">{warehouseId ?? '—'}</span>
        </div>

        <button
          type="button"
          className="form-btn form-btn--primary success-page__cta"
          onClick={onStartOver}
        >
          Submit another warehouse
        </button>
      </div>
    </div>
  );
}

export default SuccessPage;
