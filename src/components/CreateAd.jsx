import { useState, useEffect, useRef } from 'react'

function CreateAd({ onBack, onAdCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    condition: 'new'
  })
  const [photos, setPhotos] = useState([]) // массив фото
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef(null)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Ошибка загрузки категорий')
    }
  }

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Ограничение: максимум 10 фото
    if (photos.length + files.length > 10) {
      setStatus(`❌ Максимум 10 фото. Уже выбрано ${photos.length}, можно добавить ещё ${10 - photos.length}`)
      return
    }

    const newPhotos = []
    const promises = []

    for (let file of files) {
      if (file.size > 500 * 1024) {
        setStatus(`❌ Фото "${file.name}" слишком большое. Максимум 500KB.`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        setStatus(`❌ "${file.name}" не является изображением`)
        continue
      }

      const reader = new FileReader()
      const promise = new Promise((resolve) => {
        reader.onload = (e) => {
          newPhotos.push({
            file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          })
          resolve()
        }
        reader.onerror = () => resolve()
        reader.readAsDataURL(file)
      })
      promises.push(promise)
    }

    Promise.all(promises).then(() => {
      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos])
        setStatus(`✅ Добавлено ${newPhotos.length} фото`)
      }
    })
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const { title, description, price, categoryId, condition } = formData
    
    if (!title || !description || !price || !categoryId) {
      return setStatus('Заполните все обязательные поля')
    }
    if (price <= 0) return setStatus('Цена должна быть больше 0')
    if (photos.length === 0) return setStatus('Добавьте хотя бы одно фото')

    setStatus('Публикация...')
    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      
      formDataToSend.append('title', title)
      formDataToSend.append('description', description)
      formDataToSend.append('price', price)
      formDataToSend.append('categoryId', categoryId)
      formDataToSend.append('condition', condition)

      // Добавляем все фото
      photos.forEach(photo => {
        formDataToSend.append('photos', photo.file)
      })

      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('✅ Объявление успешно создано!')
        setTimeout(() => {
          onAdCreated && onAdCreated(data.ad)
          onBack()
        }, 1500)
      } else {
        setStatus(`❌ ${data.error || 'Ошибка публикации'}`)
      }
    } catch (err) {
      setStatus('❌ Ошибка сети')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={iconButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Новое объявление</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Photos Section */}
        <div style={sectionStyle}>
          <div style={photoSectionStyle}>
            {photos.length > 0 ? (
              <div style={photosGridStyle}>
                {photos.map((photo, index) => (
                  <div key={index} style={photoItemStyle}>
                    <img 
                      src={photo.preview} 
                      alt={`Preview ${index + 1}`}
                      style={photoImageSmallStyle}
                    />
                    <button 
                      onClick={() => removePhoto(index)}
                      style={removePhotoButtonSmallStyle}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                    <div style={photoCounterStyle}>
                      {index + 1}
                    </div>
                  </div>
                ))}
                {photos.length < 10 && (
                  <div 
                    style={addMorePhotoStyle}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
                    <span style={{ fontSize: 12 }}>+ ещё</span>
                  </div>
                )}
              </div>
            ) : (
              <div 
                style={photoPlaceholderStyle}
                onClick={() => fileInputRef.current?.click()}
              >
                <p style={photoTitleStyle}>Добавьте фото</p>
                <p style={photoSubtitleStyle}>Первое фото будет обложкой объявления</p>
                <button style={addPhotoButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
                </button>
                <p style={photoHintStyle}>Можно до 10 фото, максимум 500KB каждое</p>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple // ← разрешаем несколько файлов
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* остальные поля — без изменений */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Название *</label>
          <input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={inputStyle}
            placeholder="Что вы продаете?"
          />

          <label style={labelStyle}>Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ ...inputStyle, height: 120, resize: 'vertical' }}
            placeholder="Опишите товар в деталях"
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Категория *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            style={selectStyle}
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Цена (₽) *</label>
          <div style={priceInputWrapper}>
            <input
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              style={{ ...inputStyle, paddingLeft: 40 }}
              placeholder="0"
              type="number"
              min="0"
            />
          </div>

          <label style={labelStyle}>Состояние *</label>
          <div style={conditionButtonsStyle}>
            <button
              type="button"
              onClick={() => handleChange('condition', 'new')}
              style={formData.condition === 'new' ? conditionButtonActiveStyle : conditionButtonStyle}
            >
              Новое
            </button>
            <button
              type="button"
              onClick={() => handleChange('condition', 'used')}
              style={formData.condition === 'used' ? conditionButtonActiveStyle : conditionButtonStyle}
            >
              Б/у
            </button>
          </div>
        </div>

        {status && (
          <div style={statusStyle(status)}>
            {status}
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <button 
          onClick={handleSubmit} 
          style={{
            ...publishButtonStyle,
            opacity: uploading ? 0.7 : 1
          }}
          disabled={uploading}
        >
          {uploading ? 'Публикация...' : 'Опубликовать'}
        </button>
      </div>
    </div>
  )
}

// === НОВЫЕ СТИЛИ ДЛЯ ФОТО ===
const photosGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8,
  padding: 8
}

const photoItemStyle = {
  position: 'relative',
  aspectRatio: '1'
}

const photoImageSmallStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 4
}

const removePhotoButtonSmallStyle = {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 12,
  cursor: 'pointer'
}

const photoCounterStyle = {
  position: 'absolute',
  bottom: 2,
  left: 2,
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  fontSize: 10,
  padding: '2px 4px',
  borderRadius: 4
}

const addMorePhotoStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  aspectRatio: '1',
  border: '2px dashed #135bec',
  borderRadius: 4,
  backgroundColor: 'rgba(19, 91, 236, 0.05)',
  cursor: 'pointer'
}

// === ОСТАЛЬНЫЕ СТИЛИ БЕЗ ИЗМЕНЕНИЙ ===
const pageStyle = { backgroundColor: '#f6f6f8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #eee' }
const iconButtonStyle = { width: 40, height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }
const titleStyle = { fontSize: 18, fontWeight: 'bold', color: '#0d121b' }
const contentStyle = { flex: 1, padding: '16px', paddingBottom: 100 }
const sectionStyle = { marginBottom: 24 }
const photoSectionStyle = { border: '2px dashed #e5e7eb', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' }
const photoPlaceholderStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }
const photoTitleStyle = { fontSize: 18, fontWeight: 'bold', color: '#0d121b', margin: 0 }
const photoSubtitleStyle = { fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 300 }
const photoHintStyle = { fontSize: 12, color: '#9ca3af', margin: 0 }
const addPhotoButtonStyle = { width: 48, height: 48, borderRadius: 24, backgroundColor: '#135bec', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }
const labelStyle = { display: 'block', fontSize: 16, fontWeight: '500', color: '#0d121b', marginBottom: 8 }
const inputStyle = { width: '100%', height: 56, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 16px', fontSize: 16, backgroundColor: 'white', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }
const selectStyle = { ...inputStyle, cursor: 'pointer' }
const priceInputWrapper = { position: 'relative', marginBottom: 16 }
const conditionButtonsStyle = { display: 'flex', gap: 12 }
const conditionButtonStyle = { flex: 1, height: 48, border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: 'white', fontSize: 16, cursor: 'pointer', color: '#6b7280' }
const conditionButtonActiveStyle = { ...conditionButtonStyle, backgroundColor: '#135bec', color: 'white', borderColor: '#135bec' }
const footerStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', backgroundColor: 'white', borderTop: '1px solid #eee' }
const publishButtonStyle = { width: '100%', height: 56, backgroundColor: '#135bec', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }
const statusStyle = (text) => ({ padding: '12px 16px', borderRadius: 8, backgroundColor: text.includes('✅') ? '#d1fae5' : '#fee2e2', color: text.includes('✅') ? '#065f46' : '#b91c1c', textAlign: 'center', marginTop: 16 })

export default CreateAd