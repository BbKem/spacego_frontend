function AdCard({ ad, onClick }) {
  // Получаем первую фотографию из массива photo_urls
  const getFirstPhoto = () => {
    if (ad.photo_urls && ad.photo_urls.length > 0) {
      return ad.photo_urls[0];
    }
    // Для обратной совместимости с старыми объявлениями
    if (ad.photo_url) {
      return ad.photo_url;
    }
    return null;
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

  const firstPhoto = getFirstPhoto();

  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={imageWrapperStyle}>
        {firstPhoto ? (
          <img 
            src={firstPhoto} 
            alt={ad.title}
            style={imageStyle}
            onError={(e) => {
              // Если изображение не загружается, показываем placeholder
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div style={firstPhoto ? { display: 'none' } : imagePlaceholderStyle}></div>
        <button style={heartButtonStyle}>
          <span className="material-symbols-outlined" style={{ color: '#e11d48' }}>favorite</span>
        </button>
      </div>
      <div style={cardContentStyle}>
        <p style={cardTitleStyle}>{ad.title}</p>
        <p style={cardPriceStyle}>{formatPrice(ad.price)}</p>
        <p style={cardLocationStyle}>{ad.location || 'Казань, р-н Приволжский'}</p>
      </div>
    </div>
  )
}

// Стили остаются без изменений
const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  cursor: 'pointer'
}

const imageWrapperStyle = {
  position: 'relative',
  borderRadius: 12,
  overflow: 'hidden',
  height: 158
}

const imagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#e5e7eb'
}

const heartButtonStyle = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(255,255,255,0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer'
}

const cardContentStyle = {}

const cardTitleStyle = {
  fontSize: 14,
  fontWeight: '500',
  color: '#0d121b'
}

const cardPriceStyle = {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#135bec'
}

const cardLocationStyle = {
  fontSize: 12,
  color: '#6b7280'
}

export default AdCard