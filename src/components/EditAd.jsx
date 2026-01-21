// frontend/src/components/EditAd.jsx
import React, { useState, useEffect, useRef } from 'react';

function EditAd({ onBack, onUpdate }) {
  const [ad, setAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    condition: 'new',
    location: ''
  });
  const [propertyDetails, setPropertyDetails] = useState({});
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [realEstateSubcats, setRealEstateSubcats] = useState([]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef(null);

  const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:4000' 
    : 'https://spacego-backend.onrender.com';

  // Загружаем данные объявления из localStorage
  useEffect(() => {
    const loadAdData = async () => {
      try {
        const savedAd = localStorage.getItem('editing_ad');
        console.log('Saved ad from localStorage:', savedAd);
        
        if (savedAd) {
          const adData = JSON.parse(savedAd);
          console.log('Parsed ad data:', adData);
          setAd(adData);
          
          // Основные поля
          setFormData({
            title: adData.title || '',
            description: adData.description || '',
            price: adData.price ? adData.price.toString() : '',
            categoryId: adData.category_id || adData.categoryId || '',
            condition: adData.condition || 'new',
            location: adData.location || ''
          });

          // Детали недвижимости
          if (adData.property_details) {
            console.log('Property details:', adData.property_details);
            setPropertyDetails(adData.property_details);
          }

          // Существующие фото
          if (adData.photo_urls && adData.photo_urls.length > 0) {
            console.log('Existing photos:', adData.photo_urls);
            setExistingPhotos(adData.photo_urls.map((url, index) => ({
              id: index,
              url: url,
              isExisting: true
            })));
          }
        } else {
          console.error('No ad found in localStorage');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных объявления:', error);
        setStatus('❌ Ошибка загрузки данных объявления');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdData();
    
    // Загружаем категории
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json();
        setCategories(data);
        
        const realEstateCat = data.find(cat => cat.name === 'Недвижимость');
        if (realEstateCat) {
          const subRes = await fetch(`${API_BASE}/api/categories/${realEstateCat.id}`);
          const subData = await subRes.json();
          setRealEstateSubcats(subData);
        }
      } catch (err) {
        console.error('Ошибка загрузки категорий', err);
      }
    };

    fetchCategories();
  }, []);

  // Обновляем подкатегории при выборе категории
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.id === parseInt(formData.categoryId));
    if (selectedCategory && selectedCategory.name === 'Недвижимость') {
      setSubcategories(realEstateSubcats);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId, categories, realEstateSubcats]);

  const handleChange = (field, value) => {
    // Сброс ошибки
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
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
      'reception', 'cleaning', 'ac', 'developer', 'project_name', 
      'delivery_date', 'contract_type', 'power', 'loading_lift', 
      'metro', 'metro_distance', 'owner_type', 'is_negotiable'
    ];

    if (propertyFields.includes(field)) {
      setPropertyDetails(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const totalPhotos = existingPhotos.length + photos.length + files.length;
    if (totalPhotos > 10) {
      setStatus(`❌ Максимум 10 фото. Уже есть ${existingPhotos.length + photos.length}, можно добавить ещё ${10 - (existingPhotos.length + photos.length)}`);
      return;
    }
    
    const newPhotos = [];
    const promises = [];
    
    for (let file of files) {
      if (file.size > 500 * 1024) {
        setStatus(`❌ Фото "${file.name}" слишком большое. Максимум 500KB.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setStatus(`❌ "${file.name}" не является изображением`);
        continue;
      }
      
      const reader = new FileReader();
      const promise = new Promise((resolve) => {
        reader.onload = (e) => {
          newPhotos.push({
            file,
            preview: e.target.result,
            name: file.name,
            size: file.size,
            isExisting: false
          });
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
      promises.push(promise);
    }
    
    Promise.all(promises).then(() => {
      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        setStatus(`✅ Добавлено ${newPhotos.length} новых фото`);
      }
    });
  };

  const removePhoto = (index, isExisting) => {
    if (isExisting) {
      // Удаляем существующее фото
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
      setStatus('Фото будет удалено при сохранении');
    } else {
      // Удаляем новое фото
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = true;
    if (!formData.description.trim()) errors.description = true;
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = true;
    if (!formData.categoryId) errors.categoryId = true;
    if (!formData.location.trim()) errors.location = true;
    
    return errors;
  };

  const getErrorStyle = (field) => {
    return fieldErrors[field] ? { borderColor: '#ef4444', borderWidth: '2px' } : {};
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setStatus('❌ Заполните выделенные обязательные поля');
      
      const firstErrorField = Object.keys(errors)[0];
      const fieldElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldElement.focus({ preventScroll: true });
      }
      return;
    }
    
    setStatus('');
    setUploading(true);
    
    try {
      const initData = localStorage.getItem('telegram_init_data');
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('propertyDetails', JSON.stringify(propertyDetails));
      
      // Добавляем новые фото
      photos.forEach(photo => {
        formDataToSend.append('photos', photo.file);
      });
      
      console.log('Updating ad with ID:', ad.id);
      
      const res = await fetch(`${API_BASE}/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'telegram-init-data': initData },
        body: formDataToSend
      });
      
      const data = await res.json();
      console.log('Update response:', data);
      
      if (res.ok) {
        setStatus('✅ Объявление успешно обновлено!');
        setTimeout(() => {
          onUpdate && onUpdate(data.ad);
          onBack();
        }, 1500);
      } else {
        setStatus(`❌ ${data.error || 'Ошибка обновления'}`);
      }
    } catch (err) {
      console.error('Ошибка обновления:', err);
      setStatus('❌ Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  // Рендер полей недвижимости
  const renderRealEstateFields = () => {
    const selectedSubcategory = realEstateSubcats.find(cat => cat.id === parseInt(formData.categoryId));
    if (!selectedSubcategory) return null;
    const subcatName = selectedSubcategory.name;

    return (
      <div>
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
        
        {(subcatName.includes('Квартиры') || subcatName.includes('Комнаты')) && (
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
        )}
      </div>
    );
  };

  // Если загружается - показываем индикатор
  if (isLoading) {
    return (
      <div style={loadingPageStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Загрузка данных объявления...</p>
      </div>
    );
  }

  // Если нет данных объявления - показываем ошибку
  if (!ad) {
    return (
      <div style={errorPageStyle}>
        <div style={errorContentStyle}>
          <span className="material-symbols-outlined" style={errorIconStyle}>
            error
          </span>
          <h3 style={errorTitleStyle}>Объявление не найдено</h3>
          <p style={errorTextStyle}>Не удалось загрузить данные для редактирования.</p>
          <button onClick={onBack} style={errorButtonStyle}>
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const allPhotos = [...existingPhotos, ...photos];
  const hasRealEstateCategory = realEstateSubcats.some(cat => cat.id === parseInt(formData.categoryId));

  return (
    <div style={pageStyle}>
      {/* Loading Overlay */}
      {uploading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Обновление объявления...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={iconButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 style={titleStyle}>Редактировать объявление</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Photos Section */}
        <div style={sectionStyle}>
          <div style={photoSectionStyle}>
            {allPhotos.length > 0 ? (
              <div style={photosGridStyle}>
                {allPhotos.map((photo, index) => (
                  <div key={index} style={photoItemStyle}>
                    <img 
                      src={photo.url || photo.preview} 
                      alt={`Preview ${index + 1}`}
                      style={photoImageStyle}
                    />
                    <button 
                      onClick={() => removePhoto(index, photo.isExisting)}
                      style={removePhotoButtonStyle}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                    {photo.isExisting && (
                      <div style={existingBadgeStyle}>
                        Было
                      </div>
                    )}
                  </div>
                ))}
                {allPhotos.length < 10 && (
                  <div 
                    style={addMorePhotoStyle}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
                    <span style={{ fontSize: 12 }}>+ добавить</span>
                  </div>
                )}
              </div>
            ) : (
              <div 
                style={photoPlaceholderStyle}
                onClick={() => fileInputRef.current?.click()}
              >
                <p style={photoTitleStyle}>Добавьте фото</p>
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
        {hasRealEstateCategory && (
          <div style={sectionStyle}>
            <h3 style={{ ...labelStyle, marginBottom: '12px' }}>Параметры недвижимости</h3>
            {renderRealEstateFields()}
          </div>
        )}

        {/* Местоположение */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Местоположение *</label>
          <input
            data-field="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            style={{ ...inputStyle, ...getErrorStyle('location') }}
            placeholder="Введите адрес"
            maxLength="200"
          />
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
          {uploading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}

// Стили
const pageStyle = { 
  backgroundColor: '#f6f6f8', 
  minHeight: '100vh', 
  display: 'flex', 
  flexDirection: 'column',
  position: 'relative'
};

const headerStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '16px', 
  backgroundColor: 'white', 
  borderBottom: '1px solid #eee',
  paddingTop: 'calc(20px + env(safe-area-inset-top, 0))',
  height: '80px',
  minHeight: '80px'
};

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
};

const titleStyle = { 
  fontSize: 18, 
  fontWeight: 'bold', 
  color: '#0d121b' 
};

const contentStyle = { 
  flex: 1, 
  padding: '16px', 
  paddingBottom: 100 
};

const sectionStyle = { 
  marginBottom: 24 
};

const photoSectionStyle = { 
  border: '2px dashed #e5e7eb', 
  borderRadius: 12, 
  backgroundColor: 'rgba(255,255,255,0.5)', 
  overflow: 'hidden' 
};

const photoPlaceholderStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  gap: 12, 
  padding: '40px 20px', 
  textAlign: 'center', 
  cursor: 'pointer' 
};

const photoTitleStyle = { 
  fontSize: 18, 
  fontWeight: 'bold', 
  color: '#0d121b', 
  margin: 0 
};

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
};

const photoHintStyle = { 
  fontSize: 12, 
  color: '#9ca3af', 
  margin: 0 
};

const photosGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  padding: 8
};

const photoItemStyle = {
  position: 'relative',
  aspectRatio: '1'
};

const photoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8
};

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
};

const existingBadgeStyle = {
  position: 'absolute',
  bottom: 4,
  left: 4,
  backgroundColor: 'rgba(70, 168, 193, 0.9)',
  color: 'white',
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 4
};

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
};

const inputGroupStyle = { 
  marginBottom: 16 
};

const labelStyle = { 
  display: 'block', 
  fontSize: 16, 
  fontWeight: '500', 
  color: '#0d121b', 
  marginBottom: 8 
};

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
};

const selectStyle = { 
  ...inputStyle, 
  cursor: 'pointer' 
};

const conditionButtonsStyle = { 
  display: 'flex', 
  gap: 12 
};

const conditionButtonStyle = { 
  flex: 1, 
  height: 48, 
  border: '1px solid #e5e7eb', 
  borderRadius: 12, 
  backgroundColor: 'white', 
  fontSize: 16, 
  cursor: 'pointer', 
  color: '#6b7280' 
};

const conditionButtonActiveStyle = { 
  ...conditionButtonStyle, 
  backgroundColor: '#46A8C1', 
  color: 'white', 
  borderColor: '#46A8C1' 
};

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
};

const loadingSpinnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #46A8C1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const loadingTextStyle = {
  margin: 0,
  color: '#46A8C1',
  fontSize: '16px',
  fontWeight: '500'
};

const footerStyle = { 
  position: 'fixed', 
  bottom: 0, 
  left: 0, 
  right: 0, 
  padding: '16px', 
  backgroundColor: 'white', 
  borderTop: '1px solid #eee' 
};

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
};

const statusStyle = (text) => ({ 
  padding: '12px 16px', 
  borderRadius: 8, 
  backgroundColor: text.includes('✅') ? '#d1fae5' : '#fee2e2', 
  color: text.includes('✅') ? '#065f46' : '#b91c1c', 
  textAlign: 'center', 
  marginTop: 16 
});

const loadingPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px'
};

const errorPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px'
};

const errorContentStyle = {
  textAlign: 'center',
  maxWidth: '300px'
};

const errorIconStyle = {
  fontSize: 64,
  color: '#e5e7eb',
  marginBottom: '16px'
};

const errorTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '8px'
};

const errorTextStyle = {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: '24px'
};

const errorButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: 14,
  fontWeight: '500',
  cursor: 'pointer'
};

export default EditAd;