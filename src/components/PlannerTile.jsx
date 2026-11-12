import { Link } from 'react-router-dom'
import usePlanner from '../hooks/usePlanner.js'
import { formatDate } from '../lib/dates.js'
import Card from './Card.jsx'
import MoneyText from './MoneyText.jsx'

// Small dashboard tile that links to the Planner. Quietly shows nothing if the Planner cannot load.
export default function PlannerTile() {
  const { loading, error, planner } = usePlanner()
  if (loading || error) return null
  return (
    <Card title="Safe to spend" actions={<Link to="/planner">Open Planner</Link>}>
      {planner ? (
        <>
          <p className="kpi-value"><MoneyText value={planner.display.safe} whole /></p>
          <p className="muted">until {formatDate(planner.period.end)} · <MoneyText value={planner.display.perDay} whole /> a day</p>
        </>
      ) : (
        <p className="muted">Set up the Planner to see what you can safely spend until your next salary. <Link to="/planner">Set up</Link></p>
      )}
    </Card>
  )
}
