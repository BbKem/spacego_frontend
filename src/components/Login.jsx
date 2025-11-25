import { useState } from 'react'
import logo from '../assets/logo.png'

function Login({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const handleLogin = async () => {
    if (!email || !password) return setStatus('Введите email и пароль')
    
    setIsLoading(true)
    setStatus('')
    
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        onLoginSuccess()
      } else {
        setStatus('❌ ' + (data.error || 'Неверные данные'))
      }
    } catch {
      setStatus('❌ Ошибка сети')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div style={authPageStyle}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Вход...</p>
          </div>
        </div>
      )}
      
      <div style={backButtonStyle} onClick={onGoToRegister}>
        <span className="material-symbols-outlined">arrow_back</span>
      </div>
      
      {/* Логотип */}
      <div style={logoContainerStyle}>
        <img src={logo} alt="Spacego" style={logoImageStyle} />
      </div>
    
      <p style={formSubtitleStyle}>Войдите в свой аккаунт Spacego</p>
      
      <div style={formContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Логин или Email</label>
          <div style={inputWrapperStyle}>
            <span style={inputIconStyle} className="material-symbols-outlined">person</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="Введите ваш логин или email"
              type="email"
              maxLength="100"
            />
          </div>
        </div>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Пароль</label>
          <div style={inputWrapperStyle}>
            <span style={inputIconStyle} className="material-symbols-outlined">lock</span>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Введите ваш пароль"
              type={showPassword ? "text" : "password"}
              maxLength="50"
            />
            <button 
              type="button"
              style={eyeButtonStyle} 
              onClick={togglePasswordVisibility}
              className="material-symbols-outlined"
            >
              {showPassword ? "visibility_off" : "visibility"}
            </button>
          </div>
        </div>
        
        <p style={forgotPasswordStyle}>Забыли пароль?</p>
        
        <button 
          onClick={handleLogin} 
          style={primaryButtonStyle}
          disabled={isLoading}
        >
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
        
        <p style={switchText}>
          Нет аккаунта? <button onClick={onGoToRegister} style={linkStyle}>Зарегистрироваться</button>
        </p>
        
        {status && !isLoading && <p style={statusStyle(status)}>{status}</p>}
      </div>
    </div>
  )
}

// Обновленные стили с новой цветовой палитрой
const authPageStyle = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px 20px',
  backgroundColor: '#f6f6f8',
  fontFamily: "'Space Grotesk', sans-serif",
  position: 'relative'
}

const loadingOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
}

const loadingSpinnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px'
}

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

const loadingTextStyle = {
  margin: 0,
  color: '#46A8C1',
  fontSize: '16px',
  fontWeight: '500'
}

const backButtonStyle = {
  alignSelf: 'flex-start',
  width: 48,
  height: 48,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  color: '#46A8C1'
}

const logoContainerStyle = {
  width: 120,
  height: 120,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 32
}

const logoImageStyle = {
  width: 500,
  height: 500,
  objectFit: 'contain'
}

const formSubtitleStyle = {
  fontSize: 16,
  textAlign: 'center',
  color: '#4c669a',
  marginBottom: 32
}

const formContainerStyle = {
  width: '100%',
  maxWidth: 400,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const labelStyle = {
  fontSize: 14,
  fontWeight: '500',
  color: '#0d121b'
}

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  border: '1px solid #cfd7e7',
  borderRadius: 12,
  backgroundColor: '#ffffff',
  transition: 'border-color 0.2s ease'
}

const inputIconStyle = {
  marginLeft: 16,
  color: '#46A8C1',
  fontSize: 20
}

const inputStyle = {
  flex: 1,
  height: 56,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingLeft: 12,
  fontSize: 16,
  color: '#0d121b'
}

const eyeButtonStyle = {
  marginRight: 16,
  color: '#46A8C1',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0
}

const forgotPasswordStyle = {
  textAlign: 'right',
  fontSize: 14,
  color: '#46A8C1',
  textDecoration: 'underline',
  cursor: 'pointer'
}

const primaryButtonStyle = {
  height: 56,
  width: '100%',
  borderRadius: 12,
  backgroundColor: '#46A8C1',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  marginTop: 8,
  transition: 'background-color 0.2s ease'
}

const switchText = {
  fontSize: 14,
  color: '#4c669a',
  textAlign: 'center',
  marginTop: 32
}

const linkStyle = {
  color: '#46A8C1',
  fontWeight: 'bold',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline'
}

const statusStyle = (text) => ({
  marginTop: 12,
  padding: '12px 16px',
  borderRadius: 8,
  backgroundColor: text.includes('✅') ? '#d1fae5' : '#fee2e2',
  color: text.includes('✅') ? '#065f46' : '#b91c1c',
  textAlign: 'center'
})

// Добавляем анимацию спиннера
const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`

// Вставляем стили анимации
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.innerText = spinAnimation
  document.head.appendChild(styleSheet)
}

export default Login