import Icon from './Icon.jsx'
import Illustration from './Illustration.jsx'

// art: the name of an illustration; compact: a smaller picture for tight spaces.
export default function EmptyState({ title, icon = 'sparkle', art, compact = false, children }) {
  return (
    <div className="empty" role="status">
      {art ? (
        <Illustration name={art} className={compact ? 'empty-art empty-art-compact' : 'empty-art'} />
      ) : (
        <span className="avatar"><Icon name={icon} size={24} /></span>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  )
}
