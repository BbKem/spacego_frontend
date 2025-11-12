import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'
import AdDetail from './components/AdDetail'
import CreateAd from './components/CreateAd' // Добавьте этот импорт

function App() {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('home') // home, login, register, ad-detail, create-ad
  const [selectedAd, setSelectedAd] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) {
      setToken(saved)
      setIsLoggedIn(true)
      fetchUser()
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setUser(data.user)
    } catch (err) {
      console.error('Ошибка загрузки профиля')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken('')
    setIsLoggedIn(false)
    setUser(null)
    setCurrentPage('home')
    setSelectedAd(null)
  }

  const viewAd = (ad) => {
    setSelectedAd(ad)
    setCurrentPage('ad-detail')
  }

  const handleAdCreated = (ad) => {
    // Можно обновить список объявлений или показать уведомление
    console.log('Новое объявление создано:', ad)
  }

  if (!isLoggedIn) {
    return (
      <div style={pageStyle}>
        {currentPage === 'login' && <Login onLoginSuccess={() => { setIsLoggedIn(true); setCurrentPage('home'); }} />}
        {currentPage === 'register' && <Register onRegisterSuccess={() => { setCurrentPage('login'); }} />}
        {currentPage === 'home' && (
          <div style={authLandingStyle}>
            <div style={logoStyle}>
              <svg style={logoSvgStyle} fill="none" viewBox="0 0 24 24">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" />
                <path d="M2 7L12 12" stroke="white" strokeWidth="2" />
                <path d="M12 22V12" stroke="white" strokeWidth="2" />
                <path d="M22 7L12 12" stroke="white" strokeWidth="2" />
                <path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h1 style={authTitleStyle}>С возвращением!</h1>
            <p style={authSubtitleStyle}>Войдите в свой аккаунт Spacego</p>
            <div style={authButtonsStyle}>
              <button onClick={() => setCurrentPage('login')} style={primaryButtonStyle}>Войти</button>
              <p style={switchText}>Нет аккаунта? <button onClick={() => setCurrentPage('register')} style={linkStyle}>Зарегистрироваться</button></p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8', fontFamily: "'Space Grotesk', sans-serif" }}>
      {currentPage === 'home' && (
        <Home 
          user={user} 
          onLogout={handleLogout} 
          onViewAd={viewAd}
          onCreateAd={() => setCurrentPage('create-ad')}
        />
      )}
      {currentPage === 'ad-detail' && <AdDetail ad={selectedAd} onBack={() => setCurrentPage('home')} />}
      {currentPage === 'create-ad' && (
        <CreateAd 
          onBack={() => setCurrentPage('home')} 
          onAdCreated={handleAdCreated}
        />
      )}
    </div>
  )
}

// Стили (максимально близко к твоим HTML-примерам)
const pageStyle = {
  display: 'flex',
  height: '100vh',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f6f6f8'
}

const authLandingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '400px',
  width: '100%',
  padding: '0 20px'
}

const logoStyle = {
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: '#135bec',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 32
}

const logoSvgStyle = {
  width: 32,
  height: 32,
  color: 'white'
}

const authTitleStyle = {
  fontSize: 32,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 8,
  color: '#0d121b'
}

const authSubtitleStyle = {
  fontSize: 16,
  textAlign: 'center',
  color: '#4c669a',
  marginBottom: 32
}

const authButtonsStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 32
}

const primaryButtonStyle = {
  height: 56,
  width: '100%',
  borderRadius: 12,
  backgroundColor: '#135bec',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer'
}

const switchText = {
  fontSize: 14,
  color: '#4c669a',
  textAlign: 'center'
}

const linkStyle = {
  color: '#135bec',
  fontWeight: 'bold',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline'
}

export default App