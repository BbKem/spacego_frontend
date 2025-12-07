// frontend/src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'
import AdDetail from './components/AdDetail'
import CreateAd from './components/CreateAd'
import logo from './assets/logo.png'

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
    : 'https://spacego-backend.onrender.com' // Убраны лишние пробелы

  const [cache, setCache] = useState({
    ads: null,
    categories: null, // Корневые категории
    subcategories: {}, // Подкатегории, кэшируем по parentId
    lastUpdated: null
  })

  // Загружаем только корневые категории при первом рендере
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    if (cache.categories) return // Данные уже загружены
    try {
      // При начальной загрузке вызываем без фильтров
      const adsData = await fetchAds({});
      const categoriesData = await fetchRootCategories()
      setCache({
        ads: adsData,
        categories: categoriesData,
        subcategories: cache.subcategories,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  // Обновляем fetchAds, чтобы он фильтровал undefined/пустые параметры
  const fetchAds = async (filters = {}) => {
    // Фильтруем параметры: удаляем undefined, null, пустые строки и false
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        cleanFilters[key] = value;
      }
    });

    const queryParams = new URLSearchParams(cleanFilters).toString();
    const url = `${API_BASE}/api/ads${queryParams ? '?' + queryParams : ''}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.map(ad => {
      if (!ad.photo_urls) {
        ad.photo_urls = [];
      }
      if (ad.property_details) {
        try {
          if (typeof ad.property_details === 'string') {
            ad.property_details = JSON.parse(ad.property_details);
          }
        } catch (e) {
          console.error("Ошибка парсинга property_details:", e);
          ad.property_details = {};
        }
      } else {
        ad.property_details = {};
      }
      return ad;
    });
  }
   
  const fetchRootCategories = async () => {
    const res = await fetch(`${API_BASE}/api/categories`) 
    return await res.json()
  }

  const fetchSubcategories = async (parentId) => {
    const res = await fetch(`${API_BASE}/api/categories/${parentId}`)
    return await res.json()
  }

  const refreshData = async (filters = {}) => { 
    try {
      // Используем обновлённый fetchAds
      const [adsData, categoriesData] = await Promise.all([
        fetchAds(filters), // Передаём фильтры
        fetchRootCategories()
      ])

      setCache({
        ads: adsData,
        categories: categoriesData,
        subcategories: {}, 
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

  // Добавляем функцию для получения подкатегорий с кэшированием
  const getSubcategories = async (parentId) => {
    // Проверяем кэш
    if (cache.subcategories[parentId]) {
      return cache.subcategories[parentId];
    }

    try {
      const subcats = await fetchSubcategories(parentId);
      // Обновляем кэш
      setCache(prev => ({
        ...prev,
        subcategories: {
          ...prev.subcategories,
          [parentId]: subcats
        }
      }));
      return subcats;
    } catch (error) {
      console.error(`Ошибка загрузки подкатегорий для parentId ${parentId}:`, error);
      return [];
    }
  };

  return (
    <AppCacheContext.Provider
      value={{
        ...cache,
        refreshData, // Теперь refreshData принимает фильтры
        addNewAd,
        fetchRootCategories,
        getSubcategories
      }}
    >
      {children}
    </AppCacheContext.Provider>
  )
}

function AppContent() {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com' // Убраны лишние пробелы

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