import { formatINR } from '../lib/money.js'

// Text version of a chart: the same numbers in a table.
export default function ChartTable({ caption, columns, rows }) {
  return (
    <details>
      <summary>View as a table</summary>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key} scope="col" className={c.money ? 'num' : undefined}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className={c.money ? 'num' : undefined}>{c.money ? formatINR(r[c.key]) : r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
