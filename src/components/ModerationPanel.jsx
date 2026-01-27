// frontend/src/components/ModerationPanel.jsx
import React, { useState, useEffect } from 'react';
import AdCard from './AdCard';

function ModerationPanel({ onBack, onViewAd }) {
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingAdId, setRejectingAdId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchPendingAds();
  }, []);

  const fetchPendingAds = async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/admin/pending-ads`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingAds(data);
      } else {
        console.error('Ошибка загрузки объявлений на модерацию');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPendingAds();
  };

  const approveAd = async (adId) => {
    if (!window.confirm('Вы уверены, что хотите одобрить это объявление?')) {
      return;
    }

    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/admin/ads/${adId}/approve`, {
        method: 'POST',
        headers: {
          'telegram-init-data': initData,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setPendingAds(pendingAds.filter(ad => ad.id !== adId));
        alert('✅ Объявление одобрено и опубликовано');
      } else {
        alert('❌ Ошибка одобрения объявления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка сети');
    }
  };

  const rejectAd = async (adId, reason) => {
    if (!reason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите отклонить это объявление?')) {
      return;
    }

    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/admin/ads/${adId}/reject`, {
        method: 'POST',
        headers: {
          'telegram-init-data': initData,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        setPendingAds(pendingAds.filter(ad => ad.id !== adId));
        setRejectReason('');
        setRejectingAdId(null);
        alert('✅ Объявление отклонено');
      } else {
        alert('❌ Ошибка отклонения объявления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка сети');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Недавно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAd = (ad) => {
    if (onViewAd) {
      onViewAd(ad);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Модерация объявлений</h2>
        <button 
          onClick={handleRefresh} 
          style={refreshButtonStyle}
          disabled={isRefreshing}
        >
          <span 
            className="material-symbols-outlined"
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          >
            refresh
          </span>
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle}></div>
            <p>Загрузка объявлений...</p>
          </div>
        ) : pendingAds.length > 0 ? (
          <div style={adsListStyle}>
            <div style={statsStyle}>
              <span>На проверке: <strong>{pendingAds.length}</strong> объявлений</span>
            </div>
            
            {pendingAds.map(ad => (
              <div key={ad.id} style={adItemStyle}>
                {/* Объявление с возможностью просмотра */}
                <div 
                  style={adCardWrapperStyle}
                  onClick={() => handleViewAd(ad)}
                >
                  <AdCard ad={ad} />
                </div>
                
                {/* Информация об авторе */}
                <div style={adInfoStyle}>
                  <div style={authorInfoStyle}>
                    <div style={authorAvatarStyle}>
                      {ad.user_first_name?.[0]?.toUpperCase() || 'П'}
                    </div>
                    <div>
                      <div style={authorNameStyle}>
                        <strong>{ad.user_first_name || 'Пользователь'}</strong>
                        {ad.user_username && <span style={usernameStyle}> @{ad.user_username}</span>}
                      </div>
                      <div style={authorDetailsStyle}>
                        <span>ID: {ad.user_telegram_id}</span>
                        <span style={{margin: '0 8px'}}>•</span>
                        <span>Создано: {formatDate(ad.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={adDetailsStyle}>
                    <p><strong>Категория:</strong> {ad.category_name || 'Не указана'}</p>
                    <p><strong>Цена:</strong> {ad.price ? `${parseInt(ad.price).toLocaleString('ru-RU')} ₽` : 'Не указана'}</p>
                    <p><strong>Местоположение:</strong> {ad.location || 'Не указано'}</p>
                  </div>
                </div>
                
                {/* Кнопки модерации */}
                <div style={moderationActionsStyle}>
                  {/* Кнопка просмотра */}
                  <button 
                    style={viewButtonStyle}
                    onClick={() => handleViewAd(ad)}
                  >
                    <span className="material-symbols-outlined">visibility</span>
                    Просмотреть
                  </button>
                  
                  {/* Кнопка одобрения */}
                  <button 
                    style={approveButtonStyle}
                    onClick={() => approveAd(ad.id)}
                  >
                    <span className="material-symbols-outlined">check</span>
                    Одобрить
                  </button>
                  
                  {/* Кнопка отклонения */}
                  {rejectingAdId === ad.id ? (
                    <div style={rejectFormStyle}>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Укажите причину отклонения объявления..."
                        style={rejectTextareaStyle}
                        rows={3}
                        maxLength={500}
                      />
                      <div style={rejectFormButtonsStyle}>
                        <button 
                          style={cancelButtonStyle}
                          onClick={() => {
                            setRejectingAdId(null);
                            setRejectReason('');
                          }}
                        >
                          Отмена
                        </button>
                        <button 
                          style={rejectConfirmButtonStyle}
                          onClick={() => rejectAd(ad.id, rejectReason)}
                          disabled={!rejectReason.trim()}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      style={rejectButtonStyle}
                      onClick={() => setRejectingAdId(ad.id)}
                    >
                      <span className="material-symbols-outlined">close</span>
                      Отклонить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <span className="material-symbols-outlined" style={emptyIconStyle}>
              check_circle
            </span>
            <h3 style={emptyTitleStyle}>Нет объявлений на модерации</h3>
            <p style={emptyTextStyle}>Все объявления проверены и обработаны</p>
            <button 
              style={refreshEmptyButtonStyle}
              onClick={handleRefresh}
            >
              <span className="material-symbols-outlined" style={{marginRight: 8}}>refresh</span>
              Обновить
            </button>
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
  boxSizing: 'border-box',
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

const contentStyle = {
  flex: 1,
  padding: '16px',
  paddingBottom: '80px'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const adsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const statsStyle = {
  backgroundColor: 'white',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#0d121b',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const adItemStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const adCardWrapperStyle = {
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '12px'
};

const adInfoStyle = {
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  fontSize: '14px'
};

const authorInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
};

const authorAvatarStyle = {
  width: 40,
  height: 40,
  borderRadius: '20px',
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  flexShrink: 0
};

const authorNameStyle = {
  fontSize: '14px',
  color: '#0d121b',
  marginBottom: '4px'
};

const usernameStyle = {
  color: '#46A8C1',
  fontSize: '13px',
  marginLeft: '4px'
};

const authorDetailsStyle = {
  fontSize: '12px',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center'
};

const adDetailsStyle = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #e5e7eb'
};

const moderationActionsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px',
  flexWrap: 'wrap'
};

const viewButtonStyle = {
  flex: 1,
  padding: '12px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minWidth: '140px'
};

const approveButtonStyle = {
  flex: 1,
  padding: '12px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minWidth: '140px'
};

const rejectButtonStyle = {
  flex: 1,
  padding: '12px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minWidth: '140px'
};

const rejectFormStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '300px'
};

const rejectTextareaStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s ease'
};

const rejectFormButtonsStyle = {
  display: 'flex',
  gap: '8px'
};

const cancelButtonStyle = {
  flex: 1,
  padding: '10px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
};

const rejectConfirmButtonStyle = {
  flex: 1,
  padding: '10px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  opacity: 1
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
  color: '#10b981',
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
  marginBottom: '24px'
};

const refreshEmptyButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  *:hover {
    transition: all 0.2s ease;
  }
`;
if (!document.head.querySelector('style[data-moderation-spinner]')) {
  styleSheet.setAttribute('data-moderation-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default ModerationPanel;