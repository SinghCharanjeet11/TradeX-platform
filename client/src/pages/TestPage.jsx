function TestPage() {
  return (
    <div style={{ padding: '50px', background: '#1a1d29', color: 'white', minHeight: '100vh' }}>
      <h1>✅ React is Working!</h1>
      <p>If you can see this, the app is rendering correctly.</p>
      <p>Server Status: Both servers are running</p>
      <a href="/dashboard" style={{ color: '#00d4aa' }}>Go to Dashboard</a>
    </div>
  )
}

export default TestPage
