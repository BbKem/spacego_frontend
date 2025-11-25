import { useState, useEffect, useRef, useCallback } from 'react'

function CreateAd({ onBack, onAdCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    condition: 'new',
    location: ''
  })
  const [photos, setPhotos] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  const fileInputRef = useRef(null)
  const locationInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceRef = useRef(null)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  useEffect(() => {
    loadCategories()
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
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

  const handleClickOutside = (event) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current && !locationInputRef.current.contains(event.target)) {
      setShowSuggestions(false)
    }
  }

  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&accept-language=ru`
      )
      const data = await response.json()
      
      const suggestions = data.map(item => ({
        display_name: item.display_name,
        address: item.address,
        lat: item.lat,
        lon: item.lon
      }))
      
      setAddressSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
      setAddressSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  const handleLocationInput = (value) => {
    handleChange('location', value)
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      searchAddress(value)
    }, 500)
  }

  const formatAddressFromOSM = (suggestion) => {
    if (!suggestion.address) return suggestion.display_name;
    
    const { address } = suggestion;
    const parts = [];
    
    if (address.house_number) {
      parts.push(`д. ${address.house_number}`);
    } else if (address.house) {
      parts.push(`д. ${address.house}`);
    }
    
    if (address.road) parts.push(`ул. ${address.road}`);
    if (address.street) parts.push(`ул. ${address.street}`);
    
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);
    else if (address.municipality) parts.push(address.municipality);
    
    if (address.country) parts.push(address.country);
    
    if (parts.length === 0) {
      return extractAddressFromDisplayName(suggestion.display_name);
    }
    
    return parts.join(', ');
  }

  const extractAddressFromDisplayName = (displayName) => {
    const parts = displayName.split(', ');
    const firstPart = parts[0];
    if (firstPart && firstPart.match(/\d/)) {
      const houseMatch = firstPart.match(/(\d+[a-zA-Zа-яА-Я]?)/);
      if (houseMatch) {
        parts[0] = `д. ${houseMatch[1]}`;
      }
    }
    
    const relevantParts = parts.slice(0, 4);
    return relevantParts.join(', ');
  }

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setStatus('Определяем ваше местоположение...')

    if (!navigator.geolocation) {
      setStatus('Геолокация не поддерживается вашим браузером')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=ru`
          )
          const data = await response.json()
          
          if (data.address) {
            const formattedAddress = formatAddressFromOSM(data)
            if (formattedAddress) {
              handleChange('location', formattedAddress)
              setStatus('✅ Местоположение определено!')
            } else {
              setStatus('Не удалось определить точный адрес')
            }
          } else {
            setStatus('Не удалось определить адрес')
          }
        } catch (error) {
          console.error('Ошибка получения адреса:', error)
          setStatus('Ошибка определения адреса')
        }
        setGettingLocation(false)
      },
      (error) => {
        console.error('Ошибка геолокации:', error)
        let errorMessage = 'Не удалось определить местоположение'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна'
            break
          case error.TIMEOUT:
            errorMessage = 'Время ожидания геолокации истекло'
            break
        }
        
        setStatus(`❌ ${errorMessage}`)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }

  const handleAddressSelect = (suggestion) => {
    const formattedAddress = formatAddressFromOSM(suggestion)
    handleChange('location', formattedAddress)
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  const renderSuggestion = (suggestion) => {
    return formatAddressFromOSM(suggestion) || suggestion.display_name;
  }

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

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
    const { title, description, price, categoryId, condition, location } = formData
    
    if (!title || !description || !price || !categoryId) {
      return setStatus('Заполните все обязательные поля')
    }
    if (price <= 0) return setStatus('Цена должна быть больше 0')
    if (photos.length === 0) return setStatus('Добавьте хотя бы одно фото')
    if (!location.trim()) {
      return setStatus('Укажите местоположение товара')
    }

    setStatus('')
    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      
      formDataToSend.append('title', title)
      formDataToSend.append('description', description)
      formDataToSend.append('price', price)
      formDataToSend.append('categoryId', categoryId)
      formDataToSend.append('condition', condition)
      formDataToSend.append('location', location.trim())

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
      {/* Loading Overlay */}
      {uploading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Публикация объявления...</p>
          </div>
        </div>
      )}
      
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
                      style={photoImageStyle}
                    />
                    <button 
                      onClick={() => removePhoto(index)}
                      style={removePhotoButtonStyle}
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
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Основные поля */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Название *</label>
          <input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={inputStyle}
            placeholder="Что вы продаете?"
            maxLength="100"
          />

          <label style={labelStyle}>Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ ...inputStyle, height: 120, resize: 'vertical' }}
            placeholder="Опишите товар в деталях"
            maxLength="1000"
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
              max="100000000"
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

        {/* Секция геолокации */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Местоположение *</label>
          <div style={locationSectionStyle}>
            <div style={locationInputWrapperStyle}>
              <input
                ref={locationInputRef}
                value={formData.location}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => {
                  if (formData.location.length >= 2) {
                    searchAddress(formData.location)
                  }
                }}
                style={inputStyle}
                placeholder="Введите адрес (страна, город, улица, дом)"
                maxLength="200"
              />
              
              {/* Подсказки адресов */}
              {showSuggestions && (
                <div ref={suggestionsRef} style={suggestionsStyle}>
                  {isLoadingSuggestions ? (
                    <div style={suggestionItemStyle}>
                      <span>Поиск адресов...</span>
                    </div>
                  ) : addressSuggestions.length > 0 ? (
                    addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        style={suggestionItemStyle}
                        onClick={() => handleAddressSelect(suggestion)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white'
                        }}
                      >
                        <span className="material-symbols-outlined" style={suggestionIconStyle}>
                          location_on
                        </span>
                        <span style={suggestionTextStyle}>
                          {renderSuggestion(suggestion)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={suggestionItemStyle}>
                      <span>Адреса не найдены. Попробуйте другой запрос.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={getCurrentLocation}
              style={{
                ...locationButtonStyle,
                opacity: gettingLocation ? 0.7 : 1
              }}
              disabled={gettingLocation}
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {gettingLocation ? 'refresh' : 'my_location'}
              </span>
              {gettingLocation ? '...' : 'Авто'}
            </button>
          </div>
          <p style={locationHintStyle}>
            Начните вводить адрес для поиска (минимум 2 символа)
          </p>
        </div>

        {status && !uploading && (
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

// Обновленные стили с новой цветовой палитрой
const loadingOverlayStyle = {
  position: 'fixed',
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

const locationSectionStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start'
}

const locationInputWrapperStyle = {
  position: 'relative',
  flex: 1
}

const suggestionsStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  zIndex: 1000,
  maxHeight: '200px',
  overflowY: 'auto',
  marginTop: '4px'
}

const suggestionItemStyle = {
  padding: '12px 16px',
  cursor: 'pointer',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  transition: 'background-color 0.2s ease'
}

const suggestionIconStyle = {
  fontSize: '16px',
  color: '#46A8C1',
  flexShrink: 0,
  marginTop: '2px'
}

const suggestionTextStyle = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: 1.3
}

const locationButtonStyle = {
  flexShrink: 0,
  height: '56px',
  padding: '0 16px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#46A8C1',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const locationHintStyle = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '8px',
  marginBottom: 0
}

const photosGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  padding: 8
}

const photoItemStyle = {
  position: 'relative',
  aspectRatio: '1'
}

const photoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8
}

const removePhotoButtonStyle = {
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
  bottom: 4,
  left: 4,
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 4
}

const addMorePhotoStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  aspectRatio: '1',
  border: `2px dashed #46A8C1`,
  borderRadius: 8,
  backgroundColor: 'rgba(70, 168, 193, 0.05)',
  cursor: 'pointer'
}

const pageStyle = { 
  backgroundColor: '#f6f6f8', 
  minHeight: '100vh', 
  display: 'flex', 
  flexDirection: 'column',
  position: 'relative'
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
  cursor: 'pointer',
  color: '#46A8C1'
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
  backgroundColor: '#46A8C1', 
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
  backgroundColor: '#46A8C1', 
  color: 'white', 
  borderColor: '#46A8C1' 
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
  backgroundColor: '#46A8C1', 
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