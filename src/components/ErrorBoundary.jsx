import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL UNCAUGHT ERROR IN REACT TREE:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#FFF5F5', minHeight: '100vh', color: '#9B1C1C' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            ⚠️ Ocorreu um erro inesperado na aplicação
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '14px' }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', border: '1px solid #FED7D7' }}>
            {this.state.error?.stack}
            {'\n\nComponent Stack:\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#002B49', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Recarregar Página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
