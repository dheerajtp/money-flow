import { Link } from 'react-router-dom'

// The breadcrumb ("Home / Accounts") is the visible page title; the h1 is for screen readers.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-head">
      <div>
        <nav aria-label="Breadcrumb" className="crumbs crumbs-lg">
          <Link to="/">Home</Link>
          <span className="crumb-sep" aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1 className="sr-only">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {children && <div className="row-actions">{children}</div>}
    </header>
  )
}
