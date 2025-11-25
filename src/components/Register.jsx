import { useState } from 'react'
import logo from '../assets/logo.png'

function Register({ onRegisterSuccess, onGoToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) return setStatus('Заполните все поля')
    if (password !== confirmPassword) return setStatus('Пароли не совпадают')
    
    setIsLoading(true)
    setStatus('')
    
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('✅ Регистрация успешна!')
        onRegisterSuccess()
      } else {
        setStatus('❌ ' + (data.error || 'Ошибка сервера'))
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <div style={authPageStyle}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Регистрация...</p>
          </div>
        </div>
      )}
      
      <div style={backButtonStyle} onClick={onGoToLogin}>
        <span className="material-symbols-outlined">arrow_back</span>
      </div>
      
      {/* Логотип */}
      <div style={logoContainerStyle}>
        <img src={logo} alt="Spacego" style={logoImageStyle} />
      </div>
      
      <h1 style={formTitleStyle}>Создать аккаунт</h1>
      
      <div style={formContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Ваше имя</label>
          <div style={inputWrapperStyle}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Введите ваше имя"
              maxLength="50"
            />
          </div>
        </div>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Email</label>
          <div style={inputWrapperStyle}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="Введите ваш email"
              type="email"
              maxLength="100"
            />
          </div>
        </div>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Пароль</label>
          <div style={inputWrapperStyle}>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Введите пароль"
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
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Подтвердите пароль</label>
          <div style={inputWrapperStyle}>
            <input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
              placeholder="Повторите ваш пароль"
              type={showConfirmPassword ? "text" : "password"}
              maxLength="50"
            />
            <button 
              type="button"
              style={eyeButtonStyle} 
              onClick={toggleConfirmPasswordVisibility}
              className="material-symbols-outlined"
            >
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleRegister} 
          style={primaryButtonStyle}
          disabled={isLoading}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <p style={switchText}>
          Уже есть аккаунт? <button onClick={onGoToLogin} style={linkStyle}>Войти</button>
        </p>
        
        {status && !isLoading && <p style={statusStyle(status)}>{status}</p>}
      </div>
    </div>
  )
}

// Стили (аналогично Login с обновленными цветами)
const authPageStyle = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
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
  color: '#46A8C1',
  marginBottom: 32
}

const logoContainerStyle = {
  width: 120,
  height: 120,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 32,
  alignSelf: 'center'
}

const logoImageStyle = {
  width: 500,
  height: 500,
  objectFit: 'contain'
}

const formTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: 32,
  textAlign: 'left',
  width: '100%'
}

const formContainerStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 20
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const labelStyle = {
  fontSize: 14,
  fontWeight: '500',
  color: '#0d121b',
  marginBottom: 4
}

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  border: '1px solid #cfd7e7',
  borderRadius: 12,
  backgroundColor: 'white',
  overflow: 'hidden',
  transition: 'border-color 0.2s ease'
}

const inputStyle = {
  flex: 1,
  height: 56,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  padding: '0 16px',
  fontSize: 16,
  color: '#0d121b'
}

const eyeButtonStyle = {
  width: 56,
  height: 56,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#46A8C1',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0
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
  marginTop: 24,
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

export default Register