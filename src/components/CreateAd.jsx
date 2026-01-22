// frontend/src/components/CreateAd.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'

function CreateAd({ onBack, onAdCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '', // ID подкатегории
    condition: 'new',
    location: ''
  })
  const [propertyDetails, setPropertyDetails] = useState({})
  const [photos, setPhotos] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [realEstateSubcats, setRealEstateSubcats] = useState([])
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({}) // ← новое состояние

  const fileInputRef = useRef(null)
  const locationInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceRef = useRef(null)

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com'

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories`)
        const data = await res.json()
        setCategories(data)
        const realEstateCat = data.find(cat => cat.name === 'Недвижимость')
        if (realEstateCat) {
          const subRes = await fetch(`${API_BASE}/api/categories/${realEstateCat.id}`)
          const subData = await subRes.json()
          setRealEstateSubcats(subData)
        }
      } catch (err) {
        console.error('Ошибка загрузки категорий', err)
      }
    }
    fetchCategories()

    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current && !locationInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.id === parseInt(formData.categoryId))
    if (selectedCategory && selectedCategory.name === 'Недвижимость') {
      setSubcategories(realEstateSubcats)
    } else {
      setSubcategories([])
      if (selectedCategory) {
        setPropertyDetails({})
      }
    }
  }, [formData.categoryId, categories, realEstateSubcats])

  // 🔴 Обновлённый handleChange: сброс ошибки при изменении
  const handleChange = (field, value) => {
    // Сброс ошибки
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }

    const propertyFields = [
      'transaction_type', 'total_area', 'rooms', 'floor', 'total_floors', 
      'building_type', 'condition_detail', 'furniture', 'bathroom_type', 
      'balcony', 'lift', 'parking', 'ceiling_height', 'year_built', 
      'mortgage_friendly', 'gas', 'electricity', 'water', 'heating_type', 
      'plot_area', 'land_category', 'allowed_use', 'utilities', 'terrain', 
      'access_road', 'living_area', 'kitchen_area', 'property_type', 
      'room_type', 'wall_material', 'sewage', 'heating_system', 'garage', 
      'outbuildings', 'bathhouse', 'gate_type', 'construction_material', 
      'security', 'bedrooms', 'guests', 'wifi', 'breakfast', 'transfer', 
      'reception', 'cleaning', 'ac', 'development_type', 'developer', 
      'project_name', 'delivery_date', 'contract_type', 'power', 
      'loading_lift', 'metro', 'metro_distance', 'owner_type', 
      'is_negotiable'
    ]

    if (propertyFields.includes(field)) {
      setPropertyDetails(prev => ({ ...prev, [field]: value }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
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
    if (!suggestion.address) return suggestion.display_name
    const { address } = suggestion
    const parts = []
    if (address.house_number) parts.push(`д. ${address.house_number}`)
    else if (address.house) parts.push(`д. ${address.house}`)
    if (address.road) parts.push(`ул. ${address.road}`)
    if (address.street) parts.push(`ул. ${address.street}`)
    if (address.city) parts.push(address.city)
    else if (address.town) parts.push(address.town)
    else if (address.village) parts.push(address.village)
    else if (address.municipality) parts.push(address.municipality)
    if (address.country) parts.push(address.country)
    if (parts.length === 0) {
      return extractAddressFromDisplayName(suggestion.display_name)
    }
    return parts.join(', ')
  }

  const extractAddressFromDisplayName = (displayName) => {
    const parts = displayName.split(', ')
    const firstPart = parts[0]
    if (firstPart && firstPart.match(/\d/)) {
      const houseMatch = firstPart.match(/(\d+[a-zA-Zа-яА-Я]?)/)
      if (houseMatch) parts[0] = `д. ${houseMatch[1]}`
    }
    const relevantParts = parts.slice(0, 4)
    return relevantParts.join(', ')
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
        let errorMessage = 'Не удалось определить местоположение'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещён. Разрешите в настройках браузера.'
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  const handleAddressSelect = (suggestion) => {
    const formattedAddress = formatAddressFromOSM(suggestion)
    handleChange('location', formattedAddress)
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  const renderSuggestion = (suggestion) => {
    return formatAddressFromOSM(suggestion) || suggestion.display_name
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

 const validateForm = () => {
  const errors = {}

  // Базовые поля
  if (!formData.title.trim()) errors.title = true
  if (!formData.description.trim()) errors.description = true
  if (!formData.price || parseFloat(formData.price) <= 0) errors.price = true
  if (!formData.categoryId) errors.categoryId = true
  if (photos.length === 0) errors.photos = true
  if (!formData.location.trim()) errors.location = true

  // Проверка полей недвижимости
  const isRealEstate = realEstateSubcats.some(cat => cat.id === parseInt(formData.categoryId))
  if (isRealEstate) {
    const subcat = realEstateSubcats.find(cat => cat.id === parseInt(formData.categoryId))
    const subcatName = subcat?.name || ''

    // Обязательные для всех: тип сделки
    if (!propertyDetails.transaction_type) errors.transaction_type = true

    // ✅ ИСПРАВЛЕННЫЙ КОД: Разные поля для разных подкатегорий
    
    // 1. Квартиры, Комнаты, Дома, Новостройки, Отели
    if (
      subcatName.includes('Квартиры') ||
      subcatName.includes('Комнаты') ||
      subcatName.includes('Дома') || 
      subcatName.includes('Коттеджи') ||
      subcatName.includes('Дачи') ||
      subcatName.includes('Новостройки') ||
      subcatName.includes('Отели') ||
      subcatName.includes('Апартаменты') ||
      subcatName.includes('Посуточная') ||
      subcatName.includes('Краткосрочная') ||
      subcatName.includes('Гаражи') ||
      subcatName.includes('машиноместа')
    ) {
      // Проверяем total_area (общую площадь)
      const areaValue = parseFloat(propertyDetails.total_area)
      if (!propertyDetails.total_area || isNaN(areaValue) || areaValue <= 0) {
        errors.total_area = true
      }
    }

    // 2. Земельные участки - проверяем plot_area, НЕ total_area!
    if (subcatName.includes('Земельные участки')) {
      const plotArea = parseFloat(propertyDetails.plot_area)
      if (!propertyDetails.plot_area || isNaN(plotArea) || plotArea <= 0) {
        errors.plot_area = true
      }
      if (!propertyDetails.land_category) errors.land_category = true
    }

    // 3. Квартиры и Комнаты - проверяем rooms
    if (subcatName.includes('Квартиры') || subcatName.includes('Комнаты')) {
      const rooms = parseFloat(propertyDetails.rooms)
      if (!propertyDetails.rooms || isNaN(rooms) || rooms <= 0) {
        errors.rooms = true
      }
    }

    // 4. Дома с участком - если указан plot_area, то land_category обязателен
    if (subcatName.includes('Дома') || subcatName.includes('Дачи') || subcatName.includes('Коттеджи')) {
      if (propertyDetails.plot_area && !propertyDetails.land_category) {
        errors.land_category = true
      }
    }
  }

  return errors
}

  const handleSubmit = async () => {
    const errors = validateForm()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setStatus('❌ Заполните выделенные обязательные поля')

      // Автопрокрутка к первому полю с ошибкой
      const firstErrorField = Object.keys(errors)[0]
      const fieldElement = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        fieldElement.focus({ preventScroll: true }) // фокус без дёргания
      }
      return
    }

    setStatus('')
    setUploading(true)

    try {
      const initData = localStorage.getItem('telegram_init_data');
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('categoryId', formData.categoryId)
      formDataToSend.append('condition', formData.condition)
      formDataToSend.append('location', formData.location.trim())
      formDataToSend.append('propertyDetails', JSON.stringify(propertyDetails))

      photos.forEach(photo => {
        formDataToSend.append('photos', photo.file)
      })

      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: { 'telegram-init-data': initData },
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

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ СТИЛЕЙ ---
  const getErrorStyle = (field) => {
    return fieldErrors[field] ? { borderColor: '#ef4444', borderWidth: '2px' } : {}
  }

  // --- ОСТАЛЬНОЙ КОД НЕ ИЗМЕНЯЛСЯ, КРОМЕ ДОБАВЛЕНИЯ data-field И СТИЛЕЙ ---
  // (все render-функции ниже обновлены)

  const renderRealEstateFields = () => {
    const selectedSubcategory = realEstateSubcats.find(cat => cat.id === parseInt(formData.categoryId))
    if (!selectedSubcategory) return null
    const subcatName = selectedSubcategory.name

    const commonFields = (
      <>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Тип сделки *</label>
          <select
            data-field="transaction_type"
            value={propertyDetails.transaction_type || ''}
            onChange={(e) => handleChange('transaction_type', e.target.value)}
            style={{ ...selectStyle, ...getErrorStyle('transaction_type') }}
          >
            <option value="">Выберите тип сделки</option>
            <option value="buy">Купить</option>
            <option value="sell">Продать</option>
            <option value="rent">Снять</option>
            <option value="rent_out">Сдать</option>
            <option value="daily">Посуточно</option>
          </select>
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Договорная цена</label>
          <div style={checkboxGroupStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={propertyDetails.is_negotiable || false}
                onChange={(e) => handleChange('is_negotiable', e.target.checked)}
              />
              Договорная
            </label>
          </div>
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Тип собственника</label>
          <select
            value={propertyDetails.owner_type || ''}
            onChange={(e) => handleChange('owner_type', e.target.value)}
            style={selectStyle}
          >
            <option value="">Выберите тип</option>
            <option value="owner">Собственник</option>
            <option value="agent">Агент</option>
            <option value="agency">Агентство</option>
          </select>
        </div>
      </>
    )

    const metroFields = (
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Метро</label>
        <input
          type="text"
          value={propertyDetails.metro || ''}
          onChange={(e) => handleChange('metro', e.target.value)}
          style={inputStyle}
          placeholder="Название станции метро"
        />
        <input
          type="number"
          value={propertyDetails.metro_distance || ''}
          onChange={(e) => handleChange('metro_distance', e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
          placeholder="Расстояние от метро (минут)"
          min="0"
        />
      </div>
    )

    // 3.1. Квартиры
    if (subcatName.includes('Квартиры')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Общая площадь (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Общая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Жилая площадь (м²)</label>
            <input
              type="number"
              value={propertyDetails.living_area || ''}
              onChange={(e) => handleChange('living_area', e.target.value)}
              style={inputStyle}
              placeholder="Жилая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Площадь кухни (м²)</label>
            <input
              type="number"
              value={propertyDetails.kitchen_area || ''}
              onChange={(e) => handleChange('kitchen_area', e.target.value)}
              style={inputStyle}
              placeholder="Площадь кухни"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Количество комнат *</label>
            <input
              data-field="rooms"
              type="number"
              value={propertyDetails.rooms || ''}
              onChange={(e) => handleChange('rooms', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('rooms') }}
              placeholder="1, 2, 3..."
              min="0"
              max="10"
            />
          </div>
          {/* остальные поля как раньше, без data-field — не обязательны */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип планировки</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите планировку</option>
              <option value="studio">Студия</option>
              <option value="free">Свободная</option>
              <option value="classic">Классическая</option>
              <option value="euro">Евро</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Этаж</label>
            <input
              type="number"
              value={propertyDetails.floor || ''}
              onChange={(e) => handleChange('floor', e.target.value)}
              style={inputStyle}
              placeholder="Номер этажа"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Всего этажей</label>
            <input
              type="number"
              value={propertyDetails.total_floors || ''}
              onChange={(e) => handleChange('total_floors', e.target.value)}
              style={inputStyle}
              placeholder="В доме"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип дома</label>
            <select
              value={propertyDetails.building_type || ''}
              onChange={(e) => handleChange('building_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="panel">Панельный</option>
              <option value="brick">Кирпичный</option>
              <option value="monolith">Монолит</option>
              <option value="wooden">Деревянный</option>
              <option value="block">Блочный</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Состояние</label>
            <select
              value={propertyDetails.condition_detail || ''}
              onChange={(e) => handleChange('condition_detail', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите состояние</option>
              <option value="needs_repair">Требует ремонта</option>
              <option value="cosmetic_repair">Косметический ремонт</option>
              <option value="euro_repair">Евро-ремонт</option>
              <option value="designer_repair">Дизайнерский ремонт</option>
              <option value="new_finish">Новая отделка</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Санузел</label>
            <select
              value={propertyDetails.bathroom_type || ''}
              onChange={(e) => handleChange('bathroom_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="separate">Раздельный</option>
              <option value="combined">Совмещённый</option>
              <option value="two_or_more">Два и более</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Балкон/лоджия</label>
            <select
              value={propertyDetails.balcony || ''}
              onChange={(e) => handleChange('balcony', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="none">Нет</option>
              <option value="balcony">Балкон</option>
              <option value="loggia">Лоджия</option>
              <option value="both">Балкон и лоджия</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Наличие мебели</label>
            <select
              value={propertyDetails.furniture || ''}
              onChange={(e) => handleChange('furniture', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите вариант</option>
              <option value="none">Нет</option>
              <option value="partial">Частично</option>
              <option value="full">Полностью</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Лифт</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.lift?.includes('passenger') || false}
                  onChange={(e) => {
                    const current = propertyDetails.lift || []
                    if (e.target.checked) {
                      handleChange('lift', [...current, 'passenger'])
                    } else {
                      handleChange('lift', current.filter(l => l !== 'passenger'))
                    }
                  }}
                />
                Пассажирский
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.lift?.includes('cargo') || false}
                  onChange={(e) => {
                    const current = propertyDetails.lift || []
                    if (e.target.checked) {
                      handleChange('lift', [...current, 'cargo'])
                    } else {
                      handleChange('lift', current.filter(l => l !== 'cargo'))
                    }
                  }}
                />
                Грузовой
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Парковка</label>
            <select
              value={propertyDetails.parking || ''}
              onChange={(e) => handleChange('parking', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="none">Нет</option>
              <option value="open">Открытая</option>
              <option value="covered">Крытая</option>
              <option value="underground">Подземная</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Высота потолков (м)</label>
            <input
              type="number"
              value={propertyDetails.ceiling_height || ''}
              onChange={(e) => handleChange('ceiling_height', e.target.value)}
              style={inputStyle}
              placeholder="2.5, 2.7, 3.0..."
              step="0.1"
              min="2"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Год постройки дома</label>
            <input
              type="number"
              value={propertyDetails.year_built || ''}
              onChange={(e) => handleChange('year_built', e.target.value)}
              style={inputStyle}
              placeholder="1990, 2000..."
              min="1900"
              max="2025"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Подходит под ипотеку</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.mortgage_friendly || false}
                  onChange={(e) => handleChange('mortgage_friendly', e.target.checked)}
                />
                Да
              </label>
            </div>
          </div>
          {metroFields}
        </div>
      )
    }

    // 3.2. Комнаты
    if (subcatName.includes('Комнаты')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Площадь комнаты (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Площадь комнаты"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Количество комнат в квартире</label>
            <input
              type="number"
              value={propertyDetails.rooms || ''}
              onChange={(e) => handleChange('rooms', e.target.value)}
              style={inputStyle}
              placeholder="2, 3, 4..."
              min="1"
              max="10"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип комнаты</label>
            <select
              value={propertyDetails.room_type || ''}
              onChange={(e) => handleChange('room_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="isolated">Изолированная</option>
              <option value="passage">Проходная</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Наличие мебели</label>
            <select
              value={propertyDetails.furniture || ''}
              onChange={(e) => handleChange('furniture', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите вариант</option>
              <option value="none">Нет</option>
              <option value="partial">Частично</option>
              <option value="full">Полностью</option>
            </select>
          </div>
          {metroFields}
        </div>
      )
    }

    // 3.3. Дома / Дачи / Коттеджи
    if (subcatName.includes('Дома') || subcatName.includes('Дачи') || subcatName.includes('Коттеджи')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип дома</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="house">Дом</option>
              <option value="cottage">Коттедж</option>
              <option value="dacha">Дача</option>
              <option value="townhouse">Таунхаус</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Общая площадь (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Общая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Жилая площадь (м²)</label>
            <input
              type="number"
              value={propertyDetails.living_area || ''}
              onChange={(e) => handleChange('living_area', e.target.value)}
              style={inputStyle}
              placeholder="Жилая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Количество этажей</label>
            <input
              type="number"
              value={propertyDetails.total_floors || ''}
              onChange={(e) => handleChange('total_floors', e.target.value)}
              style={inputStyle}
              placeholder="Количество этажей"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Год постройки</label>
            <input
              type="number"
              value={propertyDetails.year_built || ''}
              onChange={(e) => handleChange('year_built', e.target.value)}
              style={inputStyle}
              placeholder="1990, 2000..."
              min="1900"
              max="2025"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Материал стен</label>
            <select
              value={propertyDetails.wall_material || ''}
              onChange={(e) => handleChange('wall_material', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите материал</option>
              <option value="brick">Кирпич</option>
              <option value="wood">Дерево</option>
              <option value="foam_block">Пеноблок</option>
              <option value="aerated_concrete">Газобетон</option>
              <option value="frame">Каркасный</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Площадь участка (сотки)</label>
            <input
              type="number"
              value={propertyDetails.plot_area || ''}
              onChange={(e) => handleChange('plot_area', e.target.value)}
              style={inputStyle}
              placeholder="Площадь земли"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Категория земли</label>
            <select
              value={propertyDetails.land_category || ''}
              onChange={(e) => handleChange('land_category', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите категорию</option>
              <option value="IZHS">ИЖС</option>
              <option value="LPH">ЛПХ</option>
              <option value="SNT">СНТ</option>
              <option value="dacha">Дачное</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Коммуникации</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.electricity === true}
                  onChange={(e) => handleChange('electricity', e.target.checked)}
                />
                Электричество
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.gas === true}
                  onChange={(e) => handleChange('gas', e.target.checked)}
                />
                Газ
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.water === true}
                  onChange={(e) => handleChange('water', e.target.checked)}
                />
                Вода (центральная)
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.sewage === true}
                  onChange={(e) => handleChange('sewage', e.target.checked)}
                />
                Канализация
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Отопление</label>
            <select
              value={propertyDetails.heating_system || ''}
              onChange={(e) => handleChange('heating_system', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="gas">Газовое</option>
              <option value="electric">Электрическое</option>
              <option value="solid_fuel">Твердотопливное</option>
              <option value="central">Центральное</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Дополнительные постройки</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.garage === true}
                  onChange={(e) => handleChange('garage', e.target.checked)}
                />
                Гараж
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.outbuildings === true}
                  onChange={(e) => handleChange('outbuildings', e.target.checked)}
                />
                Хозпостройки
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.bathhouse === true}
                  onChange={(e) => handleChange('bathhouse', e.target.checked)}
                />
                Баня
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Подъезд к дому</label>
            <select
              value={propertyDetails.access_road || ''}
              onChange={(e) => handleChange('access_road', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="asphalt">Асфальт</option>
              <option value="concrete">Бетон</option>
              <option value="gravel">Гравий</option>
              <option value="dirt">Грунт</option>
            </select>
          </div>
        </div>
      )
    }

    // 3.4. Земельные участки
    if (subcatName.includes('Земельные участки')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Площадь (сотки) *</label>
            <input
              data-field="plot_area"
              type="number"
              value={propertyDetails.plot_area || ''}
              onChange={(e) => handleChange('plot_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('plot_area') }}
              placeholder="Площадь участка"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Категория земли *</label>
            <select
              data-field="land_category"
              value={propertyDetails.land_category || ''}
              onChange={(e) => handleChange('land_category', e.target.value)}
              style={{ ...selectStyle, ...getErrorStyle('land_category') }}
            >
              <option value="">Выберите категорию</option>
              <option value="IZHS">ИЖС</option>
              <option value="LPH">ЛПХ</option>
              <option value="SNT">СНТ</option>
              <option value="commercial">Коммерческое</option>
              <option value="agricultural">Сельхозугодия</option>
              <option value="industrial">Промышленность</option>
            </select>
          </div>
          {/* остальные — не обязательны */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Разрешённое использование</label>
            <input
              type="text"
              value={propertyDetails.allowed_use || ''}
              onChange={(e) => handleChange('allowed_use', e.target.value)}
              style={inputStyle}
              placeholder="Например, ИЖС, СНТ, сельхоз..."
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Коммуникации</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.utilities?.includes('electricity') || false}
                  onChange={(e) => {
                    const current = propertyDetails.utilities || []
                    if (e.target.checked) {
                      handleChange('utilities', [...current, 'electricity'])
                    } else {
                      handleChange('utilities', current.filter(u => u !== 'electricity'))
                    }
                  }}
                />
                Электричество
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.utilities?.includes('gas') || false}
                  onChange={(e) => {
                    const current = propertyDetails.utilities || []
                    if (e.target.checked) {
                      handleChange('utilities', [...current, 'gas'])
                    } else {
                      handleChange('utilities', current.filter(u => u !== 'gas'))
                    }
                  }}
                />
                Газ
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.utilities?.includes('water') || false}
                  onChange={(e) => {
                    const current = propertyDetails.utilities || []
                    if (e.target.checked) {
                      handleChange('utilities', [...current, 'water'])
                    } else {
                      handleChange('utilities', current.filter(u => u !== 'water'))
                    }
                  }}
                />
                Вода
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Рельеф</label>
            <select
              value={propertyDetails.terrain || ''}
              onChange={(e) => handleChange('terrain', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="flat">Ровный</option>
              <option value="slope">Склон</option>
              <option value="hilly">Холмистый</option>
              <option value="forest">Лесной</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Подъездные пути</label>
            <select
              value={propertyDetails.access_road || ''}
              onChange={(e) => handleChange('access_road', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="asphalt">Асфальт</option>
              <option value="concrete">Бетон</option>
              <option value="gravel">Гравий</option>
              <option value="dirt">Грунт</option>
            </select>
          </div>
        </div>
      )
    }

    // 3.5. Гаражи и машиноместа
    if (subcatName.includes('Гаражи') || subcatName.includes('машиноместа')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="garage">Гараж</option>
              <option value="parking_space">Машиноместо</option>
              <option value="box">Бокс</option>
              <option value="canopy">Навес</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Площадь (м²)</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Площадь"
              min="0"
            />
          </div>
          {/* остальные не обязательны */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип ворот</label>
            <select
              value={propertyDetails.gate_type || ''}
              onChange={(e) => handleChange('gate_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="sectional">Секционные</option>
              <option value="roller">Рольставни</option>
              <option value="swing">Распашные</option>
              <option value="sliding">Раздвижные</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Материал постройки</label>
            <select
              value={propertyDetails.construction_material || ''}
              onChange={(e) => handleChange('construction_material', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите материал</option>
              <option value="brick">Кирпич</option>
              <option value="metal">Металл</option>
              <option value="concrete">Бетон</option>
              <option value="wood">Дерево</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Отопление</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.heating_system === true}
                  onChange={(e) => handleChange('heating_system', e.target.checked)}
                />
                Есть
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Этаж (для паркингов)</label>
            <input
              type="number"
              value={propertyDetails.floor || ''}
              onChange={(e) => handleChange('floor', e.target.value)}
              style={inputStyle}
              placeholder="Номер этажа"
              min="-5"
              max="20"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Охрана / доступ</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.security || false}
                  onChange={(e) => handleChange('security', e.target.checked)}
                />
                Охрана
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.access_control || false}
                  onChange={(e) => handleChange('access_control', e.target.checked)}
                />
                Контроль доступа
              </label>
            </div>
          </div>
          {metroFields}
        </div>
      )
    }

    // 3.7. Новостройки
    if (subcatName.includes('Новостройки')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип объекта</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="apartment">Квартира</option>
              <option value="studio">Студия</option>
              <option value="parking">Паркинг</option>
              <option value="commercial">Коммерческое</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Общая площадь (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Общая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Застройщик</label>
            <input
              type="text"
              value={propertyDetails.developer || ''}
              onChange={(e) => handleChange('developer', e.target.value)}
              style={inputStyle}
              placeholder="Название застройщика"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Проект (ЖК)</label>
            <input
              type="text"
              value={propertyDetails.project_name || ''}
              onChange={(e) => handleChange('project_name', e.target.value)}
              style={inputStyle}
              placeholder="Название жилого комплекса"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Срок сдачи</label>
            <input
              type="text"
              value={propertyDetails.delivery_date || ''}
              onChange={(e) => handleChange('delivery_date', e.target.value)}
              style={inputStyle}
              placeholder="Год/квартал (например: 2025 Q3)"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип договора</label>
            <select
              value={propertyDetails.contract_type || ''}
              onChange={(e) => handleChange('contract_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="ddu">ДДУ</option>
              <option value="assignment">Переуступка</option>
              <option value="participation">Договор участия</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Этажность дома</label>
            <input
              type="number"
              value={propertyDetails.total_floors || ''}
              onChange={(e) => handleChange('total_floors', e.target.value)}
              style={inputStyle}
              placeholder="Количество этажей"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип отделки</label>
            <select
              value={propertyDetails.condition_detail || ''}
              onChange={(e) => handleChange('condition_detail', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="none">Без отделки</option>
              <option value="rough">Черновая</option>
              <option value="clean">Чистовая</option>
              <option value="euro">Евро</option>
              <option value="designer">Дизайнерская</option>
            </select>
          </div>
          {metroFields}
        </div>
      )
    }

    // 3.8. Посуточная аренда / Краткосрочная аренда
    if (subcatName.includes('Посуточная') || subcatName.includes('Краткосрочная')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип жилья</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="apartment">Квартира</option>
              <option value="house">Дом</option>
              <option value="studio">Студия</option>
              <option value="apartments">Апартаменты</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Общая площадь (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Общая площадь"
              min="0"
            />
          </div>
          {/* остальные — не обязательны */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Количество спальных мест</label>
            <input
              type="number"
              value={propertyDetails.bedrooms || ''}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              style={inputStyle}
              placeholder="Количество спальных мест"
              min="1"
              max="20"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Максимум гостей</label>
            <input
              type="number"
              value={propertyDetails.guests || ''}
              onChange={(e) => handleChange('guests', e.target.value)}
              style={inputStyle}
              placeholder="Максимальное количество гостей"
              min="1"
              max="50"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Удобства</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.wifi || false}
                  onChange={(e) => handleChange('wifi', e.target.checked)}
                />
                Wi-Fi
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.ac || false}
                  onChange={(e) => handleChange('ac', e.target.checked)}
                />
                Кондиционер
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.parking || false}
                  onChange={(e) => handleChange('parking', e.target.checked)}
                />
                Парковка
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Мебель</label>
            <select
              value={propertyDetails.furniture || ''}
              onChange={(e) => handleChange('furniture', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите вариант</option>
              <option value="none">Нет</option>
              <option value="partial">Частично</option>
              <option value="full">Полностью</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Техника</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.tv || false}
                  onChange={(e) => handleChange('tv', e.target.checked)}
                />
                Телевизор
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.washing_machine || false}
                  onChange={(e) => handleChange('washing_machine', e.target.checked)}
                />
                Стиральная машина
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.dishwasher || false}
                  onChange={(e) => handleChange('dishwasher', e.target.checked)}
                />
                Посудомоечная машина
              </label>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Чек-ин / чек-аут</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={propertyDetails.check_in || ''}
                onChange={(e) => handleChange('check_in', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Заезд (например: 14:00)"
              />
              <input
                type="text"
                value={propertyDetails.check_out || ''}
                onChange={(e) => handleChange('check_out', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Выезд (например: 12:00)"
              />
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Правила</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.pets_allowed || false}
                  onChange={(e) => handleChange('pets_allowed', e.target.checked)}
                />
                Можно с животными
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.smoking_allowed || false}
                  onChange={(e) => handleChange('smoking_allowed', e.target.checked)}
                />
                Можно курить
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.parties_allowed || false}
                  onChange={(e) => handleChange('parties_allowed', e.target.checked)}
                />
                Можно проводить вечеринки
              </label>
            </div>
          </div>
          {metroFields}
        </div>
      )
    }

    // 3.9. Отели / Апартаменты
    if (subcatName.includes('Отели') || subcatName.includes('Апартаменты')) {
      return (
        <div>
          {commonFields}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Тип объекта</label>
            <select
              value={propertyDetails.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              style={selectStyle}
            >
              <option value="">Выберите тип</option>
              <option value="hotel">Отель</option>
              <option value="guest_house">Гостевой дом</option>
              <option value="apartments">Апартаменты</option>
              <option value="hostel">Хостел</option>
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Общая площадь (м²) *</label>
            <input
              data-field="total_area"
              type="number"
              value={propertyDetails.total_area || ''}
              onChange={(e) => handleChange('total_area', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('total_area') }}
              placeholder="Общая площадь"
              min="0"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Количество номеров</label>
            <input
              type="number"
              value={propertyDetails.rooms || ''}
              onChange={(e) => handleChange('rooms', e.target.value)}
              style={inputStyle}
              placeholder="Количество номеров"
              min="1"
              max="100"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Максимум гостей</label>
            <input
              type="number"
              value={propertyDetails.guests || ''}
              onChange={(e) => handleChange('guests', e.target.value)}
              style={inputStyle}
              placeholder="Максимальное количество гостей"
              min="1"
              max="200"
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Услуги</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.wifi || false}
                  onChange={(e) => handleChange('wifi', e.target.checked)}
                />
                Wi-Fi
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.breakfast || false}
                  onChange={(e) => handleChange('breakfast', e.target.checked)}
                />
                Завтрак
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.parking || false}
                  onChange={(e) => handleChange('parking', e.target.checked)}
                />
                Парковка
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.transfer || false}
                  onChange={(e) => handleChange('transfer', e.target.checked)}
                />
                Трансфер
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.reception || false}
                  onChange={(e) => handleChange('reception', e.target.checked)}
                />
                Ресепшен 24/7
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.cleaning || false}
                  onChange={(e) => handleChange('cleaning', e.target.checked)}
                />
                Ежедневная уборка
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={propertyDetails.ac || false}
                  onChange={(e) => handleChange('ac', e.target.checked)}
                />
                Кондиционер
              </label>
            </div>
          </div>
          {metroFields}
        </div>
      )
    }

    // Fallback
    return (
      <div>
        {commonFields}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Общая площадь (м²) *</label>
          <input
            data-field="total_area"
            type="number"
            value={propertyDetails.total_area || ''}
            onChange={(e) => handleChange('total_area', e.target.value)}
            style={{ ...inputStyle, ...getErrorStyle('total_area') }}
            placeholder="Общая площадь"
            min="0"
          />
        </div>
      </div>
    )
  }

  // --- Стили остались без изменений — копируем из исходного файла ---
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
  borderBottom: '1px solid #eee',
  height: '80px',
  minHeight: '80px'
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
  const inputGroupStyle = { 
    marginBottom: 16 
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
  const checkboxGroupStyle = { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px' 
  }
  const checkboxLabelStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontSize: '14px', 
    color: '#0d121b' 
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
 // Находите этот стиль в CreateAd.jsx:
const footerStyle = { 
  position: 'fixed', 
  bottom: 0, 
  left: 0, 
  right: 0, 
  padding: '16px', 
  backgroundColor: 'white', 
  borderTop: '1px solid #eee',
  zIndex: 1001, // Добавьте этот z-index
  paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0))' // Добавьте safe area для iOS
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
            data-field="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={{ ...inputStyle, ...getErrorStyle('title') }}
            placeholder="Что вы продаете?"
            maxLength="100"
          />
          <label style={labelStyle}>Описание *</label>
          <textarea
            data-field="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ ...inputStyle, height: 120, resize: 'vertical', ...getErrorStyle('description') }}
            placeholder="Опишите товар в деталях"
            maxLength="1000"
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Категория *</label>
          <select
            data-field="categoryId"
            value={formData.categoryId}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            style={{ ...selectStyle, ...getErrorStyle('categoryId') }}
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.name === 'Недвижимость' ? (
                  realEstateSubcats.map(subcat => (
                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                  ))
                ) : (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                )}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Цена (₽) *</label>
          <div style={{ position: 'relative' }}>
            <input
              data-field="price"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              style={{ ...inputStyle, ...getErrorStyle('price') }}
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

        {/* Поля недвижимости */}
        {realEstateSubcats.some(cat => cat.id === parseInt(formData.categoryId)) && (
          <div style={sectionStyle}>
            <h3 style={{ ...labelStyle, marginBottom: '12px' }}>Параметры недвижимости</h3>
            {renderRealEstateFields()}
          </div>
        )}

        {/* Секция геолокации */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Местоположение *</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                data-field="location"
                ref={locationInputRef}
                value={formData.location}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => {
                  if (formData.location.length >= 2) {
                    searchAddress(formData.location)
                  }
                }}
                style={{ ...inputStyle, ...getErrorStyle('location') }}
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

        {/* Status message */}
        {status && !uploading && (
          <div style={statusStyle(status)}>
            {status}
          </div>
        )}
      </div>

      {/* Footer */}
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

export default CreateAd