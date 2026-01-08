// frontend/src/components/TelegramInit.jsx
import { useEffect, useState } from 'react';

function TelegramInit({ children, onAuthSuccess }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для извлечения tgWebAppData из URL hash
  const extractTelegramDataFromHash = () => {
    const hash = window.location.hash.substring(1); // Убираем #
    const params = new URLSearchParams(hash);
    
    const tgWebAppData = params.get('tgWebAppData');
    const platform = params.get('tgWebAppPlatform');
    const version = params.get('tgWebAppVersion');
    
    console.log('Extracted from hash:', { tgWebAppData, platform, version });
    
    return { tgWebAppData, platform, version };
  };

  useEffect(() => {
    const initTelegram = async () => {
      try {
        console.log('=== TELEGRAM INIT DEBUG ===');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Пробуем получить данные из URL hash
        const { tgWebAppData, platform, version } = extractTelegramDataFromHash();
        
        if (!tgWebAppData) {
          console.warn('No tgWebAppData found in URL');
          setError('Не удалось получить данные авторизации из Telegram');
          setIsLoading(false);
          return;
        }

        console.log('Telegram data found:', {
          platform,
          version,
          dataLength: tgWebAppData.length
        });

        // Отправляем данные на сервер для проверки и авторизации
        const API_BASE = import.meta.env.DEV 
          ? 'http://localhost:4000' 
          : 'https://spacego-backend.onrender.com';
        
        console.log('Sending auth request to:', API_BASE);
        
        const response = await fetch(`${API_BASE}/api/telegram-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'telegram-init-data': tgWebAppData
          }
        });

        console.log('Auth response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Telegram auth success:', data);
          
          // Сохраняем пользователя в localStorage
          localStorage.setItem('telegram_user', JSON.stringify(data.user));
          localStorage.setItem('telegram_init_data', tgWebAppData);
          
          // Вызываем callback
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
        } else {
          const errorText = await response.text();
          console.error('Telegram auth failed:', errorText);
          setError(`Ошибка авторизации: ${errorText}`);
        }
      } catch (error) {
        console.error('Error initializing Telegram:', error);
        setError(`Ошибка: ${error.message}`);
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
        <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
          URL: {window.location.href.substring(0, 50)}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <h3>Ошибка инициализации Telegram</h3>
        <p style={{ marginBottom: 20 }}>{error}</p>
        <div style={{ textAlign: 'left', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5, marginBottom: 20 }}>
          <small>
            <strong>Debug info:</strong><br/>
            URL: {window.location.href}<br/>
            Hash: {window.location.hash || '(empty)'}
          </small>
        </div>
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
  backgroundColor: '#f6f6f8',
  padding: '20px',
  textAlign: 'center'
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

// Добавляем стили для анимации
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default TelegramInit;