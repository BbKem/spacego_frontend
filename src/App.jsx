import { useEffect, useState } from 'react'
import { retrieveLaunchParams, MainButton } from '@telegram-apps/sdk'

function App() {
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    try {
      const lp = retrieveLaunchParams()
      setUser(lp.initDataUnsafe?.user || null)
    } catch (e) {
      // Для локальной разработки
      setUser({ id: 123456789, first_name: 'Test' })
    }
  }, [])

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setStatus('Заполните все поля')
      return
    }

    setStatus('Отправка...')
    try {
      const response = await fetch('https://spacego-backend.onrender.com/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || '',
          title,
          description
        })
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
      <h2>Привет, {user?.first_name || 'друг'}!</h2>

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

      <MainButton text="➕ Добавить объявление" onClick={handleSubmit} />

      {status && <p style={{ marginTop: 15, color: status.includes('✅') ? 'green' : 'red' }}>{status}</p>}
    </div>
  )
}

export default App