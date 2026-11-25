// A Curl Kit to read: products, tools and how I dry. Used on a shared kit link and on
// the owner's profile. Product names only: no buy links (CLAUDE.md, v1 has no Shop).
import { dryLabel, kindLabel, kitIsEmpty, toolLabel, type Kit } from '../engine/kit'

interface Props {
  kit: Kit
  /** The owner sees their own products that wait for a moderator, marked as such. */
  owner?: boolean
  /** Heading level inside the page. */
  level?: 2 | 3
  empty?: string
}

export default function KitList({ kit, owner = false, level = 2, empty = 'Nothing in this Curl Kit yet.' }: Props) {
  const H = `h${level}` as 'h2' | 'h3'
  const products = owner ? kit.products : kit.products.filter((p) => !p.pending)
  if (kitIsEmpty({ ...kit, products })) return <p className="note">{empty}</p>
  return (
    <div className="kit">
      {products.length > 0 && (
        <>
          <H className="kit-h">Go-to products</H>
          <ul className="kit-list">
            {products.map((p) => (
              <li key={p.id} className="kit-product">
                <span className="kit-name">{p.name}</span>
                <span className="kit-meta">{p.brand} · {kindLabel(p.kind)}</span>
                {p.pending && <span className="kit-pending">Only you see this until a moderator checks it</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {kit.tools.length > 0 && (
        <>
          <H className="kit-h">Tools</H>
          <ul className="kit-tags">
            {kit.tools.map((t) => <li key={t}>{toolLabel(t)}</li>)}
          </ul>
        </>
      )}
      {kit.dry && (
        <>
          <H className="kit-h">How I dry</H>
          <p className="p-value">{dryLabel(kit.dry)}</p>
        </>
      )}
    </div>
  )
}
