import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { RANGE_OPTIONS } from '../lib/ranges.js'

export default function RangeSelector({ rangeKey, onKeyChange, custom, onCustomChange, error }) {
  return (
    <div className="row" role="group" aria-label="Time range">
      <SelectField label="Time range" value={rangeKey} onChange={(e) => onKeyChange(e.target.value)}>
        {RANGE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </SelectField>
      {rangeKey === 'custom' && (
        <>
          <TextField label="From" type="date" value={custom.from} onChange={(e) => onCustomChange({ ...custom, from: e.target.value })} />
          <TextField label="To" type="date" value={custom.to} onChange={(e) => onCustomChange({ ...custom, to: e.target.value })} error={error} />
        </>
      )}
    </div>
  )
}
