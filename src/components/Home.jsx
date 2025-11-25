import { useState, useEffect } from 'react'
import AdCard from './AdCard'
import { useAppCache } from '../App'
import logo from '../assets/logo.png'

function Home({ user, onLogout, onViewAd, onCreateAd }) {
  const { ads, categories, isLoading, refreshData } = useAppCache()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredAds, setFilteredAds] = useState([])
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    if (ads) {
      if (selectedCategory) {
        const filtered = ads.filter(ad => ad.category_name === selectedCategory.name)
        setFilteredAds(filtered)
      } else {
        setFilteredAds(ads)
      }
    }
  }, [selectedCategory, ads])

  const handleRefresh = async () => {
    setLocalLoading(true)
    await refreshData()
    setLocalLoading(false)
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

  const displayAds = filteredAds || []
  const displayCategories = categories || []

  return (
    <div style={{ backgroundColor: '#f6f6f8', minHeight: '100vh' }}>
      {/* TopAppBar */}
      <div style={topAppBarStyle}>
        <div style={{ width: 48 }}></div>
        <div style={appTitleContainerStyle}>
          <img src={logo} alt="Spacego" style={appLogoStyle} />
        </div>
        <div style={headerButtonsStyle}>
          <button 
            style={refreshButtonStyle} 
            onClick={handleRefresh}
            disabled={localLoading}
            title="Обновить"
          >
            <span 
              className="material-symbols-outlined"
              style={{ 
                animation: localLoading ? 'spin 1s linear infinite' : 'none' 
              }}
            >
              refresh
            </span>
          </button>
          <button style={notificationButtonStyle}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>

      {/* SearchBar */}
      <div style={searchContainerStyle}>
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle} className="material-symbols-outlined">search</span>
          <input
            placeholder="Search for products"
            style={searchInputStyle}
            maxLength="100"
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
        
        {displayCategories.map(cat => (
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
        {(isLoading || localLoading) ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} style={skeletonCardStyle}>
              <div style={skeletonImageStyle}></div>
              <div style={skeletonTextStyle}></div>
              <div style={skeletonTextShortStyle}></div>
            </div>
          ))
        ) : displayAds.length > 0 ? (
          displayAds.map(ad => (
            <AdCard key={ad.id} ad={ad} onClick={() => onViewAd(ad)} />
          ))
        ) : (
          <div style={noResultsStyle}>
            {selectedCategory ? (
              <p>Нет объявлений в категории "{selectedCategory.name}"</p>
            ) : (
              <p>Нет объявлений</p>
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

const topAppBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 20px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee',
  height: '100px', 
  minHeight: '100px', 
  boxSizing: 'border-box' 
}

const appTitleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const appLogoStyle = {
  width: 250,
  height: 250,
  objectFit: 'contain'
}

const headerButtonsStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
}

const refreshButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  borderRadius: '20px',
  transition: 'background-color 0.2s ease'
}

const notificationButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  borderRadius: '20px',
  transition: 'background-color 0.2s ease'
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
  color: '#46A8C1',
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
  color: '#46A8C1',
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
  backgroundColor: '#46A8C1',
  color: 'white',
  border: '1px solid #46A8C1'
}

const filterIndicatorStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: 'rgba(70, 168, 193, 0.1)',
  margin: '0 16px 12px',
  borderRadius: 8,
  fontSize: 14,
  color: '#0d121b'
}

const clearFilterStyle = {
  background: 'none',
  border: 'none',
  color: '#46A8C1',
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
  backgroundColor: '#50B79C',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 12px rgba(80, 183, 156, 0.3)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease'
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
  cursor: 'pointer',
  transition: 'color 0.2s ease'
}

const navItemActiveStyle = {
  ...navItemStyle,
  color: '#46A8C1'
}

const navLabelStyle = {
  fontSize: 10,
  fontWeight: '500'
}

// Скелетоны остаются без изменений
const skeletonCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  backgroundColor: 'white',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  animation: 'pulse 1.5s ease-in-out infinite'
}

const skeletonImageStyle = {
  width: '100%',
  height: '158px',
  backgroundColor: '#e5e7eb',
  borderRadius: '12px 12px 0 0'
}

const skeletonTextStyle = {
  height: '16px',
  backgroundColor: '#e5e7eb',
  borderRadius: 4,
  margin: '0 12px',
  marginBottom: '4px'
}

const skeletonTextShortStyle = {
  height: '12px',
  backgroundColor: '#e5e7eb',
  borderRadius: 4,
  margin: '0 12px',
  marginBottom: '8px',
  width: '60%'
}

export default Home