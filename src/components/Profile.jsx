// frontend/src/components/Profile.jsx
import { useState, useEffect } from 'react';
import AdCard from './AdCard';
import SkeletonCard from './SkeletonCard';

function Profile({ user, onBack, onViewAd, onLogout }) {
  const [activeTab, setActiveTab] = useState('active');
  const [userAds, setUserAds] = useState([]); // Все объявления пользователя
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchUserAds();
    fetchFavorites();
    fetchStats();
  }, []);

  const fetchUserAds = async () => {
    setIsLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) {
        console.log('Нет данных авторизации');
        return;
      }

      const response = await fetch(`${API_BASE}/api/my-ads`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserAds(data);
        
        // Обновляем статистику на основе полученных данных
        const activeCount = data.filter(ad => !ad.is_archived).length;
        const archivedCount = data.filter(ad => ad.is_archived).length;
        setStats(prev => ({
          ...prev,
          active: activeCount,
          archived: archivedCount
        }));
      } else {
        console.error('Ошибка загрузки объявлений:', response.status);
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений пользователя:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setIsFavoritesLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) {
        console.log('Нет данных авторизации для избранного');
        return;
      }

      const response = await fetch(`${API_BASE}/api/favorites`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        
        // Обновляем статистику избранного
        setStats(prev => ({
          ...prev,
          favorites: data.length
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) {
        console.log('Нет данных авторизации для статистики');
        setIsStatsLoading(false);
        return;
      }

      // Так как у нас нет отдельного эндпоинта для статистики,
      // считаем на основе уже загруженных данных
      setIsStatsLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setIsStatsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Недавно';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = () => {
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    return 'П';
  };

  const getName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.username) {
      return `@${user.username}`;
    }
    return 'Пользователь';
  };

  const getCurrentAds = () => {
    switch (activeTab) {
      case 'active': 
        return userAds.filter(ad => !ad.is_archived);
      case 'archived': 
        return userAds.filter(ad => ad.is_archived === true);
      case 'favorites': 
        return favorites;
      default: 
        return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'active': 
      case 'archived': 
        return isLoading;
      case 'favorites': 
        return isFavoritesLoading;
      default: 
        return false;
    }
  };

  // Функция для архивирования объявления
  const archiveAd = async (adId) => {
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/ads/${adId}/archive`, {
        method: 'POST',
        headers: {
          'telegram-init-data': initData,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Обновляем локальное состояние
        setUserAds(prev => prev.map(ad => 
          ad.id === adId ? { ...ad, is_archived: true } : ad
        ));
      }
    } catch (error) {
      console.error('Ошибка архивирования объявления:', error);
    }
  };

  // Функция для восстановления из архива
  const restoreAd = async (adId) => {
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/ads/${adId}/restore`, {
        method: 'POST',
        headers: {
          'telegram-init-data': initData,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Обновляем локальное состояние
        setUserAds(prev => prev.map(ad => 
          ad.id === adId ? { ...ad, is_archived: false } : ad
        ));
      }
    } catch (error) {
      console.error('Ошибка восстановления объявления:', error);
    }
  };

  const getAdsCountByStatus = () => {
    const active = userAds.filter(ad => !ad.is_archived).length;
    const archived = userAds.filter(ad => ad.is_archived).length;
    return { active, archived };
  };

  const counts = getAdsCountByStatus();

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Профиль</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Profile Header */}
      <div style={profileHeaderStyle}>
        <div style={avatarSectionStyle}>
          {user.photo_url ? (
            <img src={user.photo_url} alt="Аватар" style={avatarImageStyle} />
          ) : (
            <div style={avatarPlaceholderStyle}>
              {getInitials()}
            </div>
          )}
        </div>
        
        <div style={profileInfoStyle}>
          <h3 style={userNameStyle}>{getName()}</h3>
          {user.username && (
            <p style={usernameStyle}>@{user.username}</p>
          )}
          <p style={registrationDateStyle}>
            На Spacego с {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{counts.active}</div>
          <div style={statLabelStyle}>Активные</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{counts.archived}</div>
          <div style={statLabelStyle}>Архив</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{favorites.length}</div>
          <div style={statLabelStyle}>Избранное</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button
          style={activeTab === 'active' ? tabActiveStyle : tabStyle}
          onClick={() => setActiveTab('active')}
        >
          Активные
        </button>
        <button
          style={activeTab === 'archived' ? tabActiveStyle : tabStyle}
          onClick={() => setActiveTab('archived')}
        >
          Архив
        </button>
        <button
          style={activeTab === 'favorites' ? tabActiveStyle : tabStyle}
          onClick={() => setActiveTab('favorites')}
        >
          Избранное
        </button>
      </div>

      {/* Ads Grid */}
      <div style={contentStyle}>
        {getCurrentLoading() ? (
          <div style={gridStyle}>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : getCurrentAds().length > 0 ? (
          <div style={gridStyle}>
            {getCurrentAds().map(ad => (
              <div key={ad.id} style={adCardContainerStyle}>
                <AdCard ad={ad} onClick={() => onViewAd(ad)} />
                {activeTab === 'active' && (
                  <button 
                    style={archiveButtonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveAd(ad.id);
                    }}
                    title="В архив"
                  >
                    <span className="material-symbols-outlined">archive</span>
                  </button>
                )}
                {activeTab === 'archived' && (
                  <button 
                    style={restoreButtonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreAd(ad.id);
                    }}
                    title="Восстановить"
                  >
                    <span className="material-symbols-outlined">unarchive</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <span className="material-symbols-outlined" style={emptyIconStyle}>
              {activeTab === 'active' ? 'sell' : 
               activeTab === 'archived' ? 'archive' : 
               'favorite'}
            </span>
            <h3 style={emptyTitleStyle}>
              {activeTab === 'active' ? 'Нет активных объявлений' : 
               activeTab === 'archived' ? 'Архив пуст' : 
               'Нет избранных объявлений'}
            </h3>
            <p style={emptyTextStyle}>
              {activeTab === 'active' ? 'Создайте первое объявление!' : 
               activeTab === 'archived' ? 'Здесь будут ваши архивные объявления' : 
               'Добавляйте объявления в избранное'}
            </p>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div style={logoutContainerStyle}>
        <button onClick={onLogout} style={logoutButtonStyle}>
          <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>
            logout
          </span>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

// Стили (оставляем те же, что и в вашем коде)
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

const profileHeaderStyle = {
  backgroundColor: 'white',
  padding: '24px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  borderBottom: '1px solid #eee'
};

const avatarSectionStyle = {
  flexShrink: 0
};

const avatarImageStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  objectFit: 'cover'
};

const avatarPlaceholderStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 32,
  fontWeight: 'bold'
};

const profileInfoStyle = {
  flex: 1
};

const userNameStyle = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#0d121b',
  margin: '0 0 4px 0'
};

const usernameStyle = {
  fontSize: 14,
  color: '#46A8C1',
  margin: '0 0 8px 0'
};

const registrationDateStyle = {
  fontSize: 14,
  color: '#6b7280',
  margin: 0
};

const statsContainerStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  backgroundColor: 'white',
  padding: '16px 0',
  marginBottom: '12px',
  borderBottom: '1px solid #eee'
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
};

const statNumberStyle = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#46A8C1'
};

const statLabelStyle = {
  fontSize: 12,
  color: '#6b7280'
};

const tabsContainerStyle = {
  display: 'flex',
  backgroundColor: 'white',
  padding: '0 16px',
  borderBottom: '1px solid #eee'
};

const tabStyle = {
  flex: 1,
  padding: '16px 0',
  background: 'none',
  border: 'none',
  borderBottom: '3px solid transparent',
  color: '#6b7280',
  fontSize: 14,
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const tabActiveStyle = {
  ...tabStyle,
  color: '#46A8C1',
  borderBottom: '3px solid #46A8C1'
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

const adCardContainerStyle = {
  position: 'relative'
};

const archiveButtonStyle = {
  position: 'absolute',
  top: 8,
  left: 8,
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const restoreButtonStyle = {
  ...archiveButtonStyle,
  backgroundColor: 'rgba(70, 168, 193, 0.9)',
  color: 'white'
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

const logoutContainerStyle = {
  padding: '16px',
  borderTop: '1px solid #eee',
  backgroundColor: 'white'
};

const logoutButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: '8px',
  fontSize: 16,
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

export default Profile;