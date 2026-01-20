// frontend/src/components/BottomNav.jsx
import React from 'react';

function BottomNav({ currentPage, setCurrentPage }) {
  return (
    <div style={bottomNavStyle}>
      <div 
        style={currentPage === 'home' ? navItemActiveStyle : navItemStyle} 
        onClick={() => setCurrentPage('home')}
      >
        <span className="material-symbols-outlined">home</span>
        <span style={navLabelStyle}>Home</span>
      </div>
      <div 
        style={currentPage === 'favorites' ? navItemActiveStyle : navItemStyle} 
        onClick={() => setCurrentPage('favorites')}
      >
        <span className="material-symbols-outlined">favorite</span>
        <span style={navLabelStyle}>Favorites</span>
      </div>
      <div 
        style={currentPage === 'create-ad' ? navItemActiveStyle : navItemStyle} 
        onClick={() => setCurrentPage('create-ad')}
      >
        <span className="material-symbols-outlined">add</span>
        <span style={navLabelStyle}>Sell</span>
      </div>
      <div 
        style={currentPage === 'profile' ? navItemActiveStyle : navItemStyle} 
        onClick={() => setCurrentPage('profile')}
      >
        <span className="material-symbols-outlined">person</span>
        <span style={navLabelStyle}>Profile</span>
      </div>
    </div>
  );
}

// Стили
const bottomNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '80px',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  borderTop: '1px solid #eee',
  backgroundColor: 'white',
  width: '100%',
  boxSizing: 'border-box',
  zIndex: 1000,
  paddingBottom: 'env(safe-area-inset-bottom, 0)' 
}

const navItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  color: '#6b7280',
  fontSize: 10,
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  flex: 1 
}

const navItemActiveStyle = {
  ...navItemStyle,
  color: '#46A8C1'
}

const navLabelStyle = {
  fontSize: 10,
  fontWeight: '500'
}

export default BottomNav; 