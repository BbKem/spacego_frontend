import { useState } from 'react'

function Login({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const handleLogin = async () => {
    if (!email || !password) return setStatus('Введите email и пароль')
    setStatus('Вход...')
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
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div style={authPageStyle}>
      <div style={backButtonStyle} onClick={onGoToRegister}>
        <span className="material-symbols-outlined">arrow_back</span>
      </div>
      <div style={logoStyle}>
        <svg style={logoSvgStyle} fill="none" viewBox="0 0 24 24">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" />
          <path d="M2 7L12 12" stroke="white" strokeWidth="2" />
          <path d="M12 22V12" stroke="white" strokeWidth="2" />
          <path d="M22 7L12 12" stroke="white" strokeWidth="2" />
          <path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      <h1 style={formTitleStyle}>С возвращением!</h1>
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
        <button onClick={handleLogin} style={primaryButtonStyle}>Войти</button>
        <p style={switchText}>
          Нет аккаунта? <button onClick={onGoToRegister} style={linkStyle}>Зарегистрироваться</button>
        </p>
        {status && <p style={statusStyle(status)}>{status}</p>}
      </div>
    </div>
  )
}

// Стили остаются без изменений, кроме добавления padding для eyeButtonStyle
const authPageStyle = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px 20px',
  backgroundColor: '#f6f6f8',
  fontFamily: "'Space Grotesk', sans-serif"
}

const backButtonStyle = {
  alignSelf: 'flex-start',
  width: 48,
  height: 48,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer'
}

const logoStyle = {
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: '#135bec',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 32
}

const logoSvgStyle = {
  width: 32,
  height: 32,
  color: 'white'
}

const formTitleStyle = {
  fontSize: 32,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 8,
  color: '#0d121b'
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
  backgroundColor: '#f6f6f8'
}

const inputIconStyle = {
  marginLeft: 16,
  color: '#4c669a',
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
  color: '#4c669a',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0
}

const forgotPasswordStyle = {
  textAlign: 'right',
  fontSize: 14,
  color: '#135bec',
  textDecoration: 'underline',
  cursor: 'pointer'
}

const primaryButtonStyle = {
  height: 56,
  width: '100%',
  borderRadius: 12,
  backgroundColor: '#135bec',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  marginTop: 8
}

const switchText = {
  fontSize: 14,
  color: '#4c669a',
  textAlign: 'center',
  marginTop: 32
}

const linkStyle = {
  color: '#135bec',
  fontWeight: 'bold',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline'
}

const statusStyle = (text) => ({
  marginTop: 12,
  padding: '8px 12px',
  borderRadius: 8,
  backgroundColor: text.includes('✅') ? '#d1fae5' : '#fee2e2',
  color: text.includes('✅') ? '#065f46' : '#b91c1c'
})

export default Login