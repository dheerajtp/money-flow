import { Link } from 'react-router-dom'
import Illustration from '../components/Illustration.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <p>That page does not exist. <Link to="/">Go home</Link>.</p>
      <Illustration name="calm" className="empty-art" />
    </>
  )
}
