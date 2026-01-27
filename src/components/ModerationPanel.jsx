// frontend/src/components/ModerationPanel.jsx
import React, { useState, useEffect } from 'react';
import AdCard from './AdCard';

function ModerationPanel({ onBack }) {
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingAdId, setRejectingAdId] = useState(null);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchPendingAds();
  }, []);

  const fetchPendingAds = async () => {
    setLoading(true);
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
    }
  };

  const approveAd = async (adId) => {
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
        alert('Объявление одобрено');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка одобрения');
    }
  };

  const rejectAd = async (adId, reason) => {
    if (!reason.trim()) {
      alert('Укажите причину отклонения');
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
        alert('Объявление отклонено');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка отклонения');
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
        <div style={{ width: 40 }}></div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle}></div>
            <p>Загрузка...</p>
          </div>
        ) : pendingAds.length > 0 ? (
          <div style={adsListStyle}>
            {pendingAds.map(ad => (
              <div key={ad.id} style={adItemStyle}>
                <AdCard ad={ad} onClick={() => {}} />
                
                <div style={adInfoStyle}>
                  <p><strong>Автор:</strong> {ad.user_first_name} (@{ad.user_username})</p>
                  <p><strong>Категория:</strong> {ad.category_name}</p>
                  <p><strong>Создано:</strong> {new Date(ad.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                
                <div style={moderationActionsStyle}>
                  <button 
                    style={approveButtonStyle}
                    onClick={() => approveAd(ad.id)}
                  >
                    <span className="material-symbols-outlined">check</span>
                    Одобрить
                  </button>
                  
                  {rejectingAdId === ad.id ? (
                    <div style={rejectFormStyle}>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Причина отклонения..."
                        style={rejectTextareaStyle}
                        rows={3}
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
            <p style={emptyTextStyle}>Все объявления проверены</p>
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

const adItemStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const adInfoStyle = {
  marginTop: '12px',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  fontSize: '14px'
};

const moderationActionsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px'
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
  gap: '8px'
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
  gap: '8px'
};

const rejectFormStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const rejectTextareaStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical'
};

const rejectFormButtonsStyle = {
  display: 'flex',
  gap: '8px'
};

const cancelButtonStyle = {
  flex: 1,
  padding: '8px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer'
};

const rejectConfirmButtonStyle = {
  flex: 1,
  padding: '8px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
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
  maxWidth: '300px'
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-moderation-spinner]')) {
  styleSheet.setAttribute('data-moderation-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default ModerationPanel;