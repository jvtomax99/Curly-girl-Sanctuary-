// "Who sees this": Only me, Community or Everyone, right next to the item it controls.
import { VISIBILITIES, type Visibility } from '../engine/profile'

interface Props {
  name: string
  value: Visibility
  onChange: (v: Visibility) => void
  busy?: boolean
}

export default function Audience({ name, value, onChange, busy }: Props) {
  return (
    <fieldset className="audience" disabled={busy}>
      <legend>Who sees your {name}?</legend>
      <div className="audience-opts">
        {VISIBILITIES.map((v) => (
          <label key={v.value} className="audience-opt">
            <input type="radio" name={`aud-${name}`} value={v.value} checked={value === v.value} onChange={() => onChange(v.value)} />
            <span>{v.label}</span>
          </label>
        ))}
      </div>
      <p className="audience-note">{VISIBILITIES.find((v) => v.value === value)?.note}</p>
    </fieldset>
  )
}
