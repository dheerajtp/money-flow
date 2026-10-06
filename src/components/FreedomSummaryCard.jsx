import Card from './Card.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { describeMonths } from './ProfileForm.jsx'
import { formatMonth } from '../lib/dates.js'

export default function FreedomSummaryCard({ projection: p, settings, retirementAge, investedNow, monthlyInvesting, partial }) {
  return (
    <Card title={`Freedom by age ${retirementAge}`}>
      <div className="stack">
        <p>
          {p.alreadyReached ? 'You have reached that age.' : `Time left: ${describeMonths(p.months)}.`}
        </p>
        <div className="grid grid-3">
          <div><div className="muted">Freedom number</div><div className="stat"><MoneyText value={p.target} /></div></div>
          <div><div className="muted">Projected savings by then</div><div className="stat"><MoneyText value={p.projected} /></div></div>
          <div><div className="muted">{p.onTrack ? 'Ahead by' : 'Short by'}</div><div className="stat"><MoneyText value={Math.abs(p.gap)} /></div></div>
        </div>
        {p.onTrack ? (
          <Notice kind="success">On track: your projected savings reach the freedom number by age {retirementAge}.</Notice>
        ) : (
          <Notice kind="warning">
            Not on track yet.{' '}
            {p.extraMonthly === null
              ? 'The retirement date has already passed.'
              : <>Investing about <MoneyText value={p.extraMonthly} /> more each month would close the gap.</>}
          </Notice>
        )}
        <p>
          {p.freedomAge
            ? <>Earliest age you could stop working at this pace: <strong>{p.freedomAge.years} years {p.freedomAge.months} months</strong> ({formatMonth(p.freedomAge.date)}).</>
            : 'At this pace the freedom number is not reached by age 80.'}
        </p>
        <p className="muted">
          Counts your SIP and stock values ({investedNow.toLocaleString('en-IN')} now) and {monthlyInvesting.toLocaleString('en-IN', { maximumFractionDigits: 0 })} a month of SIP investing.
          Bank balances and the emergency fund are not counted.
          {partial ? ' Spending is based on this month so far.' : ''}
        </p>
        <p className="muted">
          Assumptions: freedom number = yearly spending × {settings.multiplier}, return {(settings.annualReturn * 100).toFixed(1)}% a year,
          inflation {(settings.inflation * 100).toFixed(1)}% a year. This is an estimate based on these assumptions. It is not a promise and not financial advice.
        </p>
      </div>
    </Card>
  )
}
