// frontend/src/components/SellerProfile.jsx
import React, { useState, useEffect } from 'react';
import AdCard from './AdCard';
import UserReviews from './UserReviews';

function SellerProfile({ sellerId, onBack, setCurrentPage, setSelectedAd }) {
  const [seller, setSeller] = useState(null);
  const [sellerAds, setSellerAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchSellerData();
  }, [sellerId]);

  const fetchSellerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Получаем информацию о продавце
      const sellerResponse = await fetch(`${API_BASE}/api/user/${sellerId}`);
      
      if (!sellerResponse.ok) {
        throw new Error(`Ошибка HTTP: ${sellerResponse.status}`);
      }
      
      const sellerData = await sellerResponse.json();
      
      if (sellerData.success) {
        setSeller(sellerData.user);
        
        // 2. Получаем объявления продавца через специальный эндпоинт
        await fetchSellerAds(sellerData.user.id);
      } else {
        throw new Error(sellerData.error || 'Не удалось загрузить данные продавца');
      }
    } catch (error) {
      console.error('Ошибка загрузки данных продавца:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerAds = async (userId) => {
    try {
      console.log('Загрузка объявлений для пользователя ID:', userId);
      
      const response = await fetch(`${API_BASE}/api/users/${userId}/ads`);
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const adsData = await response.json();
      
      console.log('Получены объявления продавца:', {
        userId,
        adsCount: adsData.length,
        ads: adsData.map(ad => ({ 
          id: ad.id, 
          title: ad.title, 
          user_id: ad.user_id,
          status: ad.status,
          is_archived: ad.is_archived,
          photo_urls: ad.photo_urls?.length || 0
        }))
      });
      
      setSellerAds(adsData);
    } catch (error) {
      console.error('Ошибка загрузки объявлений продавца:', error);
      setSellerAds([]);
    }
  };

  const handleRefresh = () => {
    fetchSellerData();
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
    if (!seller) return 'П';
    if (seller.first_name) return seller.first_name[0].toUpperCase();
    if (seller.username) return seller.username[0].toUpperCase();
    return 'П';
  };

  const getName = () => {
    if (!seller) return 'Продавец';
    
    if (seller.first_name && seller.last_name) {
      return `${seller.first_name} ${seller.last_name}`;
    }
    if (seller.first_name) return seller.first_name;
    if (seller.username) return `@${seller.username}`;
    return 'Продавец';
  };

  const openTelegramChat = () => {
    if (!seller?.username) {
      alert('У пользователя нет username в Telegram');
      return;
    }
    
    const message = `Здравствуйте! Пишу по поводу ваших объявлений на SpaceGo.`;
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/${seller.username}?text=${encodedMessage}`;
    
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  const handleAdClick = (ad) => {
    if (setSelectedAd && setCurrentPage) {
      setSelectedAd(ad);
      setCurrentPage('ad-detail');
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorPageStyle}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#ef4444', marginBottom: 16 }}>
          error
        </span>
        <h3 style={errorTitleStyle}>Ошибка загрузки</h3>
        <p style={errorTextStyle}>{error}</p>
        <div style={errorButtonsStyle}>
          <button style={errorBackButtonStyle} onClick={onBack}>
            Вернуться назад
          </button>
          <button style={errorRetryButtonStyle} onClick={handleRefresh}>
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div style={errorPageStyle}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#e5e7eb', marginBottom: 16 }}>
          person_off
        </span>
        <h3 style={errorTitleStyle}>Продавец не найден</h3>
        <p style={errorTextStyle}>Пользователь с таким ID не существует</p>
        <button style={errorBackButtonStyle} onClick={onBack}>
          Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Профиль продавца</h2>
        <button 
          onClick={handleRefresh} 
          style={refreshButtonStyle}
          title="Обновить"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            refresh
          </span>
        </button>
      </div>

      {/* Profile Header */}
      <div style={profileHeaderStyle}>
        <div style={avatarSectionStyle}>
          {seller.photo_url ? (
            <img src={seller.photo_url} alt="Аватар" style={avatarImageStyle} />
          ) : (
            <div style={avatarPlaceholderStyle}>{getInitials()}</div>
          )}
        </div>
        
        <div style={profileInfoStyle}>
          <h3 style={userNameStyle}>{getName()}</h3>
          
          {seller.username && (
            <p style={usernameStyle}>@{seller.username}</p>
          )}
          
          <p style={registrationDateStyle}>
            На Spacego с {formatDate(seller.created_at)}
          </p>
        </div>
      </div>

      {/* Contact Button */}
      <div style={{ padding: '0 16px 16px', backgroundColor: 'white' }}>
        <button style={contactButtonStyle} onClick={openTelegramChat}>
          <span className="material-symbols-outlined" style={{ marginRight: 8 }}>chat</span>
          Написать в Telegram
        </button>
      </div>

      {/* Statistics */}
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <div style={statNumberStyle}>{sellerAds.length}</div>
          <div style={statLabelStyle}>Активных объявлений</div>
        </div>
      </div>

      {/* Отзывы */}
      <div style={{ padding: '0 16px 16px' }}>
        <UserReviews 
          userId={sellerId}
          userName={getName()}
        />
      </div>

      {/* Seller's Ads */}
      <div style={{ padding: '0 16px 32px', flex: 1 }}>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>
            Объявления продавца ({sellerAds.length})
          </h3>
          {sellerAds.length > 0 && (
            <button 
              style={refreshAdsButtonStyle}
              onClick={() => fetchSellerAds(seller.id)}
              title="Обновить список объявлений"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            </button>
          )}
        </div>
        
        {sellerAds.length > 0 ? (
          <div style={gridStyle}>
            {sellerAds.map(ad => (
              <div 
                key={ad.id} 
                style={adCardWrapperStyle}
                onClick={() => handleAdClick(ad)}
              >
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        ) : (
          <div style={noAdsStyle}>
            <span className="material-symbols-outlined" style={noAdsIconStyle}>
              sell
            </span>
            <h4 style={noAdsTitleStyle}>Нет активных объявлений</h4>
            <p style={noAdsTextStyle}>
              У продавца пока нет опубликованных объявлений или все объявления находятся на проверке
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

const refreshButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#46A8C1',
  borderRadius: '20px',
  transition: 'background-color 0.2s ease'
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
  borderBottom: '1px solid #eee',
  marginBottom: 12 
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

const contactButtonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: 16,
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease'
};

const statsContainerStyle = { 
  display: 'flex', 
  justifyContent: 'space-around', 
  backgroundColor: 'white', 
  padding: '16px 0', 
  marginBottom: '12px', 
  borderBottom: '1px solid #eee',
  borderTop: '1px solid #eee' 
};

const statItemStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  gap: '4px' 
};

const statNumberStyle = { 
  fontSize: 24, 
  fontWeight: 'bold', 
  color: '#46A8C1' 
};

const statLabelStyle = { 
  fontSize: 12, 
  color: '#6b7280' 
};

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16
};

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  margin: 0
};

const refreshAdsButtonStyle = {
  width: 36,
  height: 36,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#46A8C1',
  borderRadius: '18px',
  transition: 'background-color 0.2s ease'
};

const gridStyle = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', 
  gap: '12px' 
};

const adCardWrapperStyle = {
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  borderRadius: '8px',
  overflow: 'hidden'
};

const noAdsStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  backgroundColor: 'white',
  borderRadius: '12px'
};

const noAdsIconStyle = {
  fontSize: 48,
  color: '#e5e7eb',
  marginBottom: 16
};

const noAdsTitleStyle = {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '8px'
};

const noAdsTextStyle = {
  fontSize: 14,
  color: '#6b7280',
  margin: 0,
  maxWidth: '300px',
  margin: '0 auto'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#f6f6f8'
};

const loadingTextStyle = {
  marginTop: 16,
  color: '#46A8C1',
  fontSize: 16
};

const errorPageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#f6f6f8',
  padding: 20,
  textAlign: 'center'
};

const errorTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '8px'
};

const errorTextStyle = {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: '24px',
  maxWidth: '300px'
};

const errorButtonsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: 16
};

const errorBackButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '8px',
  fontSize: 14,
  fontWeight: '500',
  cursor: 'pointer'
};

const errorRetryButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: 14,
  fontWeight: '500',
  cursor: 'pointer'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-seller-profile-spinner]')) {
  styleSheet.setAttribute('data-seller-profile-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default SellerProfile;