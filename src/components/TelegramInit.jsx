// frontend/src/components/TelegramInit.jsx
import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

function TelegramInit({ children, onAuthSuccess }) {
  const [initData, setInitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для отправки логов на бэкенд
  const sendLog = async (level, message, data = {}) => {
    try {
      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:4000' 
        : 'https://spacego-backend.onrender.com';
      
      await fetch(`${API_BASE}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data: {
            ...data,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error('Failed to send log:', e);
    }
  };

  useEffect(() => {
    const initTelegram = async () => {
      try {
        await sendLog('info', 'TelegramInit started');
        
        // Проверяем наличие Telegram WebApp
        if (!window.Telegram || !window.Telegram.WebApp) {
          const errorMsg = 'Telegram WebApp not found in window object';
          await sendLog('warn', errorMsg, {
            windowTelegram: !!window.Telegram,
            TelegramWebApp: !!window.Telegram?.WebApp
          });
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        // Инициализируем Telegram WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        await sendLog('info', 'Telegram WebApp initialized', {
          platform: window.Telegram.WebApp.platform,
          version: window.Telegram.WebApp.version
        });

        // Получаем данные запуска из Telegram
        const { initDataRaw, initData } = retrieveLaunchParams();
        
        await sendLog('info', 'Retrieved launch params', {
          hasInitDataRaw: !!initDataRaw,
          hasInitData: !!initData
        });

        if (!initDataRaw) {
          const errorMsg = 'No initDataRaw received from Telegram';
          await sendLog('error', errorMsg);
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        setInitData(initDataRaw);
        
        // Отправляем данные на сервер для проверки и авторизации
        const API_BASE = import.meta.env.DEV 
          ? 'http://localhost:4000' 
          : 'https://spacego-backend.onrender.com';
        
        await sendLog('info', 'Sending auth request', {
          apiBase: API_BASE,
          initDataLength: initDataRaw.length
        });
        
        const response = await fetch(`${API_BASE}/api/telegram-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'telegram-init-data': initDataRaw
          }
        });

        await sendLog('info', 'Auth response received', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.ok) {
          const data = await response.json();
          await sendLog('info', 'Telegram auth success', {
            userId: data.user?.id,
            username: data.user?.username
          });
          
          // Сохраняем пользователя в localStorage
          localStorage.setItem('telegram_user', JSON.stringify(data.user));
          localStorage.setItem('telegram_init_data', initDataRaw);
          
          // Вызываем callback
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
        } else {
          const errorText = await response.text();
          await sendLog('error', 'Telegram auth failed', {
            status: response.status,
            errorText
          });
          setError(`Auth failed: ${errorText}`);
        }
      } catch (error) {
        await sendLog('error', 'Error initializing Telegram', {
          errorMessage: error.message,
          errorStack: error.stack
        });
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