// Community guidelines, privacy policy and terms: placeholders until Susan's documents
// (and a lawyer's review) exist. Sign-ups stay closed to the public until then.
const NAMES: Record<string, string> = {
  guidelines: 'Community guidelines',
  privacy: 'Privacy policy',
  terms: 'Terms of use',
}

export default function Legal({ doc, onBack }: { doc: string; onBack: () => void }) {
  return (
    <main className="screen">
      <p className="label">Draft</p>
      <h1 className="screen-title">{NAMES[doc] ?? 'Document'}</h1>
      <p>This document is being written. The Sanctuary opens to everyone once it’s ready.</p>
      <p>What we already promise: heritage starts as Only me, every part of your profile has its own setting, you can delete your account at any time, and your heritage never feeds ads, analytics or anyone else’s feed.</p>
      <button className="btn btn-plain" onClick={onBack}>Back</button>
    </main>
  )
}
