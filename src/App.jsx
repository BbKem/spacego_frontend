import { useState, useEffect, createContext, useContext } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'
import AdDetail from './components/AdDetail'
import CreateAd from './components/CreateAd'
import logo from './assets/logo.png'

// Создаем контекст для кэширования
const AppCacheContext = createContext()

export const useAppCache = () => {
  const context = useContext(AppCacheContext)
  if (!context) {
    throw new Error('useAppCache must be used within AppCacheProvider')
  }
  return context
}

const AppCacheProvider = ({ children }) => {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const [cache, setCache] = useState({
    ads: null,
    categories: null,
    lastUpdated: null
  })

  // Загружаем данные при первом рендере
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    if (cache.ads && cache.categories) return // Данные уже загружены

    try {
      const [adsData, categoriesData] = await Promise.all([
        fetchAds(),
        fetchCategories()
      ])

      setCache({
        ads: adsData,
        categories: categoriesData,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  const fetchAds = async () => {
    const res = await fetch(`${API_BASE}/api/ads`)
    const data = await res.json()
    
    return data.map(ad => {
      if (ad.photo_url && ad.photo_url.startsWith('[')) {
        try {
          ad.photo_urls = JSON.parse(ad.photo_url)
        } catch (e) {
          ad.photo_urls = []
        }
      } else if (ad.photo_url) {
        ad.photo_urls = [ad.photo_url]
      } else {
        ad.photo_urls = []
      }
      return ad
    })
  }

  const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/api/categories`)
    return await res.json()
  }

  const refreshData = async () => {
    try {
      const [adsData, categoriesData] = await Promise.all([
        fetchAds(),
        fetchCategories()
      ])

      setCache({
        ads: adsData,
        categories: categoriesData,
        lastUpdated: Date.now()
      })
      
      return { ads: adsData, categories: categoriesData }
    } catch (error) {
      console.error('Ошибка обновления данных:', error)
      throw error
    }
  }

  const addNewAd = (newAd) => {
    if (cache.ads) {
      setCache(prev => ({
        ...prev,
        ads: [newAd, ...prev.ads]
      }))
    }
  }

  const value = {
    ads: cache.ads,
    categories: cache.categories,
    lastUpdated: cache.lastUpdated,
    refreshData,
    addNewAd,
    isLoading: !cache.ads || !cache.categories
  }

  return (
    <AppCacheContext.Provider value={value}>
      {children}
    </AppCacheContext.Provider>
  )
}

function AppContent() {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedAd, setSelectedAd] = useState(null)

  const { refreshData, addNewAd } = useAppCache()

  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) {
      setToken(saved)
      setIsLoggedIn(true)
      fetchUser()
    }
  }, [token])

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
    console.log('Новое объявление создано:', ad)
    // Добавляем новое объявление в кэш
    addNewAd(ad)
    setCurrentPage('home')
  }

  // Обработчики для навигации между экранами аутентификации
  const goToLogin = () => setCurrentPage('login')
  const goToRegister = () => setCurrentPage('register')
  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    setCurrentPage('home')
    // Получаем токен из localStorage и обновляем состояние
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={pageStyle}>
        {currentPage === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={goToRegister}
          />
        )}
        {currentPage === 'register' && (
          <Register 
            onRegisterSuccess={goToLogin}
            onGoToLogin={goToLogin}
          />
        )}
        {currentPage === 'home' && (
          <div style={authLandingStyle}>
            {/* Логотип */}
            <div style={logoStyle}>
              <img src={logo} alt="Spacego" style={logoImageStyle} />
            </div>
            <p style={authSubtitleStyle}>Войдите в свой аккаунт Spacego</p>
            <div style={authButtonsStyle}>
              <button onClick={goToLogin} style={primaryButtonStyle}>Войти</button>
              <p style={switchText}>Нет аккаунта? <button onClick={goToRegister} style={linkStyle}>Зарегистрироваться</button></p>
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

function App() {
  return (
    <AppCacheProvider>
      <AppContent />
    </AppCacheProvider>
  )
}

// Обновленные стили с новой цветовой палитрой
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
  width: 120,
  height: 120,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 32
}

const logoImageStyle = {
  width: 500,
  height: 500,
  objectFit: 'contain'
}

const authSubtitleStyle = {
  fontSize: 16,
  textAlign: 'center',
  color: '#46A8C1',
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
  backgroundColor: '#46A8C1',
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
  color: '#46A8C1',
  fontWeight: 'bold',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline'
}

export default App