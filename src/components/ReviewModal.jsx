import React, { useState } from 'react';

function ReviewModal({ user, revieweeId, revieweeName, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Отзыв должен содержать минимум 5 символов');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'telegram-init-data': initData
        },
        body: JSON.stringify({
          revieweeId: revieweeId,
          rating: rating,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess(data.review);
        }
        onClose();
      } else {
        setError(data.error || 'Ошибка отправки отзыва');
      }
    } catch (error) {
      console.error('Ошибка отправки отзыва:', error);
      setError('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        style={starButtonStyle}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 40,
            color: star <= (hoverRating || rating) ? '#f59e0b' : '#e5e7eb',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
        >
          star
        </span>
      </button>
    ));
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Оставить отзыв</h3>
          <button onClick={onClose} style={closeButtonStyle}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={revieweeInfoStyle}>
          <div style={avatarStyle}>
            {revieweeName?.[0]?.toUpperCase() || 'П'}
          </div>
          <div>
            <div style={revieweeNameStyle}>{revieweeName}</div>
            <div style={revieweeHintStyle}>Пользователь</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Рейтинг */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Ваша оценка</label>
            <div style={starsContainerStyle}>
              {renderStars()}
            </div>
            <div style={ratingHintStyle}>
              {rating === 0 ? 'Нажмите на звезду' : 
               rating === 1 ? 'Ужасно' :
               rating === 2 ? 'Плохо' :
               rating === 3 ? 'Нормально' :
               rating === 4 ? 'Хорошо' : 'Отлично'}
            </div>
          </div>

          {/* Комментарий */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              Комментарий <span style={requiredStyle}>*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте общения с пользователем..."
              style={textareaStyle}
              rows={4}
              maxLength={500}
              required
            />
            <div style={charCounterStyle}>
              {comment.length}/500 символов
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div style={errorStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 8 }}>error</span>
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div style={buttonsStyle}>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={submitButtonStyle}
              disabled={isSubmitting || rating === 0 || comment.trim().length < 5}
            >
              {isSubmitting ? (
                <>
                  <div style={smallSpinnerStyle}></div>
                  Отправка...
                </>
              ) : (
                'Отправить отзыв'
              )}
            </button>
          </div>
        </form>

        <div style={hintStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#6b7280' }}>info</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Ваш отзыв будет виден всем пользователям
          </span>
        </div>
      </div>
    </div>
  );
}

// Стили
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2000,
  padding: '16px'
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  backgroundColor: 'white',
  zIndex: 1
};

const titleStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0d121b'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '16px',
  transition: 'background-color 0.2s ease'
};

const revieweeInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '20px 24px',
  backgroundColor: '#f9f9f9',
  margin: '0 24px',
  borderRadius: '12px',
  marginTop: '16px'
};

const avatarStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '18px',
  flexShrink: 0
};

const revieweeNameStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '2px'
};

const revieweeHintStyle = {
  fontSize: '14px',
  color: '#6b7280'
};

const formStyle = {
  padding: '24px'
};

const sectionStyle = {
  marginBottom: '24px'
};

const labelStyle = {
  display: 'block',
  fontSize: '16px',
  fontWeight: '500',
  color: '#0d121b',
  marginBottom: '12px'
};

const requiredStyle = {
  color: '#ef4444'
};

const starsContainerStyle = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  marginBottom: '8px'
};

const starButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const ratingHintStyle = {
  textAlign: 'center',
  fontSize: '14px',
  color: '#46A8C1',
  fontWeight: '500',
  marginTop: '8px'
};

const textareaStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box'
};

const charCounterStyle = {
  textAlign: 'right',
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: '4px'
};

const errorStyle = {
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '14px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center'
};

const buttonsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px'
};

const cancelButtonStyle = {
  flex: 1,
  padding: '14px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
};

const submitButtonStyle = {
  flex: 1,
  padding: '14px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'background-color 0.2s ease',
  opacity: 1
};

const smallSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const hintStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center',
  padding: '16px 24px',
  borderTop: '1px solid #eee',
  backgroundColor: '#f9f9f9',
  borderBottomLeftRadius: '16px',
  borderBottomRightRadius: '16px'
};

// Добавляем анимацию
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-review-spinner]')) {
  styleSheet.setAttribute('data-review-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default ReviewModal;