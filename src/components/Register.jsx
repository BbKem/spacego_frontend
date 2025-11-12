import { useState } from 'react'

function Register({ onRegisterSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) return setStatus('Заполните все поля')
    if (password !== confirmPassword) return setStatus('Пароли не совпадают')
    setStatus('Регистрация...')
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
    }
  }

  return (
    <div style={authPageStyle}>
      <div style={backButtonStyle} onClick={onRegisterSuccess}>
        <span className="material-symbols-outlined">arrow_back</span>
      </div>
      <h1 style={{ ...formTitleStyle, textAlign: 'left', width: '100%', marginBottom: 32 }}>Создать аккаунт</h1>
      <div style={formContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Ваше имя</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...inputStyle, height: 56, borderRadius: 12, border: '1px solid #d1d5db' }}
            placeholder="Введите ваше имя"
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputStyle, height: 56, borderRadius: 12, border: '1px solid #d1d5db' }}
            placeholder="Введите ваш email"
            type="email"
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Пароль</label>
          <div style={{ ...inputWrapperStyle, border: '1px solid #d1d5db' }}>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, height: 56, borderRadius: '12px 0 0 12px', borderRight: 'none' }}
              placeholder="Введите пароль"
              type="password"
            />
            <button style={{ ...eyeButtonStyle, borderRadius: '0 12px 12px 0' }} className="material-symbols-outlined">visibility_off</button>
          </div>
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Подтвердите пароль</label>
          <div style={{ ...inputWrapperStyle, border: '1px solid #d1d5db' }}>
            <input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ ...inputStyle, height: 56, borderRadius: '12px 0 0 12px', borderRight: 'none' }}
              placeholder="Повторите ваш пароль"
              type="password"
            />
            <button style={{ ...eyeButtonStyle, borderRadius: '0 12px 12px 0' }} className="material-symbols-outlined">visibility_off</button>
          </div>
        </div>
        <button onClick={handleRegister} style={{ ...primaryButtonStyle, marginTop: 24 }}>
          Зарегистрироваться
        </button>
        <p style={switchText}>
          Уже есть аккаунт? <button onClick={onRegisterSuccess} style={linkStyle}>Войти</button>
        </p>
        {status && <p style={statusStyle(status)}>{status}</p>}
      </div>
    </div>
  )
}

// Стили — те же, что в Login.jsx (скопируй их вниз)
const authPageStyle = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
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

const formTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: 8
}

const formContainerStyle = {
  width: '100%',
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
  fontSize: 16,
  fontWeight: '500',
  color: '#0d121b'
}

const inputStyle = {
  width: '100%',
  padding: '0 16px',
  fontSize: 16,
  color: '#0d121b',
  outline: 'none'
}

const inputWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'white'
}

const eyeButtonStyle = {
  width: 56,
  height: 56,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#6b7280',
  background: 'none',
  border: 'none',
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
  cursor: 'pointer'
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

export default Register