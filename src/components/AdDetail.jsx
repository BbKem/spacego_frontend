import { useState, useEffect } from 'react';

function AdDetail({ ad, onBack }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [seller, setSeller] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Получаем массив фотографий
  const getPhotos = () => {
    if (ad?.photo_urls && ad.photo_urls.length > 0) {
      return ad.photo_urls;
    }
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

  // Форматируем цену
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

// Улучшенная функция форматирования адреса для детального просмотра
const formatLocationForDetail = (location) => {
  if (!location || location.trim() === '') {
    return [{ text: 'Местоположение не указано', type: 'empty' }];
  }
  
  // Разбиваем на компоненты
  const parts = location.split(', ');
  
  // Классифицируем компоненты адреса
  let country = '';
  let city = '';
  let street = '';
  let house = '';
  
  // Проходим по частям в обратном порядке для определения страны и города
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    
    if (part.includes('д.')) {
      house = part;
    } else if (part.includes('ул.')) {
      street = part;
    } else if (
      !part.match(/^\d{5,6}$/) && // не почтовый индекс
      !part.includes('район') &&
      !part.includes('область') &&
      !part.includes('округ') &&
      !part.includes('муниципальный')
    ) {
      // Первый подходящий элемент (с конца) - страна, следующий - город
      if (!country) {
        country = part;
      } else if (!city) {
        city = part;
      }
    }
  }
  
  // Собираем в правильной последовательности: страна, город, улица, дом
  const resultParts = [];
  if (country) resultParts.push({ text: country, type: 'country' });
  if (city) resultParts.push({ text: city, type: 'city' });
  if (street) resultParts.push({ text: street, type: 'street' });
  if (house) resultParts.push({ text: house, type: 'house' });
  
  // Если не удалось классифицировать, возвращаем оригинальный адрес
  if (resultParts.length === 0) {
    return parts.map(part => ({ text: part, type: 'regular' }));
  }
  
  return resultParts;
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
  const hasLocation = ad?.location && ad.location.trim() !== '';
  const formattedLocation = formatLocationForDetail(ad?.location);

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

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
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

  // Открываем адрес в Google Maps
  const openInMaps = () => {
    if (!hasLocation) return;
    
    const encodedAddress = encodeURIComponent(ad.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
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
        {totalPhotos > 0 && !imageErrors[currentPhotoIndex] ? (
          <>
            <div style={imageContainerStyle}>
              <img 
                src={photos[currentPhotoIndex]} 
                alt={`${ad?.title || 'Объявление'} - фото ${currentPhotoIndex + 1}`}
                style={detailImageStyle}
                onError={() => handleImageError(currentPhotoIndex)}
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
        {totalPhotos > 0 && !imageErrors[currentPhotoIndex] && (
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
          <div style={locationCardStyle}>
            <div style={locationRowStyle}>
              <span className="material-symbols-outlined" style={locationIconStyle}>
                location_on
              </span>
              <div style={locationTextStyle}>
                <div style={locationAddressStyle}>
                  {formattedLocation.map((part, index) => (
                    <span
                      key={index}
                      style={
                        part.type === 'empty' ? locationEmptyStyle :
                        part.type === 'house' ? locationHouseStyle :
                        part.type === 'street' ? locationStreetStyle :
                        part.type === 'city' ? locationCityStyle :
                        part.type === 'country' ? locationCountryStyle :
                        locationRegularStyle
                      }
                    >
                      {part.text}
                      {index < formattedLocation.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {hasLocation && (
                  <button onClick={openInMaps} style={mapLinkStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      open_in_new
                    </span>
                    <span>Открыть в Картах</span>
                  </button>
                )}
              </div>
            </div>
          </div>
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
  );
}

// Стили с обновленной цветовой палитрой
const detailPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const detailHeaderStyle = {
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

const shareButtonStyle = {
  ...backButtonStyle
};

const detailImageWrapperStyle = {
  position: 'relative',
  backgroundColor: '#e5e7eb',
  height: '300px'
};

const detailImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: '#f6f6f8'
};

const imageContainerStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f6f6f8'
};

const detailImagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#e5e7eb'
};

const placeholderIconStyle = {
  fontSize: 64,
  color: '#9ca3af'
};

const navButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#0d121b'
};

const detailHeartButtonStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer'
};

const imageCounterStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12
};

const dotsStyle = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0
};

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'white',
  opacity: 0.5,
  cursor: 'pointer'
};

const dotActiveStyle = {
  ...dotStyle,
  opacity: 1,
  width: 20
};

const detailContentStyle = {
  padding: '16px',
  paddingBottom: '80px'
};

const detailTitleStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0d121b',
  margin: '0 0 8px 0'
};

const detailPriceStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#46A8C1',
  margin: '0 0 8px 0'
};

const detailMetaStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 16px 0'
};

const tagsStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: '16px'
};

const tagPrimaryStyle = {
  padding: '6px 12px',
  backgroundColor: 'rgba(70, 168, 193, 0.2)',
  color: '#46A8C1',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
};

const tagGrayStyle = {
  padding: '6px 12px',
  backgroundColor: '#f0f0f0',
  color: '#4b5563',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
};

const sectionStyle = {
  marginTop: '24px'
};

const sectionTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '12px'
};

const sectionTextStyle = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: 1.5
};

const locationCardStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16
};

const locationRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12
};

const locationIconStyle = {
  color: '#46A8C1',
  fontSize: 20,
  flexShrink: 0,
  marginTop: 2
};

const locationTextStyle = {
  flex: 1
};

const locationAddressStyle = {
  fontSize: 16,
  color: '#0d121b',
  fontWeight: '500',
  marginBottom: 8,
  lineHeight: 1.4
};

const locationCountryStyle = {
  color: '#0d121b',
  fontSize: '16px'
}

const locationCityStyle = {
  color: '#0d121b',
  fontSize: '16px'
}

const locationStreetStyle = {
  color: '#0d121b',
  fontSize: '16px'
}

const locationHouseStyle = {
  color: '#0d121b',
  fontSize: '16px'
}

const locationRegularStyle = {
  color: '#0d121b',
  fontSize: '16px'
}

const locationEmptyStyle = {
  color: '#0d121b',
  fontSize: '16px',
  fontStyle: 'italic'
}

const mapLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#46A8C1',
  fontSize: 14,
  cursor: 'pointer',
  padding: 0
};

const sellerCardStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: '12px',
  padding: '16px'
};

const sellerAvatarStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  marginRight: '12px'
};

const sellerNameStyle = {
  fontWeight: 'bold',
  color: '#0d121b',
  fontSize: '16px'
};

const sellerRatingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px'
};

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
};

const footerButtonPrimaryStyle = {
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
  cursor: 'pointer',
  backgroundColor: '#46A8C1',
  color: 'white'
};

const footerButtonSecondaryStyle = {
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
  cursor: 'pointer',
  backgroundColor: 'rgba(70, 168, 193, 0.2)',
  color: '#46A8C1'
};

export default AdDetail;