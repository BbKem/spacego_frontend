import { useState, useEffect, useRef } from 'react'

function CreateAd({ onBack, onAdCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    condition: 'new'
  })
  const [photo, setPhoto] = useState(null)
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
    const file = event.target.files[0]
    if (!file) return

    // Проверка размера файла
    if (file.size > 2 * 1024 * 1024) {
      setStatus('❌ Файл слишком большой. Максимум 2MB.')
      return
    }

    // Создаем preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhoto({
        file: file,
        preview: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    const { title, description, price, categoryId, condition } = formData
    
    if (!title || !description || !price || !categoryId) {
      return setStatus('Заполните все обязательные поля')
    }

    if (price <= 0) {
      return setStatus('Цена должна быть больше 0')
    }

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

      // Добавляем фото если есть
      if (photo && photo.file) {
        formDataToSend.append('photo', photo.file)
      }

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
            {photo ? (
              <div style={photoPreviewStyle}>
                <img 
                  src={photo.preview} 
                  alt="Preview"
                  style={photoImageStyle}
                />
                <button 
                  onClick={removePhoto}
                  style={removePhotoButtonStyle}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
                <div style={photoInfoStyle}>
                  <span style={{ fontSize: 12 }}>📷 {photo.name}</span>
                </div>
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
                <p style={photoHintStyle}>Максимум 2MB</p>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Listing Details */}
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

        {/* Category */}
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

        {/* Price and Condition */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Цена (₽) *</label>
          <div style={priceInputWrapper}>
            <span className="material-symbols-outlined" style={currencyIconStyle}>currency_ruble</span>
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

        {/* Status */}
        {status && (
          <div style={statusStyle(status)}>
            {status}
          </div>
        )}
      </div>

      {/* Footer Button */}
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

// Стили
const pageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee'
}

const iconButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer'
}

const titleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b'
}

const contentStyle = {
  flex: 1,
  padding: '16px',
  paddingBottom: 100
}

const sectionStyle = {
  marginBottom: 24
}

const photoSectionStyle = {
  border: '2px dashed #e5e7eb',
  borderRadius: 12,
  backgroundColor: 'rgba(255,255,255,0.5)',
  overflow: 'hidden'
}

const photoPreviewStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1',
  backgroundColor: '#f9fafb'
}

const photoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const removePhotoButtonStyle = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer'
}

const photoInfoStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  padding: '8px',
  fontSize: 12,
  textAlign: 'center'
}

const photoPlaceholderStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: '40px 20px',
  textAlign: 'center',
  cursor: 'pointer'
}

const photoTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  margin: 0
}

const photoSubtitleStyle = {
  fontSize: 14,
  color: '#6b7280',
  margin: 0,
  maxWidth: 300
}

const photoHintStyle = {
  fontSize: 12,
  color: '#9ca3af',
  margin: 0
}

const addPhotoButtonStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#135bec',
  color: 'white',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer'
}

const labelStyle = {
  display: 'block',
  fontSize: 16,
  fontWeight: '500',
  color: '#0d121b',
  marginBottom: 8
}

const inputStyle = {
  width: '100%',
  height: 56,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '0 16px',
  fontSize: 16,
  backgroundColor: 'white',
  outline: 'none',
  marginBottom: 16,
  boxSizing: 'border-box'
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer'
}

const priceInputWrapper = {
  position: 'relative',
  marginBottom: 16
}

const currencyIconStyle = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#6b7280',
  zIndex: 1
}

const conditionButtonsStyle = {
  display: 'flex',
  gap: 12
}

const conditionButtonStyle = {
  flex: 1,
  height: 48,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  backgroundColor: 'white',
  fontSize: 16,
  cursor: 'pointer',
  color: '#6b7280'
}

const conditionButtonActiveStyle = {
  ...conditionButtonStyle,
  backgroundColor: '#135bec',
  color: 'white',
  borderColor: '#135bec'
}

const footerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '16px',
  backgroundColor: 'white',
  borderTop: '1px solid #eee'
}

const publishButtonStyle = {
  width: '100%',
  height: 56,
  backgroundColor: '#135bec',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 'bold',
  cursor: 'pointer'
}

const statusStyle = (text) => ({
  padding: '12px 16px',
  borderRadius: 8,
  backgroundColor: text.includes('✅') ? '#d1fae5' : '#fee2e2',
  color: text.includes('✅') ? '#065f46' : '#b91c1c',
  textAlign: 'center',
  marginTop: 16
})

export default CreateAd