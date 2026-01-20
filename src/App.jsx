// frontend/src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react'
import TelegramInit from './components/TelegramInit'
import Home from './components/Home'
import AdDetail from './components/AdDetail'
import CreateAd from './components/CreateAd'
import Favorites from './components/Favorites'
import Profile from './components/Profile'
import BottomNav from './components/BottomNav'

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
  const [safeAreaTop, setSafeAreaTop] = useState(0);

  // ========== ДОБАВЛЕНО: ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP ==========
  useEffect(() => {
    // Инициализация Telegram Web App для скрытия стандартного UI
    const initTelegramWebApp = () => {
      // Проверяем, что мы внутри Telegram Web App
      if (window.Telegram && window.Telegram.WebApp) {
        console.log('Telegram Web App detected, initializing...');
        
        const tg = window.Telegram.WebApp;
        
        // 1. Готовим приложение
        tg.ready();
        
        // 2. Расширяем на весь экран - убирает верхнюю панель с серыми кнопками
        // Но оставляем safe area для iOS
        tg.expand();
        
        // 3. Скрываем стандартную кнопку (MainButton)
        tg.MainButton.hide();
        
        // 4. Получаем безопасную зону для iOS (для Dynamic Island)
        const platform = tg.platform || '';
        const isIOS = platform.includes('ios') || /iPhone|iPad|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          // Для iOS добавляем отступ для Dynamic Island
          const safeArea = tg.viewportStableHeight || tg.viewportHeight;
          const additionalPadding = 24; // Дополнительный отступ для Dynamic Island
          setSafeAreaTop(additionalPadding);
          console.log('iOS detected, adding safe area top:', additionalPadding);
        }
        
        // 5. Настраиваем цвета под ваш дизайн
        tg.setHeaderColor('#f6f6f8'); // Используем цвет фона вашего приложения
        tg.setBackgroundColor('#f6f6f8');
        
        // 6. Отключаем некоторые стандартные жесты
        tg.disableVerticalSwipes();
        
        // 7. Сохраняем initData для авторизации
        if (tg.initData) {
          localStorage.setItem('telegram_init_data', tg.initData);
          console.log('Telegram initData saved');
        }
        
        // 8. Логируем параметры для отладки
        console.log('Telegram WebApp initialized successfully', {
          platform: tg.platform,
          version: tg.version,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          isExpanded: tg.isExpanded
        });
        
        // 9. Настройка Back Button (опционально)
        tg.BackButton.show();
        tg.onEvent('backButtonClicked', () => {
          console.log('Back button clicked in Telegram');
          // Можно добавить навигацию назад в вашем приложении
          if (currentPage !== 'home') {
            setCurrentPage('home');
          } else {
            tg.close();
          }
        });
        
        return true;
      }
      return false;
    };

    // Пробуем инициализировать сразу
    let isInitialized = initTelegramWebApp();
    
    // Если Telegram еще не загружен, ждем события
    if (!isInitialized) {
      const handleTelegramReady = () => {
        initTelegramWebApp();
      };
      
      window.addEventListener('telegramReady', handleTelegramReady);
      
      // Также пробуем через таймаут
      const timeoutId = setTimeout(() => {
        initTelegramWebApp();
      }, 1000);
      
      return () => {
        window.removeEventListener('telegramReady', handleTelegramReady);
        clearTimeout(timeoutId);
      };
    }
  }, [currentPage]);
  // ========== КОНЕЦ ДОБАВЛЕНИЯ ==========

  useEffect(() => {
    // Пробуем получить сохранённого пользователя
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  const handleTelegramAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_init_data');
    setUser(null);
    setCurrentPage('home');
    setSelectedAd(null);
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
        <div style={{
          ...loadingStyle,
          paddingTop: `${safeAreaTop}px`
        }}>
          <div style={spinnerStyle}></div>
          <p>Инициализация...</p>
        </div>
      </TelegramInit>
    );
  }

  // Определяем, нужно ли показывать нижнюю навигацию
  const showBottomNav = currentPage !== 'ad-detail';

  // Создаем стиль с безопасными отступами
  const safeAreaStyle = {
    minHeight: '100vh', 
    backgroundColor: '#f6f6f8', 
    fontFamily: "'Space Grotesk', sans-serif",
    paddingBottom: showBottomNav ? '80px' : '0',
    paddingTop: `${safeAreaTop}px`
  };

  // Если есть пользователь - показываем приложение
  return (
    <div style={safeAreaStyle}>
      {currentPage === 'home' && (
        <Home 
          user={user} 
          onLogout={handleLogout} 
          onViewAd={viewAd}
          onCreateAd={() => setCurrentPage('create-ad')}
          setCurrentPage={setCurrentPage}
          safeAreaTop={safeAreaTop}
        />
      )}
      {currentPage === 'ad-detail' && (
        <AdDetail 
          ad={selectedAd} 
          onBack={() => setCurrentPage('home')} 
          safeAreaTop={safeAreaTop}
        />
      )}
      {currentPage === 'create-ad' && (
        <CreateAd 
          onBack={() => setCurrentPage('home')} 
          onAdCreated={handleAdCreated}
          safeAreaTop={safeAreaTop}
        />
      )}
      {currentPage === 'favorites' && (
        <Favorites 
          onViewAd={viewAd} 
          onBack={() => setCurrentPage('home')}
          safeAreaTop={safeAreaTop}
        />
      )}
      {currentPage === 'profile' && (
        <Profile 
          user={user}
          onBack={() => setCurrentPage('home')}
          onViewAd={viewAd}
          onLogout={handleLogout}
          safeAreaTop={safeAreaTop}
        />
      )}
      
      {/* Общая нижняя навигация для всех страниц кроме деталей объявления */}
      {showBottomNav && (
        <BottomNav 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          safeAreaTop={safeAreaTop}
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