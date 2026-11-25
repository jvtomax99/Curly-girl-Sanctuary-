import type { CardRow } from '../engine/card'

export default function IdCard({ rows }: { rows: CardRow[] }) {
  return (
    <section className="idcard" aria-label="Your Curly ID Card">
      <div className="idcard-mark" aria-hidden="true">
        <span>Curly</span>
        <span>ID</span>
        <span>Card</span>
      </div>
      <dl className="idcard-rows">
        {rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
