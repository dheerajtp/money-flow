export default function ConfigErrorPage() {
  return (
    <main className="auth">
      <h1>Connect to Supabase</h1>
      <div className="card stack">
        <p>The app cannot find your Supabase project settings.</p>
        <ol>
          <li>In <code>web/</code>, copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li>In the Supabase dashboard open Project Settings, then API.</li>
          <li>Paste the <strong>Project URL</strong> and the <strong>anon public key</strong> into <code>.env.local</code>.</li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
        <p className="muted">Never use the service-role key or the database password here.</p>
      </div>
    </main>
  )
}
