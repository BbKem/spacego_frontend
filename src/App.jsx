// frontend/src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react'
import TelegramInit from './components/TelegramInit'
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
    : 'https://spacego-backend.onrender.com'

  const [cache, setCache] = useState({
    ads: null,
    categories: null,
    subcategories: {},
    lastUpdated: null
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    if (cache.categories) return
    try {
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

  const fetchAds = async (filters = {}) => {
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
      const [adsData, categoriesData] = await Promise.all([
        fetchAds(filters),
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

  const getSubcategories = async (parentId) => {
    if (cache.subcategories[parentId]) {
      return cache.subcategories[parentId];
    }

    try {
      const subcats = await fetchSubcategories(parentId);
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
        refreshData,
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
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedAd, setSelectedAd] = useState(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const isInTelegram = window.Telegram && window.Telegram.WebApp;
    setIsTelegramApp(!!isInTelegram);
    
    // Пробуем получить сохранённого пользователя
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleTelegramAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_init_data');
    localStorage.removeItem('token'); // На всякий случай удаляем старый токен
    setUser(null);
    setCurrentPage('home');
    setSelectedAd(null);
    
    // Если в Telegram WebApp - закрываем или показываем сообщение
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  const viewAd = (ad) => {
    setSelectedAd(ad);
    setCurrentPage('ad-detail');
  };

  const handleAdCreated = (ad) => {
    console.log('Новое объявление создано:', ad);
    setCurrentPage('home');
  };

  // Если не в Telegram и нет пользователя - показываем информационную страницу
  if (!isTelegramApp && !user) {
    return (
      <div style={infoPageStyle}>
        <div style={logoStyle}>
          <img src={logo} alt="Spacego" style={logoImageStyle} />
        </div>
        <h1 style={infoTitleStyle}>SpaceGo</h1>
        <p style={infoTextStyle}>
          Это приложение работает только внутри Telegram.
          Откройте его через Telegram бота для использования.
        </p>
        <div style={qrCodeStyle}>
          <div style={qrPlaceholderStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#46A8C1' }}>
              qr_code
            </span>
            <p style={{ marginTop: 16 }}>Отсканируйте QR-код бота</p>
          </div>
        </div>
      </div>
    );
  }

  // Обёртка для Telegram инициализации
  const AppWrapper = ({ children }) => {
    if (isTelegramApp && !user) {
      return (
        <TelegramInit onAuthSuccess={handleTelegramAuthSuccess}>
          {children}
        </TelegramInit>
      );
    }
    return children;
  };

  return (
    <AppWrapper>
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
    </AppWrapper>
  );
}

// Стили для информационной страницы
const infoPageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  padding: '20px',
  backgroundColor: '#f6f6f8',
  textAlign: 'center'
};

const logoStyle = {
  width: 120,
  height: 120,
  marginBottom: 24
};

const logoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain'
};

const infoTitleStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: 16
};

const infoTextStyle = {
  fontSize: 16,
  color: '#4b5563',
  maxWidth: 400,
  marginBottom: 32,
  lineHeight: 1.5
};

const qrCodeStyle = {
  marginTop: 32
};

const qrPlaceholderStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 24,
  backgroundColor: 'white',
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

function App() {
  return (
    <AppCacheProvider>
      <AppContent />
    </AppCacheProvider>
  );
}

export default App;