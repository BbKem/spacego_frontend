// frontend/src/components/TelegramInit.jsx
import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

function TelegramInit({ children, onAuthSuccess }) {
  const [initData, setInitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        console.log('Starting Telegram initialization...');
        
        // Проверяем наличие Telegram WebApp
        if (!window.Telegram || !window.Telegram.WebApp) {
          console.warn('Telegram WebApp not found in window object');
          setError('Telegram WebApp not found');
          setIsLoading(false);
          return;
        }

        // Получаем данные запуска из Telegram
        const { initDataRaw, initData } = retrieveLaunchParams();
        
        console.log('Telegram initDataRaw:', initDataRaw);
        console.log('Telegram initData:', initData);

        if (!initDataRaw) {
          console.warn('No initDataRaw received from Telegram');
          setError('No authentication data from Telegram');
          setIsLoading(false);
          return;
        }

        setInitData(initDataRaw);
        
        // Отправляем данные на сервер для проверки и авторизации
        const API_BASE = import.meta.env.DEV 
          ? 'http://localhost:4000' 
          : 'https://spacego-backend.onrender.com';
        
        console.log('Sending auth request to:', `${API_BASE}/api/telegram-auth`);
        
        const response = await fetch(`${API_BASE}/api/telegram-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'telegram-init-data': initDataRaw
          }
        });

        console.log('Auth response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Telegram auth success:', data);
          
          // Сохраняем пользователя в localStorage
          localStorage.setItem('telegram_user', JSON.stringify(data.user));
          localStorage.setItem('telegram_init_data', initDataRaw);
          
          // Вызываем callback
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
        } else {
          const errorText = await response.text();
          console.error('Telegram auth failed:', errorText);
          setError(`Auth failed: ${errorText}`);
        }
      } catch (error) {
        console.error('Error initializing Telegram:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegram();
  }, [onAuthSuccess]);

  if (isLoading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p>Инициализация Telegram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <h3>Ошибка инициализации Telegram</h3>
        <p>{error}</p>
        <button 
          style={retryButtonStyle}
          onClick={() => window.location.reload()}
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  return children;
}

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f6f6f8'
};

const errorStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f6f6f8',
  padding: '20px',
  textAlign: 'center'
};

const retryButtonStyle = {
  marginTop: '20px',
  padding: '10px 20px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

export default TelegramInit;