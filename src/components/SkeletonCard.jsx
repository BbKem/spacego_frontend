// frontend/src/components/SkeletonCard.jsx
import React from 'react';

function SkeletonCard() {
  return (
    <div style={skeletonCardStyle}>
      <div style={skeletonImageStyle}></div>
      <div style={skeletonTextStyle}></div>
      <div style={skeletonTextShortStyle}></div>
    </div>
  );
}

// Стили для скелетона (взяты из старого Home.jsx)
const skeletonCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  backgroundColor: 'white',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  animation: 'pulse 1.5s ease-in-out infinite'
};

const skeletonImageStyle = {
  width: '100%',
  height: '158px', // Высота, как у обычного фото
  backgroundColor: '#e5e7eb',
  borderRadius: '12px 12px 0 0'
};

const skeletonTextStyle = {
  height: '16px',
  backgroundColor: '#e5e7eb',
  borderRadius: 4,
  margin: '0 12px',
  marginBottom: '4px'
};

const skeletonTextShortStyle = {
  height: '12px',
  backgroundColor: '#e5e7eb',
  borderRadius: 4,
  margin: '0 12px',
  marginBottom: '8px',
  width: '60%'
};

// Анимация для скелетона
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default SkeletonCard;