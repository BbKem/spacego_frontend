function AdDetail({ ad, onBack }) {
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

      {/* Image */}
      <div style={detailImageWrapperStyle}>
        <div style={detailImagePlaceholderStyle}></div>
        <button style={detailHeartButtonStyle}>
          <span className="material-symbols-outlined">favorite_border</span>
        </button>
        <div style={imageCounterStyle}>1 / 5</div>
        <div style={dotsStyle}>
          <div style={dotActiveStyle}></div>
          <div style={dotStyle}></div>
          <div style={dotStyle}></div>
          <div style={dotStyle}></div>
          <div style={dotStyle}></div>
        </div>
      </div>

      {/* Info */}
      <div style={detailContentStyle}>
        <h1 style={detailTitleStyle}>{ad?.title || 'Квадрокоптер DJI Mavic 3'}</h1>
        <h2 style={detailPriceStyle}>{ad?.price || '185 000'} ₽</h2>
        <p style={detailMetaStyle}>Опубликовано 2 дня назад • 123 просмотра</p>

        <div style={tagsStyle}>
          <div style={tagPrimaryStyle}>{ad?.category_name || 'Электроника'}</div>
          <div style={tagGrayStyle}>{ad?.condition === 'new' ? 'Новое' : 'Б/у'}</div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Описание</h3>
          <p style={sectionTextStyle}>
            {ad?.description || 'Продаю абсолютно новый квадрокоптер DJI Mavic 3. Не использовался, в запечатанной упаковке. Полный комплект от производителя.'}
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Местоположение</h3>
          <div style={locationRowStyle}>
            <span className="material-symbols-outlined" style={{ color: '#6b7280' }}>location_on</span>
            <span>{ad?.location || 'Москва, район Арбат'}</span>
          </div>
          <div style={mapPlaceholderStyle}></div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Продавец</h3>
          <div style={sellerCardStyle}>
            <div style={sellerAvatarStyle}></div>
            <div>
              <div style={sellerNameStyle}>Константин В.</div>
              <div style={sellerRatingStyle}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 14 }}>star</span>
                <span style={{ fontWeight: 'bold' }}>4.8</span>
                <span> • На Spacego с мая 2022</span>
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

// Стили карточки
const detailPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
}

const detailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 16px 0',
  backgroundColor: 'white'
}

const backButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer'
}

const shareButtonStyle = {
  ...backButtonStyle
}

const detailImageWrapperStyle = {
  position: 'relative',
  height: 320,
  backgroundColor: '#e5e7eb',
  margin: 16,
  borderRadius: 16,
  overflow: 'hidden'
}

const detailImagePlaceholderStyle = {
  width: '100%',
  height: '100%'
}

const detailHeartButtonStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.2)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  color: 'white'
}

const imageCounterStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: 'rgba(0,0,0,0.4)',
  color: 'white',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  backdropFilter: 'blur(4px)'
}

const dotsStyle = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0
}

const dotStyle = {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: 'white',
  opacity: 0.5
}

const dotActiveStyle = {
  ...dotStyle,
  opacity: 1
}

const detailContentStyle = {
  padding: '0 16px 80px'
}

const detailTitleStyle = {
  fontSize: 32,
  fontWeight: 'bold',
  color: '#0d121b',
  marginTop: 8
}

const detailPriceStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#135bec',
  marginTop: 12
}

const detailMetaStyle = {
  fontSize: 14,
  color: '#6b7280',
  marginTop: 8
}

const tagsStyle = {
  display: 'flex',
  gap: 8,
  marginTop: 16
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
  marginTop: 24
}

const sectionTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: 12
}

const sectionTextStyle = {
  fontSize: 16,
  color: '#4b5563',
  lineHeight: 1.5
}

const locationRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#4b5563'
}

const mapPlaceholderStyle = {
  height: 160,
  backgroundColor: '#e5e7eb',
  borderRadius: 12,
  marginTop: 12
}

const sellerCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f0f0f0',
  borderRadius: 16,
  padding: 16,
  marginTop: 12
}

const sellerAvatarStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#ccc'
}

const sellerNameStyle = {
  fontWeight: 'bold',
  color: '#0d121b'
}

const sellerRatingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 14,
  color: '#6b7280',
  marginTop: 4
}

const detailFooterStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  gap: 12,
  padding: 16,
  borderTop: '1px solid #eee',
  backgroundColor: 'white'
}

const footerButtonStyle = {
  flex: 1,
  height: 48,
  borderRadius: 12,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  fontSize: 16,
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