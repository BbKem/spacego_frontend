// frontend/src/components/Profile.jsx
import { useState, useEffect } from 'react';
import AdCard from './AdCard';
import SkeletonCard from './SkeletonCard';
import UserReviews from './UserReviews';

function Profile({ user, onBack, onViewAd, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('active');
  const [userAds, setUserAds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [showMenuForAd, setShowMenuForAd] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [userRole, setUserRole] = useState('user');
    const [userRating, setUserRating] = useState(null);
  const [reviewsCount, setReviewsCount] = useState(0);

  const API_BASE = import.meta.env.DEV
    ? 'http://localhost:4000'
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchUserAds();
    fetchFavorites();
    fetchUserRole();
    fetchUserRating();
  }, []);

  const fetchUserAds = async () => {
    setIsLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) return;

      const response = await fetch(`${API_BASE}/api/my-ads`, {
        headers: { 'telegram-init-data': initData }
      });

      if (response.ok) {
        const data = await response.json();
        setUserAds(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRating = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/users/${user.id}/reviews?limit=1`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setUserRating(data.stats?.averageRating || '0.0');
        setReviewsCount(data.stats?.total || 0);
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки рейтинга:', error);
  }
};

  const fetchFavorites = async () => {
    setIsFavoritesLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) return;

      const response = await fetch(`${API_BASE}/api/favorites`, {
        headers: { 'telegram-init-data': initData }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) return;

      const response = await fetch(`${API_BASE}/api/user`, {
        headers: { 'telegram-init-data': initData }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role || 'user');
      }
    } catch (error) {
      console.error('Ошибка загрузки роли пользователя:', error);
    }
  };

  const renderStars = (rating, size = 14) => {
  const numericRating = parseFloat(rating) || 0;
  return (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="material-symbols-outlined"
          style={{
            fontSize: size,
            color: star <= numericRating ? '#f59e0b' : '#e5e7eb'
          }}
        >
          {star <= numericRating ? 'star' : 'star'}
        </span>
      ))}
    </div>
  );
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
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    return 'П';
  };

  const getName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.username) return `@${user.username}`;
    return 'Пользователь';
  };

  const isArchived = (ad) => {
    const isArchivedValue = ad.is_archived;
    
    if (isArchivedValue === true || isArchivedValue === 'true' || isArchivedValue === 1) {
      return true;
    }
    if (isArchivedValue === false || isArchivedValue === 'false' || isArchivedValue === 0) {
      return false;
    }
    if (isArchivedValue === null || isArchivedValue === undefined) {
      return false;
    }
    return Boolean(isArchivedValue);
  };
  
  const isActive = (ad) => {
    const status = ad.status;
    const archived = isArchived(ad);
    return status === 'approved' && !archived;
  };
  
  const isPending = (ad) => {
    const status = ad.status;
    const archived = isArchived(ad);
    return status === 'pending' && !archived;
  };
  
  const isRejected = (ad) => {
    const status = ad.status;
    const archived = isArchived(ad);
    return status === 'rejected' && !archived;
  };

  const getCurrentAds = () => {
    let result;
    switch (activeTab) {
      case 'active':
        result = userAds.filter(isActive);
        break;
      case 'archived':
        result = userAds.filter(isArchived);
        break;
      case 'favorites':
        result = favorites;
        break;
      case 'pending':
        result = userAds.filter(isPending);
        break;
      case 'rejected':
        result = userAds.filter(isRejected);
        break;
      default:
        result = [];
    }
    
    return result;
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'active':
      case 'archived':
      case 'pending':
      case 'rejected':
        return isLoading;
      case 'favorites':
        return isFavoritesLoading;
      default:
        return false;
    }
  };

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
        setUserAds(prev => prev.map(ad =>
          ad.id === adId ? { ...ad, is_archived: true } : ad
        ));
        setShowMenuForAd(null);
        setShowDeleteConfirm(null);
        alert('Объявление перемещено в архив');
      }
    } catch (error) {
      console.error('Ошибка архивирования объявления:', error);
      alert('Не удалось переместить в архив');
    }
  };

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
        setUserAds(prev => prev.map(ad =>
          ad.id === adId ? { ...ad, is_archived: false } : ad
        ));
        setShowMenuForAd(null);
        alert('Объявление восстановлено');
      }
    } catch (error) {
      console.error('Ошибка восстановления объявления:', error);
      alert('Не удалось восстановить объявление');
    }
  };

  const deleteAd = async (adId) => {
    if (window.confirm('Вы уверены, что хотите полностью удалить это объявление? Это действие нельзя отменить.')) {
      try {
        const initData = localStorage.getItem('telegram_init_data');
        const response = await fetch(`${API_BASE}/api/ads/${adId}`, {
          method: 'DELETE',
          headers: {
            'telegram-init-data': initData,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setUserAds(prev => prev.filter(ad => ad.id !== adId));
          alert('Объявление удалено');
        } else {
          alert('Ошибка удаления');
        }
      } catch (error) {
        console.error('Ошибка удаления объявления:', error);
        alert('Ошибка удаления');
      }
    }
  };

  const editAd = (adId) => {
    const adToEdit = userAds.find(ad => ad.id === adId);
    if (adToEdit) {
      localStorage.setItem('editing_ad', JSON.stringify(adToEdit));
      setCurrentPage('edit-ad');
    }
    setShowMenuForAd(null);
  };

  const handleAdClick = (ad) => onViewAd(ad);

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
            <div style={avatarPlaceholderStyle}>{getInitials()}</div>
          )}
        </div>
        <div style={profileInfoStyle}>
  <h3 style={userNameStyle}>
    {getName()}
    {userRole !== 'user' && (
      <span style={{
        fontSize: 12,
        backgroundColor: userRole === 'admin' ? '#dc2626' : '#8b5cf6',
        color: 'white',
        padding: '2px 8px',
        borderRadius: 10,
        marginLeft: 8,
        fontWeight: 'normal'
      }}>
        {userRole === 'admin' ? 'Админ' : 'Модератор'}
      </span>
    )}
  </h3>
  {user.username && <p style={usernameStyle}>@{user.username}</p>}
  <p style={registrationDateStyle}>
    На Spacego с {formatDate(user.created_at)}
  </p>
  
  {/* ДОБАВИТЬ ЭТОТ БЛОК: */}
  <div style={ratingContainerStyle}>
    <div style={ratingStarsStyle}>
      {renderStars(userRating, 14)}
      {userRating && userRating !== '0.0' ? (
        <span style={ratingValueStyle}>{userRating}</span>
      ) : null}
    </div>
    
    {/* Кнопка перехода к отзывам */}
    <button 
      style={reviewsLinkStyle}
      onClick={() => setCurrentPage('all-reviews')} // Будет создана позже
    >
      <span style={reviewsCountStyle}>
        {reviewsCount} {reviewsCount === 1 ? 'отзыв' : 
                        reviewsCount < 5 ? 'отзыва' : 'отзывов'}
      </span>
      <span className="material-symbols-outlined" style={arrowIconStyle}>
        chevron_right
      </span>
    </button>
  </div>
</div>
      </div>

      {/* Moderator/Admin Panels */}
      {(userRole === 'moderator' || userRole === 'admin') && (
        <div style={{ padding: '0 16px 8px' }}>
          <button style={moderationButtonStyle} onClick={() => setCurrentPage('moderation')}>
            <span className="material-symbols-outlined" style={{ marginRight: 8 }}>admin_panel_settings</span>
            Панель модератора
          </button>
        </div>
      )}
      {userRole === 'admin' && (
        <div style={{ padding: '0 16px 16px' }}>
          <button style={adminButtonStyle} onClick={() => setCurrentPage('admin')}>
            <span className="material-symbols-outlined" style={{ marginRight: 8 }}>supervisor_account</span>
            Панель администратора
          </button>
        </div>
      )}

      {/* Статистика */}
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{userAds.filter(isActive).length}</div>
          <div style={statLabelStyle}>Активные</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{userAds.filter(isPending).length}</div>
          <div style={statLabelStyle}>На проверке</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{userAds.filter(isArchived).length}</div>
          <div style={statLabelStyle}>Архив</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{userAds.filter(isRejected).length}</div>
          <div style={statLabelStyle}>Отклонено</div>
        </div>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{favorites.length}</div>
          <div style={statLabelStyle}>Избранное</div>
        </div>
      </div>

      {/* ========== ВСТАВЛЯЕМ КОМПОНЕНТ ОТЗЫВОВ ЗДЕСЬ ========== */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <UserReviews 
          userId={user.id} 
          userName={getName()} 
        />
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button style={activeTab === 'active' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('active')}>
          Активные
        </button>
        <button style={activeTab === 'pending' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('pending')}>
          На проверке
        </button>
        <button style={activeTab === 'archived' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('archived')}>
          Архив
        </button>
        <button style={activeTab === 'rejected' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('rejected')}>
          Отклонено
        </button>
        <button style={activeTab === 'favorites' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('favorites')}>
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
                <div onClick={() => handleAdClick(ad)} style={{ cursor: 'pointer' }}>
                  <AdCard ad={ad} />
                </div>

                {ad.status === 'pending' && !isArchived(ad) && (
                  <div style={statusBadgeStyle}>
                    <span style={{ fontSize: 10 }}>⏳</span> На проверке
                  </div>
                )}
                {ad.status === 'rejected' && !isArchived(ad) && (
                  <div style={rejectedBadgeStyle}>
                    <span style={{ fontSize: 10 }}>❌</span> Отклонено
                  </div>
                )}
                {isArchived(ad) && (
                  <div style={archivedBadgeStyle}>
                    <span style={{ fontSize: 10 }}>📁</span> В архиве
                  </div>
                )}

                {activeTab === 'active' && ad.status === 'approved' && !isArchived(ad) && (
                  <>
                    <button style={menuButtonStyle} onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuForAd(showMenuForAd === ad.id ? null : ad.id);
                    }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {showMenuForAd === ad.id && (
                      <div style={menuDropdownStyle}>
                        <button style={menuItemStyle} onClick={() => editAd(ad.id)}>
                          <span className="material-symbols-outlined" style={menuIconStyle}>edit</span>
                          Редактировать
                        </button>
                        <button style={menuItemStyle} onClick={() => {
                          setShowDeleteConfirm(ad.id);
                          setShowMenuForAd(null);
                        }}>
                          <span className="material-symbols-outlined" style={{ ...menuIconStyle, color: '#ef4444' }}>archive</span>
                          <span style={{ color: '#ef4444' }}>В архив</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'archived' && isArchived(ad) && (
                  <>
                    <button style={menuButtonStyle} onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuForAd(showMenuForAd === ad.id ? null : ad.id);
                    }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {showMenuForAd === ad.id && (
                      <div style={menuDropdownStyle}>
                        <button style={menuItemStyle} onClick={() => restoreAd(ad.id)}>
                          <span className="material-symbols-outlined" style={{ ...menuIconStyle, color: '#10b981' }}>unarchive</span>
                          <span style={{ color: '#10b981' }}>Восстановить</span>
                        </button>
                        <button style={menuItemStyle} onClick={() => {
                          if (window.confirm('Вы уверены, что хотите полностью удалить это объявление?')) {
                            deleteAd(ad.id);
                          }
                        }}>
                          <span className="material-symbols-outlined" style={{ ...menuIconStyle, color: '#ef4444' }}>delete</span>
                          <span style={{ color: '#ef4444' }}>Удалить</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {showDeleteConfirm === ad.id && (
                  <div style={confirmOverlayStyle}>
                    <div style={confirmModalStyle}>
                      <h3 style={confirmTitleStyle}>Переместить в архив?</h3>
                      <p style={confirmTextStyle}>Объявление будет скрыто из поиска, но останется в вашем архиве.</p>
                      <div style={confirmButtonsStyle}>
                        <button style={confirmCancelStyle} onClick={() => setShowDeleteConfirm(null)}>Отмена</button>
                        <button style={confirmDeleteStyle} onClick={() => archiveAd(ad.id)}>В архив</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <span className="material-symbols-outlined" style={emptyIconStyle}>
              {activeTab === 'active' ? 'sell' :
                activeTab === 'pending' ? 'hourglass_empty' :
                activeTab === 'archived' ? 'archive' :
                activeTab === 'rejected' ? 'block' :
                'favorite'}
            </span>
            <h3 style={emptyTitleStyle}>
              {activeTab === 'active' ? 'Нет активных объявлений' :
                activeTab === 'pending' ? 'Нет объявлений на проверке' :
                activeTab === 'archived' ? 'Архив пуст' :
                activeTab === 'rejected' ? 'Нет отклоненных объявлений' :
                'Нет избранных объявлений'}
            </h3>
            <p style={emptyTextStyle}>
              {activeTab === 'active' ? 'Создайте первое объявление!' :
                activeTab === 'pending' ? 'Здесь будут ваши объявления, ожидающие проверки' :
                activeTab === 'archived' ? 'Здесь будут ваши архивные объявления' :
                activeTab === 'rejected' ? 'Здесь будут объявления, отклоненные модератором' :
                'Добавляйте объявления в избранное'}
            </p>
            {activeTab === 'active' && (
              <button style={createAdButtonStyle} onClick={() => setCurrentPage('create-ad')}>
                <span className="material-symbols-outlined" style={{ marginRight: 8 }}>add</span>
                Создать объявление
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Стили (остаются без изменений)
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
  padding: '0 16px', 
  backgroundColor: 'white', 
  borderBottom: '1px solid #eee', 
  height: '95px', 
  minHeight: '95px', 
  boxSizing: 'border-box' 
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
  margin: '0 0 4px 0', 
  display: 'flex', 
  alignItems: 'center' 
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

const moderationButtonStyle = { 
  width: '100%', 
  padding: '12px', 
  backgroundColor: '#8b5cf6', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  fontSize: 14, 
  fontWeight: '500', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  marginBottom: '8px' 
};

const adminButtonStyle = { 
  width: '100%', 
  padding: '12px', 
  backgroundColor: '#dc2626', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  fontSize: 14, 
  fontWeight: '500', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  marginBottom: '12px' 
};

const statsContainerStyle = { 
  display: 'flex', 
  justifyContent: 'space-around', 
  backgroundColor: 'white', 
  padding: '16px 0', 
  marginBottom: '12px', 
  borderBottom: '1px solid #eee',
  flexWrap: 'wrap' 
};

const statItemStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  gap: '4px',
  minWidth: '60px',
  margin: '0 4px'
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
  flexWrap: 'wrap',
  backgroundColor: 'white',
  padding: '0 16px',
  borderBottom: '1px solid #eee'
};

const tabStyle = {
  flex: '1 0 auto',
  minWidth: '80px',
  padding: '16px 0',
  background: 'none',
  border: 'none',
  borderBottom: '3px solid transparent',
  color: '#6b7280',
  fontSize: 12,
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
  paddingBottom: '80px', 
  position: 'relative' 
};

const gridStyle = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', 
  gap: '12px' 
};

const adCardContainerStyle = { 
  position: 'relative' 
};

const menuButtonStyle = { 
  position: 'absolute', 
  top: 8, 
  right: 8, 
  width: 30, 
  height: 30, 
  borderRadius: 15, 
  backgroundColor: 'rgba(255,255,255,0.9)', 
  border: 'none', 
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 2, 
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
};

const menuDropdownStyle = { 
  position: 'absolute', 
  top: 40, 
  right: 8, 
  backgroundColor: 'white', 
  borderRadius: 8, 
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
  zIndex: 10, 
  minWidth: 180, 
  overflow: 'hidden' 
};

const menuItemStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  width: '100%', 
  padding: '12px 16px', 
  background: 'none', 
  border: 'none', 
  cursor: 'pointer', 
  textAlign: 'left', 
  fontSize: 14, 
  color: '#374151', 
  transition: 'background-color 0.2s ease', 
  borderBottom: '1px solid #f3f4f6' 
};

const menuIconStyle = { 
  fontSize: 18, 
  color: '#6b7280' 
};

const confirmOverlayStyle = { 
  position: 'absolute', 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  backgroundColor: 'rgba(0,0,0,0.5)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 20, 
  borderRadius: 12 
};

const confirmModalStyle = { 
  backgroundColor: 'white', 
  borderRadius: 12, 
  padding: '24px', 
  maxWidth: '320px', 
  width: '90%' 
};

const confirmTitleStyle = { 
  fontSize: 18, 
  fontWeight: 'bold', 
  color: '#0d121b', 
  marginBottom: '12px' 
};

const confirmTextStyle = { 
  fontSize: 14, 
  color: '#6b7280', 
  marginBottom: '20px', 
  lineHeight: 1.4 
};

const confirmButtonsStyle = { 
  display: 'flex', 
  gap: '12px' 
};

const confirmCancelStyle = { 
  flex: 1, 
  padding: '12px', 
  backgroundColor: '#f3f4f6', 
  color: '#374151', 
  border: 'none', 
  borderRadius: 8, 
  fontSize: 14, 
  fontWeight: '500', 
  cursor: 'pointer' 
};

const confirmDeleteStyle = { 
  flex: 1, 
  padding: '12px', 
  backgroundColor: '#fee2e2', 
  color: '#dc2626', 
  border: 'none', 
  borderRadius: 8, 
  fontSize: 14, 
  fontWeight: '500', 
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
  maxWidth: '300px', 
  marginBottom: '20px' 
};

const createAdButtonStyle = { 
  padding: '12px 24px', 
  backgroundColor: '#46A8C1', 
  color: 'white', 
  border: 'none', 
  borderRadius: 8, 
  fontSize: 14, 
  fontWeight: '500', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center' 
};

const statusBadgeStyle = { 
  position: 'absolute', 
  top: 8, 
  left: 8, 
  backgroundColor: 'rgba(245, 158, 11, 0.9)', 
  color: 'white', 
  fontSize: 10, 
  padding: '2px 6px', 
  borderRadius: 4, 
  fontWeight: 'bold', 
  zIndex: 2, 
  display: 'flex', 
  alignItems: 'center', 
  gap: 2 
};

const ratingContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid #eee'
};

const ratingStarsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const ratingValueStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginLeft: '4px'
};

const reviewsLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '6px',
  transition: 'background-color 0.2s ease',
  color: '#46A8C1'
};

const reviewsCountStyle = {
  fontSize: '12px',
  color: '#46A8C1',
  fontWeight: '500'
};

const arrowIconStyle = {
  fontSize: '16px',
  marginLeft: '4px',
  color: '#46A8C1'
};

const rejectedBadgeStyle = { 
  ...statusBadgeStyle, 
  backgroundColor: 'rgba(239, 68, 68, 0.9)' 
};

const archivedBadgeStyle = { 
  ...statusBadgeStyle, 
  backgroundColor: 'rgba(107, 114, 128, 0.9)' 
};

export default Profile;