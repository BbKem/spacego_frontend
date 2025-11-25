import { useState } from 'react';

function AdCard({ ad, onClick }) {
  const [imageError, setImageError] = useState(false);

  const getFirstPhoto = () => {
    if (ad.photo_urls && ad.photo_urls.length > 0) {
      return ad.photo_urls[0];
    }
    if (ad.photo_url) {
      return ad.photo_url;
    }
    return null;
  };

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

  const formatLocationForCard = (location) => {
    if (!location || location.trim() === '') {
      return 'Адрес не указан';
    }
    
    const parts = location.split(', ');
    let country = '';
    let city = '';
    let street = '';
    let house = '';
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      
      if (part.includes('д.')) {
        house = part;
      } else if (part.includes('ул.')) {
        street = part;
      } else if (
        !part.match(/^\d{5,6}$/) &&
        !part.includes('район') &&
        !part.includes('область') &&
        !part.includes('округ') &&
        !part.includes('муниципальный')
      ) {
        if (!country) {
          country = part;
        } else if (!city) {
          city = part;
        }
      }
    }
    
    const resultParts = [];
    if (country) resultParts.push(country);
    if (city) resultParts.push(city);
    if (street) resultParts.push(street);
    if (house) resultParts.push(house);
    
    if (resultParts.length === 0) {
      return location;
    }
    
    return resultParts.join(', ');
  };

  const firstPhoto = getFirstPhoto();

  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={imageWrapperStyle}>
        {firstPhoto && !imageError ? (
          <img 
            src={firstPhoto} 
            alt={ad.title}
            style={imageStyle}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={imagePlaceholderStyle}>
            <span className="material-symbols-outlined" style={{ color: '#9ca3af', fontSize: 32 }}>photo_camera</span>
          </div>
        )}
        <button style={heartButtonStyle}>
          <span className="material-symbols-outlined" style={{ color: '#e11d48', fontSize: 18 }}>favorite</span>
        </button>
      </div>
      <div style={cardContentStyle}>
        <p style={cardTitleStyle}>{ad.title}</p>
        <p style={cardPriceStyle}>{formatPrice(ad.price)}</p>
        <div style={locationRowStyle}>
          <span className="material-symbols-outlined" style={locationIconStyle}>
            location_on
          </span>
          <p style={cardLocationStyle}>{formatLocationForCard(ad.location)}</p>
        </div>
      </div>
    </div>
  );
}

// Обновленные стили с новой цветовой палитрой
const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  cursor: 'pointer',
  backgroundColor: 'white',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
}

const imageWrapperStyle = {
  position: 'relative',
  borderRadius: '12px 12px 0 0',
  overflow: 'hidden',
  height: 158
}

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const imagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const heartButtonStyle = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}

const cardContentStyle = {
  padding: '12px',
  paddingTop: 0
}

const cardTitleStyle = {
  fontSize: 14,
  fontWeight: '500',
  color: '#0d121b',
  margin: '0 0 8px 0',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

const cardPriceStyle = {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#46A8C1',
  margin: '0 0 8px 0'
}

const locationRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 4,
  margin: 0
}

const locationIconStyle = {
  fontSize: 12,
  color: '#46A8C1',
  flexShrink: 0,
  marginTop: 1
}

const cardLocationStyle = {
  fontSize: 12,
  color: '#6b7280',
  margin: 0,
  lineHeight: 1.3,
  flex: 1
}

export default AdCard