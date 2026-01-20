// frontend/src/components/Favorites.jsx
import { useState, useEffect } from 'react';
import AdCard from './AdCard';
import SkeletonCard from './SkeletonCard';

function Favorites({ onViewAd, onBack }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/favorites`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        setError('Ошибка загрузки избранного');
      }
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setError('Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Избранное</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {isLoading ? (
          <div style={gridStyle}>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div style={errorStyle}>
            <p>{error}</p>
            <button onClick={fetchFavorites} style={retryButtonStyle}>
              Попробовать снова
            </button>
          </div>
        ) : favorites.length > 0 ? (
          <div style={gridStyle}>
            {favorites.map(ad => (
              <AdCard key={ad.id} ad={ad} onClick={() => onViewAd(ad)} />
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <span className="material-symbols-outlined" style={emptyIconStyle}>
              favorite
            </span>
            <h3 style={emptyTitleStyle}>Нет избранных объявлений</h3>
            <p style={emptyTextStyle}>
              Нажимайте на ♡ в объявлениях, чтобы сохранить их здесь
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Стили
const pageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee'
};

const backButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#46A8C1'
};

const titleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  margin: 0
};

const contentStyle = {
  flex: 1,
  padding: '16px',
  paddingBottom: '80px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
  gap: '12px'
};

const errorStyle = {
  textAlign: 'center',
  padding: '40px 20px'
};

const retryButtonStyle = {
  marginTop: '20px',
  padding: '10px 20px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center'
};

const emptyIconStyle = {
  fontSize: 64,
  color: '#e5e7eb',
  marginBottom: '16px'
};

const emptyTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '8px'
};

const emptyTextStyle = {
  fontSize: 14,
  color: '#6b7280',
  maxWidth: '300px'
};

export default Favorites;