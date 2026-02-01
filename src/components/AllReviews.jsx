// frontend/src/components/AllReviews.jsx
import React, { useState, useEffect } from 'react';

function AllReviews({ userId, userName, onBack }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchAllReviews();
  }, [currentPage]);

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * reviewsPerPage;
      const response = await fetch(
        `${API_BASE}/api/users/${userId}/reviews?limit=${reviewsPerPage}&offset=${offset}`
      );
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

  const totalPages = Math.ceil((stats?.total || 0) / reviewsPerPage);

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Отзывы о {userName}</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Статистика */}
      {stats && stats.total > 0 && (
        <div style={statsContainerStyle}>
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
        </div>
      )}

      {/* Список отзывов */}
      <div style={contentStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle}></div>
            <p>Загрузка отзывов...</p>
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div style={reviewsListStyle}>
              {reviews.map((review) => (
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

            {/* Пагинация */}
            {totalPages > 1 && (
              <div style={paginationStyle}>
                <button 
                  style={paginationButtonStyle}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Назад
                </button>
                <span style={pageInfoStyle}>
                  Страница {currentPage} из {totalPages}
                </span>
                <button 
                  style={paginationButtonStyle}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={noReviewsStyle}>
            <span className="material-symbols-outlined" style={noReviewsIconStyle}>
              rate_review
            </span>
            <h3 style={noReviewsTitleStyle}>Нет отзывов</h3>
            <p style={noReviewsTextStyle}>
              У этого пользователя пока нет отзывов.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Стили (аналогичные стилям из UserReviews.jsx, адаптированные для полной страницы)
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
  boxSizing: 'border-box' 
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

const statsContainerStyle = {
  backgroundColor: 'white',
  padding: '20px 16px',
  marginBottom: '12px',
  borderBottom: '1px solid #eee'
};

const ratingOverviewStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
};

const averageRatingStyle = {
  fontSize: '40px',
  fontWeight: 'bold',
  color: '#0d121b'
};

const totalReviewsStyle = {
  fontSize: '16px',
  color: '#6b7280',
  marginTop: '8px'
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
  padding: '60px 20px'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const reviewsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const reviewCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
};

const reviewHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '16px'
};

const reviewerAvatarStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '20px',
  flexShrink: 0
};

const reviewerAvatarImageStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  objectFit: 'cover'
};

const reviewerInfoStyle = {
  flex: 1
};

const reviewerNameStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '6px'
};

const reviewMetaStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  color: '#6b7280'
};

const commentStyle = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: 1.6,
  paddingTop: '16px',
  borderTop: '1px solid #f3f4f6'
};

const paginationStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '20px',
  marginTop: '32px',
  padding: '20px 0'
};

const paginationButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
};

const pageInfoStyle = {
  fontSize: '14px',
  color: '#6b7280'
};

const noReviewsStyle = {
  textAlign: 'center',
  padding: '60px 20px'
};

const noReviewsIconStyle = {
  fontSize: '64px',
  color: '#e5e7eb',
  marginBottom: '16px'
};

const noReviewsTitleStyle = {
  fontSize: '18px',
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

// Анимация спиннера
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-all-reviews-spinner]')) {
  styleSheet.setAttribute('data-all-reviews-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default AllReviews;