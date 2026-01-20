// frontend/src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react'
import TelegramInit from './components/TelegramInit'
import Home from './components/Home'
import AdDetail from './components/AdDetail'
import CreateAd from './components/CreateAd'
import Favorites from './components/Favorites'
import Profile from './components/Profile'

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

  useEffect(() => {
    // Пробуем получить сохранённого пользователя
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Больше не проверяем isTelegramApp - TelegramInit сам разберётся
  }, []);

  const handleTelegramAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_init_data');
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('home');
    setSelectedAd(null);
    
    // Если в Telegram WebApp - закрываем
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

  // Если нет пользователя - показываем TelegramInit
  if (!user) {
    return (
      <TelegramInit onAuthSuccess={handleTelegramAuthSuccess}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <p>Инициализация...</p>
        </div>
      </TelegramInit>
    );
  }

  // Если есть пользователь - показываем приложение
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8', fontFamily: "'Space Grotesk', sans-serif" }}>
      {currentPage === 'home' && (
        <Home 
          user={user} 
          onLogout={handleLogout} 
          onViewAd={viewAd}
          onCreateAd={() => setCurrentPage('create-ad')}
          setCurrentPage={setCurrentPage}
        />
      )}
      {currentPage === 'ad-detail' && <AdDetail ad={selectedAd} onBack={() => setCurrentPage('home')} />}
      {currentPage === 'create-ad' && (
        <CreateAd 
          onBack={() => setCurrentPage('home')} 
          onAdCreated={handleAdCreated}
        />
      )}
      {currentPage === 'favorites' && (
        <Favorites 
          onViewAd={viewAd} 
          onBack={() => setCurrentPage('home')}
        />
      )}
      {currentPage === 'profile' && (
        <Profile 
          user={user}
          onBack={() => setCurrentPage('home')}
          onViewAd={viewAd}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f6f6f8'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

// Добавляем стили для анимации
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

function App() {
  return (
    <AppCacheProvider>
      <AppContent />
    </AppCacheProvider>
  );
}

export default App;