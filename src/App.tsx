import { Route, Routes } from 'react-router-dom'
import { AdminHostGate } from './components/AdminHostGate'
import { canAccessAdmin, getAdminRoutePath } from './lib/adminAccess'
import { AdminPage } from './pages/AdminPage'
import { ArticlePage } from './pages/ArticlePage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  const adminAllowed = canAccessAdmin(window.location.hostname)
  const adminPath = getAdminRoutePath()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:id" element={<ArticlePage />} />
      <Route
        path={adminPath}
        element={adminAllowed ? <AdminPage /> : <AdminHostGate />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
