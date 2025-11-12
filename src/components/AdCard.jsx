function AdCard({ ad, onClick }) {
  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={imageWrapperStyle}>
        {ad.photo_url ? (
          <img 
            src={ad.photo_url} 
            alt={ad.title}
            style={imageStyle}
          />
        ) : (
          <div style={imagePlaceholderStyle}></div>
        )}
        <button style={heartButtonStyle}>
          <span className="material-symbols-outlined" style={{ color: '#e11d48' }}>favorite</span>
        </button>
      </div>
      <div style={cardContentStyle}>
        <p style={cardTitleStyle}>{ad.title}</p>
        <p style={cardPriceStyle}>{ad.price} ₽</p>
        <p style={cardLocationStyle}>{ad.location || 'Казань, р-н Приволжский'}</p>
      </div>
    </div>
  )
}

// Добавьте этот стиль
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