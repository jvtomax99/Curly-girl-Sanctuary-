// "Join the Sanctuary" before accounts exist (Phase 2): an honest coming-soon page.
export default function Soon({ onBack, onTips }: { onBack: () => void; onTips: () => void }) {
  return (
    <main className="soon">
      <p className="label">Coming soon</p>
      <h1>
        The Sanctuary
        <br />
        opens <span className="script">soon</span>
      </h1>
      <p>Soon you can join to save your Curly ID, share your Curl Kit, post your best and worst hair days, and learn from curly people everywhere.</p>
      <p>For now, your card is saved on this phone.</p>
      <button className="btn btn-plain" onClick={onBack}>Back to my card</button>
      <button className="btn-link" onClick={onTips}>See tips for my hair</button>
    </main>
  )
}
