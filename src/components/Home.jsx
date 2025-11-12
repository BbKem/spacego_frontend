import { useState, useEffect } from 'react'
import AdCard from './AdCard'

function Home({ user, onLogout, onViewAd, onCreateAd  }) {
  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const [categories, setCategories] = useState([])
  const [ads, setAds] = useState([])

  useEffect(() => {
    loadCategories()
    loadAds()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Ошибка загрузки категорий')
    }
  }

  const loadAds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ads`)
      const data = await res.json()
      setAds(data)
    } catch (err) {
      console.error('Ошибка загрузки объявлений')
    }
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
        {categories.map(cat => (
          <div key={cat.id} style={chipActiveStyle}>{cat.name}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={gridStyle}>
        {ads.map(ad => (
          <AdCard key={ad.id} ad={ad} onClick={() => onViewAd(ad)} />
        ))}
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
// Стили главной страницы
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

const chipActiveStyle = {
  padding: '8px 16px',
  backgroundColor: '#135bec',
  color: 'white',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: '500',
  whiteSpace: 'nowrap'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
  gap: 12,
  padding: '0 16px 80px'
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
  fontSize: 10
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