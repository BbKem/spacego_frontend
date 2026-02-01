import React, { useState, useEffect } from 'react';

function UserReviews({ userId, userName }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [userId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const initData = localStorage.getItem('telegram_init_data');
      if (!initData) return;

      const response = await fetch(`${API_BASE}/api/users/${userId}/can-review`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);
      }
    } catch (error) {
      console.error('Ошибка проверки возможности отзыва:', error);
    }
  };

  const handleReviewSuccess = () => {
    fetchReviews();
    checkCanReview();
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className="material-symbols-outlined"
            style={{
              fontSize: size,
              color: star <= rating ? '#f59e0b' : '#e5e7eb'
            }}
          >
            {star <= rating ? 'star' : 'star'}
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (user) => {
    if (user.reviewer_first_name) {
      return user.reviewer_first_name[0].toUpperCase();
    }
    if (user.reviewer_username) {
      return user.reviewer_username[0].toUpperCase();
    }
    return 'П';
  };

  const getName = (user) => {
    if (user.reviewer_first_name && user.reviewer_last_name) {
      return `${user.reviewer_first_name} ${user.reviewer_last_name}`;
    }
    if (user.reviewer_first_name) {
      return user.reviewer_first_name;
    }
    if (user.reviewer_username) {
      return `@${user.reviewer_username}`;
    }
    return 'Пользователь';
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p>Загрузка отзывов...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Заголовок и кнопка отзыва */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>Отзывы</h3>
        {canReview && (
          <button 
            style={leaveReviewButtonStyle}
            onClick={() => setShowReviewModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>rate_review</span>
            Оставить отзыв
          </button>
        )}
      </div>

      {/* Статистика */}
      {stats && stats.total > 0 && (
        <div style={statsStyle}>
          <div style={ratingOverviewStyle}>
            <div style={averageRatingStyle}>{stats.averageRating}</div>
            <div>
              {renderStars(parseFloat(stats.averageRating), 20)}
              <div style={totalReviewsStyle}>
                {stats.total} {stats.total === 1 ? 'отзыв' : 
                              stats.total < 5 ? 'отзыва' : 'отзывов'}
              </div>
            </div>
          </div>

          {/* Распределение оценок */}
          <div style={distributionStyle}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} style={distributionItemStyle}>
                <div style={distributionStarsStyle}>
                  {stars} <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f59e0b' }}>star</span>
                </div>
                <div style={distributionBarStyle}>
                  <div 
                    style={{
                      ...distributionBarFillStyle,
                      width: `${(stats.distribution[stars] / stats.total) * 100}%`
                    }}
                  ></div>
                </div>
                <div style={distributionCountStyle}>
                  {stats.distribution[stars]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список отзывов */}
      {reviews.length > 0 ? (
        <>
          <div style={reviewsListStyle}>
            {displayedReviews.map((review) => (
              <div key={review.id} style={reviewCardStyle}>
                <div style={reviewHeaderStyle}>
                  {/* Аватар автора */}
                  {review.reviewer_photo_url ? (
                    <img 
                      src={review.reviewer_photo_url} 
                      alt="Аватар"
                      style={reviewerAvatarImageStyle}
                    />
                  ) : (
                    <div style={reviewerAvatarStyle}>
                      {getInitials(review)}
                    </div>
                  )}
                  
                  <div style={reviewerInfoStyle}>
                    <div style={reviewerNameStyle}>
                      {getName(review)}
                    </div>
                    <div style={reviewMetaStyle}>
                      {renderStars(review.rating, 14)}
                      <span style={{ margin: '0 8px' }}>•</span>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <div style={commentStyle}>
                    {review.comment}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Кнопка показать все/скрыть */}
          {reviews.length > 3 && (
            <button 
              style={showMoreButtonStyle}
              onClick={() => setShowAll(!showAll)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
                {showAll ? 'expand_less' : 'expand_more'}
              </span>
              {showAll ? 'Скрыть' : `Показать все отзывы (${reviews.length})`}
            </button>
          )}
        </>
      ) : (
        <div style={noReviewsStyle}>
          <span className="material-symbols-outlined" style={noReviewsIconStyle}>
            rate_review
          </span>
          <h4 style={noReviewsTitleStyle}>Нет отзывов</h4>
          <p style={noReviewsTextStyle}>
            У этого пользователя пока нет отзывов.
            {canReview && ' Будьте первым, кто оставит отзыв!'}
          </p>
        </div>
      )}

      {/* Модальное окно отзыва */}
      {showReviewModal && (
        <ReviewModal
          user={JSON.parse(localStorage.getItem('telegram_user'))}
          revieweeId={userId}
          revieweeName={userName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}

// Стили
const containerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const titleStyle = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0d121b'
};

const leaveReviewButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease'
};

const statsStyle = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px'
};

const ratingOverviewStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px'
};

const averageRatingStyle = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#0d121b'
};

const totalReviewsStyle = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px'
};

const distributionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const distributionItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const distributionStarsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  fontSize: '12px',
  color: '#374151',
  minWidth: '40px'
};

const distributionBarStyle = {
  flex: 1,
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '3px',
  overflow: 'hidden'
};

const distributionBarFillStyle = {
  height: '100%',
  backgroundColor: '#f59e0b',
  borderRadius: '3px',
  transition: 'width 0.3s ease'
};

const distributionCountStyle = {
  fontSize: '12px',
  color: '#6b7280',
  minWidth: '20px',
  textAlign: 'right'
};

const reviewsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const reviewCardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px'
};

const reviewHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
};

const reviewerAvatarStyle = {
  width: '40px',
  height: '40px',
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

const reviewerAvatarImageStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '20px',
  objectFit: 'cover'
};

const reviewerInfoStyle = {
  flex: 1
};

const reviewerNameStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '4px'
};

const reviewMetaStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '12px',
  color: '#6b7280'
};

const commentStyle = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: 1.5,
  paddingTop: '12px',
  borderTop: '1px solid #f3f4f6'
};

const showMoreButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'transparent',
  color: '#46A8C1',
  border: '1px solid #46A8C1',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '12px',
  transition: 'all 0.2s ease'
};

const noReviewsStyle = {
  textAlign: 'center',
  padding: '40px 20px'
};

const noReviewsIconStyle = {
  fontSize: '48px',
  color: '#e5e7eb',
  marginBottom: '16px'
};

const noReviewsTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '8px'
};

const noReviewsTextStyle = {
  fontSize: '14px',
  color: '#6b7280',
  maxWidth: '300px',
  margin: '0 auto'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px'
};

const spinnerStyle = {
  width: '30px',
  height: '30px',
  border: '3px solid #f3f3f3',
  borderTop: '3px solid #46A8C1',
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
if (!document.head.querySelector('style[data-user-reviews-spinner]')) {
  styleSheet.setAttribute('data-user-reviews-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default UserReviews;