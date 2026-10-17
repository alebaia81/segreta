import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '4rem auto',
          backgroundColor: 'var(--bg-secondary, #fff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #E6DFD7)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--text-primary, #2C2520)' }}>
            Oops! Qualcosa è andato storto.
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #5E534C)', marginBottom: '1.5rem' }}>
            Non siamo riusciti a caricare questa sezione. Riprova tra poco oppure torna alla home.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            style={{
              backgroundColor: '#E295AB',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Torna alla Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
