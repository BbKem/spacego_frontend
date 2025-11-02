import { useEffect, useState } from 'react'
import { retrieveLaunchParams } from '@telegram-apps/sdk'

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')

  // Проверка, есть ли токен в localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
      // Можно дополнительно получить данные пользователя, если нужно
    }
  }, [])

  const handleRegister = async () => {
    if (!email || !password) {
      setStatus('Введите email и пароль')
      return
    }

    setStatus('Регистрация...')
    try {
      const response = await fetch('https://spacego-backend.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (response.ok) {
        setStatus('✅ Регистрация успешна! Теперь войдите.')
        setEmail('')
        setPassword('')
      } else {
        setStatus('❌ Ошибка: ' + (data.error || 'сервер'))
      }
    } catch (err) {
      setStatus('❌ Ошибка сети')
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('Введите email и пароль')
      return
    }

    setStatus('Вход...')
    try {
      const response = await fetch('https://spacego-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setIsLoggedIn(true)
        setStatus('✅ Вы вошли!')
        setEmail('')
        setPassword('')
      } else {
        setStatus('❌ Ошибка: ' + (data.error || 'сервер'))
      }
    } catch (err) {
      setStatus('❌ Ошибка сети')
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setStatus('Заполните все поля')
      return
    }

    setStatus('Отправка...')
    try {
      const response = await fetch('https://spacego-backend.onrender.com/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      })

      const data = await response.json()
      if (response.ok) {
        setStatus('✅ Объявление добавлено!')
        setTitle('')
        setDescription('')
      } else {
        setStatus('❌ Ошибка: ' + (data.error || 'сервер'))
      }
    } catch (err) {
      setStatus('❌ Ошибка сети')
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 500 }}>
      {!isLoggedIn ? (
        <>
          <h2>Регистрация / Вход</h2>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            type="password"
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />

          <button
            onClick={handleRegister}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3390ec',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            📝 Зарегистрироваться
          </button>

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔐 Войти
          </button>
        </>
      ) : (
        <>
          <h2>Привет, пользователь!</h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок объявления"
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            rows="5"
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />

          <button
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3390ec',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ➕ Добавить объявление
          </button>
        </>
      )}

      {status && <p style={{ marginTop: 15, color: status.includes('✅') ? 'green' : 'red' }}>{status}</p>}
    </div>
  )
}

export default App