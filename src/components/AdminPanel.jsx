// frontend/src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';

function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'telegram-init-data': initData
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Ошибка загрузки пользователей');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/set-role`, {
        method: 'POST',
        headers: {
          'telegram-init-data': initData,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        // Обновляем локальное состояние
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        alert('Роль обновлена');
      } else {
        alert('Ошибка обновления роли');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка сети');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegram_id?.toString().includes(searchTerm)
  );

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'moderator': return 'Модератор';
      default: return 'Пользователь';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc2626';
      case 'moderator': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Управление пользователями</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle} className="material-symbols-outlined">search</span>
          <input
            placeholder="Поиск пользователей..."
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      <div style={contentStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle}></div>
            <p>Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div style={usersListStyle}>
            {filteredUsers.map(user => (
              <div key={user.id} style={userCardStyle}>
                <div style={userInfoStyle}>
                  <div style={userAvatarStyle}>
                    {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'П'}
                  </div>
                  <div style={userDetailsStyle}>
                    <div style={userNameStyle}>
                      {user.first_name || 'Пользователь'}
                      {user.last_name && ` ${user.last_name}`}
                    </div>
                    <div style={userExtraInfoStyle}>
                      {user.username && <span>@{user.username}</span>}
                      <span style={{color: '#6b7280'}}> • ID: {user.telegram_id}</span>
                      <span style={{color: '#6b7280'}}> • {new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
                
                <div style={roleSectionStyle}>
                  <div style={{
                    ...roleBadgeStyle,
                    backgroundColor: getRoleColor(user.role)
                  }}>
                    {getRoleLabel(user.role)}
                  </div>
                  
                  <div style={roleButtonsStyle}>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      style={roleSelectStyle}
                      disabled={updatingUserId === user.id}
                    >
                      <option value="user">Пользователь</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Админ</option>
                    </select>
                    
                    {updatingUserId === user.id && (
                      <div style={updatingSpinnerStyle}></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <span className="material-symbols-outlined" style={emptyIconStyle}>
              group
            </span>
            <h3 style={emptyTitleStyle}>Пользователи не найдены</h3>
            <p style={emptyTextStyle}>
              {searchTerm ? 'Попробуйте другой поисковый запрос' : 'В системе пока нет пользователей'}
            </p>
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

const searchContainerStyle = {
  padding: '16px',
  backgroundColor: 'white'
};

const searchWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: 12,
  height: 48
};

const searchIconStyle = {
  marginLeft: 12,
  color: '#46A8C1',
  fontSize: 20
};

const searchInputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingLeft: 8,
  fontSize: 16,
  color: '#0d121b'
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

const usersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const userCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
};

const userAvatarStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: 16
};

const userDetailsStyle = {
  flex: 1
};

const userNameStyle = {
  fontSize: 16,
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '4px'
};

const userExtraInfoStyle = {
  fontSize: 12,
  color: '#46A8C1'
};

const roleSectionStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '12px',
  borderTop: '1px solid #f3f4f6'
};

const roleBadgeStyle = {
  padding: '4px 12px',
  borderRadius: '20px',
  color: 'white',
  fontSize: '12px',
  fontWeight: '500'
};

const roleButtonsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const roleSelectStyle = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: 'white',
  fontSize: '14px',
  cursor: 'pointer',
  minWidth: '120px'
};

const updatingSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid #f3f3f3',
  borderTop: '2px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
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
  color: '#e5e7eb',
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
if (!document.head.querySelector('style[data-admin-spinner]')) {
  styleSheet.setAttribute('data-admin-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default AdminPanel;