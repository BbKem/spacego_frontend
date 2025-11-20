import { useState, useEffect } from 'react';

function AdDetail({ ad, onBack }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [seller, setSeller] = useState(null);
  
  // Получаем массив фотографий
  const getPhotos = () => {
    if (ad?.photo_urls && ad.photo_urls.length > 0) {
      return ad.photo_urls;
    }
    // Для обратной совместимости со старыми объявлениями
    if (ad?.photo_url) {
      return [ad.photo_url];
    }
    return [];
  };

  // Форматируем дату публикации
  const getTimeAgo = (createdAt) => {
    if (!createdAt) return 'Недавно';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дня назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} месяца назад`;
    return `${Math.floor(diffDays / 365)} года назад`;
  };

  // Форматируем цену (убираем копейки если их нет)
  const formatPrice = (price) => {
    if (!price) return '0 ₽';
    
    const numPrice = parseFloat(price);
    if (Number.isInteger(numPrice)) {
      return `${numPrice.toLocaleString('ru-RU')} ₽`;
    } else {
      return `${numPrice.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })} ₽`;
    }
  };

  // Получаем информацию о продавце
  const fetchSellerInfo = async (userId) => {
    if (!userId) return;
    
    try {
      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:4000' 
        : 'https://spacego-backend.onrender.com';
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const sellerData = await response.json();
        setSeller(sellerData.user);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных продавца:', error);
    }
  };

  const photos = getPhotos();
  const totalPhotos = photos.length;

  // Сбрасываем индекс при смене объявления и загружаем данные продавца
  useEffect(() => {
    setCurrentPhotoIndex(0);
    if (ad?.user_id) {
      fetchSellerInfo(ad.user_id);
    }
  }, [ad]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  // Генерируем инициалы из email
  const getInitialsFromEmail = (email) => {
    if (!email) return 'П';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Генерируем имя из email
  const getNameFromEmail = (email) => {
    if (!email) return 'Пользователь';
    const username = email.split('@')[0];
    const parts = username.split('.');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return username;
  };

  return (
    <div style={detailPageStyle}>
      {/* Header */}
      <div style={detailHeaderStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button style={shareButtonStyle}>
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>

      {/* Image Slider */}
      <div style={detailImageWrapperStyle}>
        {totalPhotos > 0 ? (
          <>
            <div style={imageContainerStyle}>
              <img 
                src={photos[currentPhotoIndex]} 
                alt={`${ad?.title || 'Объявление'} - фото ${currentPhotoIndex + 1}`}
                style={detailImageStyle}
                onError={(e) => {
                  // Если изображение не загружается, показываем placeholder
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            {/* Навигационные кнопки */}
            {totalPhotos > 1 && (
              <>
                <button 
                  onClick={prevPhoto} 
                  style={{...navButtonStyle, left: 8}}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={nextPhoto} 
                  style={{...navButtonStyle, right: 8}}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </>
        ) : (
          <div style={detailImagePlaceholderStyle}>
            <span className="material-symbols-outlined" style={placeholderIconStyle}>
              photo_camera
            </span>
          </div>
        )}
        
        <button style={detailHeartButtonStyle}>
          <span className="material-symbols-outlined">favorite_border</span>
        </button>
        
        {/* Счетчик фото */}
        {totalPhotos > 0 && (
          <div style={imageCounterStyle}>
            {currentPhotoIndex + 1} / {totalPhotos}
          </div>
        )}
        
        {/* Индикатор точек */}
        {totalPhotos > 1 && (
          <div style={dotsStyle}>
            {photos.map((_, index) => (
              <div 
                key={index}
                onClick={() => goToPhoto(index)}
                style={index === currentPhotoIndex ? dotActiveStyle : dotStyle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={detailContentStyle}>
        <h1 style={detailTitleStyle}>{ad?.title || 'Без названия'}</h1>
        <h2 style={detailPriceStyle}>{formatPrice(ad?.price)}</h2>
        <p style={detailMetaStyle}>
          Опубликовано {getTimeAgo(ad?.created_at)} • 123 просмотра
        </p>

        <div style={tagsStyle}>
          <div style={tagPrimaryStyle}>{ad?.category_name || 'Без категории'}</div>
          <div style={tagGrayStyle}>{ad?.condition === 'new' ? 'Новое' : 'Б/у'}</div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Описание</h3>
          <p style={sectionTextStyle}>
            {ad?.description || 'Описание отсутствует'}
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Местоположение</h3>
          <div style={locationRowStyle}>
            <span className="material-symbols-outlined" style={{ color: '#6b7280' }}>location_on</span>
            <span>{ad?.location || 'Местоположение не указано'}</span>
          </div>
          <div style={mapPlaceholderStyle}></div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Продавец</h3>
          <div style={sellerCardStyle}>
            <div style={sellerAvatarStyle}>
              {seller ? getInitialsFromEmail(seller.email) : 'П'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={sellerNameStyle}>
                {seller ? getNameFromEmail(seller.email) : 'Пользователь'}
              </div>
              <div style={sellerRatingStyle}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 14 }}>star</span>
                <span style={{ fontWeight: 'bold' }}>4.8</span>
                <span> • На Spacego с {ad?.created_at ? new Date(ad.created_at).getFullYear() : '2024'} года</span>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#6b7280' }}>chevron_right</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={detailFooterStyle}>
        <button style={footerButtonSecondaryStyle}>
          <span className="material-symbols-outlined">chat_bubble</span>
          <span>Написать</span>
        </button>
        <button style={footerButtonPrimaryStyle}>
          <span className="material-symbols-outlined">call</span>
          <span>Позвонить</span>
        </button>
      </div>
    </div>
  )
}

// Стили остаются такими же как в предыдущей версии
const detailPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '100%',
  overflowX: 'hidden'
}

const detailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 16px 0',
  backgroundColor: 'white',
  position: 'sticky',
  top: 0,
  zIndex: 10
}

const backButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent'
}

const shareButtonStyle = {
  ...backButtonStyle
}

const detailImageWrapperStyle = {
  position: 'relative',
  backgroundColor: '#e5e7eb',
  margin: 0,
  overflow: 'hidden',
  height: '60vh',
  maxHeight: '500px',
  minHeight: '300px'
}

const imageContainerStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f8f9fa'
}

const detailImageStyle = {
  width: 'auto',
  height: 'auto',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain'
}

const detailImagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#e5e7eb'
}

const placeholderIconStyle = {
  fontSize: 64,
  color: '#9ca3af'
}

const navButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#0d121b',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  zIndex: 5
}

const detailHeartButtonStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#0d121b',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  zIndex: 5
}

const imageCounterStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  backdropFilter: 'blur(4px)',
  zIndex: 5
}

const dotsStyle = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0,
  zIndex: 5
}

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'white',
  opacity: 0.5,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const dotActiveStyle = {
  ...dotStyle,
  opacity: 1,
  width: 20
}

const detailContentStyle = {
  padding: '16px',
  paddingBottom: '80px'
}

const detailTitleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginTop: 0,
  marginBottom: '8px',
  lineHeight: 1.2
}

const detailPriceStyle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#135bec',
  marginTop: 0,
  marginBottom: '8px'
}

const detailMetaStyle = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: 0,
  marginBottom: '16px'
}

const tagsStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: '16px',
  flexWrap: 'wrap'
}

const tagPrimaryStyle = {
  padding: '6px 12px',
  backgroundColor: 'rgba(19, 91, 236, 0.2)',
  color: '#135bec',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
}

const tagGrayStyle = {
  padding: '6px 12px',
  backgroundColor: '#f0f0f0',
  color: '#4b5563',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
}

const sectionStyle = {
  marginTop: '24px'
}

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '12px'
}

const sectionTextStyle = {
  fontSize: '16px',
  color: '#4b5563',
  lineHeight: 1.5
}

const locationRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#4b5563',
  marginBottom: '12px'
}

const mapPlaceholderStyle = {
  height: '120px',
  backgroundColor: '#e5e7eb',
  borderRadius: '12px'
}

const sellerCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f0f0f0',
  borderRadius: '16px',
  padding: '16px'
}

const sellerAvatarStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#135bec',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  marginRight: '12px'
}

const sellerNameStyle = {
  fontWeight: 'bold',
  color: '#0d121b',
  fontSize: '16px'
}

const sellerRatingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px'
}

const detailFooterStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  gap: '12px',
  padding: '16px',
  borderTop: '1px solid #eee',
  backgroundColor: 'white'
}

const footerButtonStyle = {
  flex: 1,
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer'
}

const footerButtonPrimaryStyle = {
  ...footerButtonStyle,
  backgroundColor: '#135bec',
  color: 'white'
}

const footerButtonSecondaryStyle = {
  ...footerButtonStyle,
  backgroundColor: 'rgba(19, 91, 236, 0.2)',
  color: '#135bec'
}

export default AdDetail