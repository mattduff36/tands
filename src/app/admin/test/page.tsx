export default function TestPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginBottom: '16px' }}>Test Page</h1>
        <p style={{ color: '#dc2626' }}>This is a simple test page to check if rendering works.</p>
      </div>
    </div>
  );
}