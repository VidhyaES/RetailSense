import { useState } from 'react'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('access_token')
  )

  const handleLogin  = () => setIsLoggedIn(true)
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
  }

  return isLoggedIn
    ? <Dashboard onLogout={handleLogout} />
    : <Login     onLogin={handleLogin}  />
}

export default App