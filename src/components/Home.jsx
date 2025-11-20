import { useState, useEffect } from 'react'
import AdCard from './AdCard'

function Home({ user, onLogout, onViewAd, onCreateAd  }) {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const [categories, setCategories] = useState([])
  const [ads, setAds] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredAds, setFilteredAds] = useState([])

  useEffect(() => {
    loadCategories()
    loadAds()
  }, [])

  useEffect(() => {
    // Фильтрация по имени категории
    if (selectedCategory) {
      const filtered = ads.filter(ad => ad.category_name === selectedCategory.name)
      setFilteredAds(filtered)
    } else {
      setFilteredAds(ads)
    }
  }, [selectedCategory, ads])

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Ошибка загрузки категорий')
    }
  }

 // В компоненте Home, в функции loadAds добавьте обработку photo_urls:
const loadAds = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/ads`)
    const data = await res.json()
    
    // Обрабатываем объявления с несколькими фото
    const processedAds = data.map(ad => {
      // Если photo_url содержит JSON-массив, парсим его
      if (ad.photo_url && ad.photo_url.startsWith('[')) {
        try {
          ad.photo_urls = JSON.parse(ad.photo_url);
        } catch (e) {
          ad.photo_urls = [];
        }
      } else if (ad.photo_url) {
        // Для обратной совместимости со старыми объявлениями
        ad.photo_urls = [ad.photo_url];
      } else {
        ad.photo_urls = [];
      }
      return ad;
    });
    
    setAds(processedAds);
  } catch (err) {
    console.error('Ошибка загрузки объявлений')
  }
}

  const handleCategoryClick = (category) => {
    if (selectedCategory && selectedCategory.id === category.id) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
    }
  }

  const clearFilter = () => {
    setSelectedCategory(null)
  }

  return (
    <div style={{ backgroundColor: '#f6f6f8', minHeight: '100vh' }}>
      {/* TopAppBar */}
      <div style={topAppBarStyle}>
        <div style={{ width: 48 }}></div>
        <h2 style={appTitleStyle}>Spacego</h2>
        <button style={notificationButtonStyle}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {/* SearchBar */}
      <div style={searchContainerStyle}>
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle} className="material-symbols-outlined">search</span>
          <input
            placeholder="Search for products"
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Chips */}
      <div style={chipsContainerStyle}>
        <div 
          key="all"
          style={selectedCategory === null ? chipActiveStyle : chipStyle}
          onClick={clearFilter}
        >
          Все
        </div>
        
        {categories.map(cat => (
          <div 
            key={cat.id} 
            style={selectedCategory && selectedCategory.id === cat.id ? chipActiveStyle : chipStyle}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat.name}
          </div>
        ))}
      </div>

      {/* Индикатор выбранной категории */}
      {selectedCategory && (
        <div style={filterIndicatorStyle}>
          <span>Показаны объявления в категории: <strong>{selectedCategory.name}</strong></span>
          <button style={clearFilterStyle} onClick={clearFilter}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Grid */}
      <div style={gridStyle}>
        {filteredAds.length > 0 ? (
          filteredAds.map(ad => (
            <AdCard key={ad.id} ad={ad} onClick={() => onViewAd(ad)} />
          ))
        ) : (
          <div style={noResultsStyle}>
            {selectedCategory ? (
              <p>Нет объявлений в категории "{selectedCategory.name}"</p>
            ) : ads.length === 0 ? (
              <p>Нет объявлений</p>
            ) : (
              <p>Загрузка...</p>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button style={fabStyle} onClick={onCreateAd}>
        <span className="material-symbols-outlined">add</span>
      </button>

      {/* BottomNav */}
      <div style={bottomNavStyle}>
        <div style={navItemActiveStyle}>
          <span className="material-symbols-outlined">home</span>
          <span style={navLabelStyle}>Home</span>
        </div>
        <div style={navItemStyle}>
          <span className="material-symbols-outlined">favorite</span>
          <span style={navLabelStyle}>Favorites</span>
        </div>
        <div style={navItemStyle} onClick={onCreateAd}>
          <span className="material-symbols-outlined">add</span>
          <span style={navLabelStyle}>Sell</span>
        </div>
        <div style={navItemStyle}>
          <span className="material-symbols-outlined">chat_bubble</span>
          <span style={navLabelStyle}>Messages</span>
        </div>
        <div style={navItemStyle} onClick={onLogout}>
          <span className="material-symbols-outlined">person</span>
          <span style={navLabelStyle}>Profile</span>
        </div>
      </div>
    </div>
  )
}

// Стили остаются без изменений
const topAppBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee'
}

const appTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  textAlign: 'center'
}

const notificationButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#0d121b',
  cursor: 'pointer'
}

const searchContainerStyle = {
  padding: '0 16px 12px'
}

const searchWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: 12,
  height: 48
}

const searchIconStyle = {
  marginLeft: 12,
  color: '#4c669a',
  fontSize: 20
}

const searchInputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingLeft: 8,
  fontSize: 16,
  color: '#0d121b'
}

const chipsContainerStyle = {
  display: 'flex',
  gap: 12,
  padding: '0 16px 12px',
  overflowX: 'auto'
}

const chipStyle = {
  padding: '8px 16px',
  backgroundColor: 'white',
  color: '#4c669a',
  border: '1px solid #cfd7e7',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: '500',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const chipActiveStyle = {
  ...chipStyle,
  backgroundColor: '#135bec',
  color: 'white',
  border: '1px solid #135bec'
}

const filterIndicatorStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#e3f2fd',
  margin: '0 16px 12px',
  borderRadius: 8,
  fontSize: 14,
  color: '#0d121b'
}

const clearFilterStyle = {
  background: 'none',
  border: 'none',
  color: '#135bec',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: 4
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
  gap: 12,
  padding: '0 16px 80px'
}

const noResultsStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  padding: '40px 20px',
  color: '#6b7280',
  fontSize: 16
}

const fabStyle = {
  position: 'fixed',
  bottom: 96,
  right: 16,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#E67E22',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  cursor: 'pointer'
}

const bottomNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 80,
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  borderTop: '1px solid #eee',
  backgroundColor: 'white'
}

const navItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  color: '#6b7280',
  fontSize: 10,
  cursor: 'pointer'
}

const navItemActiveStyle = {
  ...navItemStyle,
  color: '#135bec'
}

const navLabelStyle = {
  fontSize: 10,
  fontWeight: '500'
}

export default Home