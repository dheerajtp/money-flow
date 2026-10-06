import SuggestionCard from './SuggestionCard.jsx'

export default function SuggestionList({ suggestions, onAccept, onChanged }) {
  return (
    <ul className="list">
      {suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} onAccept={onAccept} onChanged={onChanged} />)}
    </ul>
  )
}
