// frontend/src/components/AdDetail.jsx
import { useState, useEffect } from 'react';

function AdDetail({ ad, onBack }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  // Получаем массив фотографий
  const getPhotos = () => {
    if (ad?.photo_urls && ad.photo_urls.length > 0) {
      return ad.photo_urls;
    }
    if (ad?.photo_url) {
      return [ad.photo_url];
    }
    return [];
  };

  // Форматируем дату публикации
  const getTimeAgo = (createdAt) => {
    if (!createdAt) return 'Недавно';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дня назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} месяца назад`;
    return `${Math.floor(diffDays / 365)} года назад`;
  };

  // Форматируем цену
  const formatPrice = (price) => {
    if (!price) return '0 ₽';
    
    const numPrice = parseFloat(price);
    if (Number.isInteger(numPrice)) {
      return `${numPrice.toLocaleString('ru-RU')} ₽`;
    } else {
      return `${numPrice.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })} ₽`;
    }
  };

  // Функция для получения читабельных названий полей
  const getFieldLabel = (key) => {
    const labels = {
      transaction_type: 'Тип сделки',
      total_area: 'Общая площадь',
      rooms: 'Количество комнат',
      floor: 'Этаж',
      total_floors: 'Всего этажей',
      building_type: 'Тип дома',
      condition_detail: 'Состояние',
      furniture: 'Мебель',
      bathroom_type: 'Санузел',
      balcony: 'Балкон/лоджия',
      lift: 'Лифт',
      parking: 'Парковка',
      ceiling_height: 'Высота потолков',
      year_built: 'Год постройки',
      mortgage_friendly: 'Подходит под ипотеку',
      gas: 'Газ',
      electricity: 'Электричество',
      water: 'Вода',
      heating_system: 'Отопление',
      plot_area: 'Площадь участка',
      land_category: 'Категория земли',
      allowed_use: 'Разрешённое использование',
      utilities: 'Коммуникации',
      terrain: 'Рельеф',
      access_road: 'Подъездные пути',
      living_area: 'Жилая площадь',
      kitchen_area: 'Площадь кухни',
      property_type: 'Тип объекта',
      room_type: 'Тип комнаты',
      wall_material: 'Материал стен',
      sewage: 'Канализация',
      garage: 'Гараж',
      outbuildings: 'Хозпостройки',
      bathhouse: 'Баня',
      gate_type: 'Тип ворот',
      construction_material: 'Материал постройки',
      security: 'Охрана',
      bedrooms: 'Количество спален',
      guests: 'Максимум гостей',
      wifi: 'Wi-Fi',
      breakfast: 'Завтрак',
      transfer: 'Трансфер',
      reception: 'Ресепшн 24/7',
      cleaning: 'Уборка',
      ac: 'Кондиционер',
      developer: 'Застройщик',
      project_name: 'Название проекта',
      delivery_date: 'Срок сдачи',
      contract_type: 'Тип договора',
      power: 'Электрическая мощность',
      loading_lift: 'Грузовой лифт',
      metro: 'Метро',
      metro_distance: 'Расстояние до метро',
      owner_type: 'Тип собственника',
      is_negotiable: 'Договорная цена',
      check_in: 'Время заезда',
      check_out: 'Время выезда',
      pets_allowed: 'Можно с животными',
      smoking_allowed: 'Можно курить',
      parties_allowed: 'Можно вечеринки',
      tv: 'Телевизор',
      washing_machine: 'Стиральная машина',
      dishwasher: 'Посудомоечная машина'
    };
    return labels[key] || key.replace(/_/g, ' ');
  };

  // Функция для форматирования значений
  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Булевые значения
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    
    // Массивы (например, utilities)
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Нет';
    }
    
    // Числовые значения с единицами измерения
    const unitMap = {
      total_area: ' м²',
      plot_area: ' соток',
      living_area: ' м²',
      kitchen_area: ' м²',
      ceiling_height: ' м',
      year_built: ' г.',
      power: ' кВт',
      metro_distance: ' мин.',
      price: ' ₽'
    };
    
    if (unitMap[key]) {
      return `${value}${unitMap[key]}`;
    }
    
    // Типы сделок
    if (key === 'transaction_type') {
      const types = {
        buy: 'Купить',
        sell: 'Продать',
        rent: 'Снять',
        rent_out: 'Сдать',
        daily: 'Посуточно'
      };
      return types[value] || value;
    }
    
    // Состояние
    if (key === 'condition_detail') {
      const conditions = {
        needs_repair: 'Требует ремонта',
        cosmetic_repair: 'Косметический ремонт',
        euro_repair: 'Евро-ремонт',
        designer_repair: 'Дизайнерский ремонт',
        new_finish: 'Новая отделка',
        none: 'Без отделки',
        rough: 'Черновая',
        clean: 'Чистовая',
        euro: 'Евро',
        designer: 'Дизайнерская'
      };
      return conditions[value] || value;
    }
    
    // Типы дома
    if (key === 'building_type') {
      const types = {
        panel: 'Панельный',
        brick: 'Кирпичный',
        monolith: 'Монолит',
        wooden: 'Деревянный',
        block: 'Блочный'
      };
      return types[value] || value;
    }
    
    // Категория земли
    if (key === 'land_category') {
      const categories = {
        IZHS: 'ИЖС',
        LPH: 'ЛПХ',
        SNT: 'СНТ',
        dacha: 'Дачное',
        commercial: 'Коммерческое',
        agricultural: 'Сельхозугодия',
        industrial: 'Промышленность'
      };
      return categories[value] || value;
    }
    
    // Санузел
    if (key === 'bathroom_type') {
      const types = {
        separate: 'Раздельный',
        combined: 'Совмещённый',
        two_or_more: 'Два и более',
        multiple: 'Несколько'
      };
      return types[value] || value;
    }
    
    // Балкон
    if (key === 'balcony') {
      const types = {
        none: 'Нет',
        balcony: 'Балкон',
        loggia: 'Лоджия',
        both: 'Балкон и лоджия'
      };
      return types[value] || value;
    }
    
    // Лифт
    if (key === 'lift') {
      if (Array.isArray(value)) {
        const liftTypes = {
          passenger: 'Пассажирский',
          cargo: 'Грузовой'
        };
        return value.map(v => liftTypes[v] || v).join(', ');
      }
    }
    
    // Мебель
    if (key === 'furniture') {
      const types = {
        none: 'Нет',
        partial: 'Частично',
        full: 'Полностью'
      };
      return types[value] || value;
    }
    
    // Тип собственника
    if (key === 'owner_type') {
      const types = {
        owner: 'Собственник',
        agent: 'Агент',
        agency: 'Агентство'
      };
      return types[value] || value;
    }
    
    // Материал стен
    if (key === 'wall_material') {
      const materials = {
        brick: 'Кирпич',
        wood: 'Дерево',
        foam_block: 'Пеноблок',
        aerated_concrete: 'Газобетон',
        frame: 'Каркасный'
      };
      return materials[value] || value;
    }
    
    // Отопление
    if (key === 'heating_system') {
      const types = {
        gas: 'Газовое',
        electric: 'Электрическое',
        solid_fuel: 'Твердотопливное',
        central: 'Центральное'
      };
      return types[value] || value;
    }
    
    // Рельеф
    if (key === 'terrain') {
      const types = {
        flat: 'Ровный',
        slope: 'Склон',
        hilly: 'Холмистый',
        forest: 'Лесной'
      };
      return types[value] || value;
    }
    
    // Подъездные пути
    if (key === 'access_road') {
      const types = {
        asphalt: 'Асфальт',
        concrete: 'Бетон',
        gravel: 'Гравий',
        dirt: 'Грунт'
      };
      return types[value] || value;
    }
    
    // Тип договора
    if (key === 'contract_type') {
      const types = {
        ddu: 'ДДУ',
        assignment: 'Переуступка',
        participation: 'Договор участия'
      };
      return types[value] || value;
    }
    
    // Тип гаража
    if (key === 'property_type' && ad?.category_name?.includes('Гаражи')) {
      const types = {
        garage: 'Гараж',
        parking_space: 'Машиноместо',
        box: 'Бокс',
        canopy: 'Навес'
      };
      return types[value] || value;
    }
    
    // Тип комнаты
    if (key === 'room_type') {
      const types = {
        isolated: 'Изолированная',
        passage: 'Проходная'
      };
      return types[value] || value;
    }
    
    // Тип планировки квартиры
    if (key === 'property_type' && ad?.category_name?.includes('Квартиры')) {
      const types = {
        studio: 'Студия',
        free: 'Свободная',
        classic: 'Классическая',
        euro: 'Евро'
      };
      return types[value] || value;
    }
    
    // Тип дома/коттеджа
    if (key === 'property_type' && (ad?.category_name?.includes('Дома') || ad?.category_name?.includes('Коттеджи') || ad?.category_name?.includes('Дачи'))) {
      const types = {
        house: 'Дом',
        cottage: 'Коттедж',
        dacha: 'Дача',
        townhouse: 'Таунхаус'
      };
      return types[value] || value;
    }
    
    return value;
  };

  // Группировка параметров по категориям
  const getPropertyGroups = () => {
    if (!ad?.property_details) return [];
    
    const propertyDetails = ad.property_details;
    const groups = [];
    
    // Основные параметры (всегда показываем)
    const mainParams = [
      'transaction_type', 'total_area', 'rooms', 'floor', 'total_floors',
      'building_type', 'condition_detail', 'furniture', 'bathroom_type',
      'balcony', 'parking', 'ceiling_height', 'year_built'
    ];
    
    const mainGroup = mainParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (mainGroup.length > 0) {
      groups.push({
        title: 'Основные параметры',
        items: mainGroup
      });
    }
    
    // Параметры для домов/коттеджей
    const houseParams = [
      'living_area', 'kitchen_area', 'wall_material', 'plot_area',
      'land_category', 'heating_system', 'gas', 'water', 'electricity',
      'sewage', 'garage', 'outbuildings', 'bathhouse', 'access_road'
    ];
    
    const houseGroup = houseParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (houseGroup.length > 0) {
      groups.push({
        title: 'Параметры дома',
        items: houseGroup
      });
    }
    
    // Параметры для земельных участков
    const landParams = [
      'plot_area', 'land_category', 'allowed_use', 'utilities',
      'terrain', 'access_road'
    ];
    
    const landGroup = landParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (landGroup.length > 0) {
      groups.push({
        title: 'Параметры участка',
        items: landGroup
      });
    }
    
    // Параметры для новостроек
    const newbuildingParams = [
      'developer', 'project_name', 'delivery_date', 'contract_type',
      'mortgage_friendly'
    ];
    
    const newbuildingGroup = newbuildingParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (newbuildingGroup.length > 0) {
      groups.push({
        title: 'Информация о новостройке',
        items: newbuildingGroup
      });
    }
    
    // Параметры для посуточной аренды
    const rentalParams = [
      'bedrooms', 'guests', 'wifi', 'ac', 'parking', 'check_in', 'check_out',
      'pets_allowed', 'smoking_allowed', 'parties_allowed', 'tv',
      'washing_machine', 'dishwasher'
    ];
    
    const rentalGroup = rentalParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (rentalGroup.length > 0) {
      groups.push({
        title: 'Условия аренды',
        items: rentalGroup
      });
    }
    
    // Параметры для отелей
    const hotelParams = [
      'rooms', 'guests', 'wifi', 'breakfast', 'parking', 'transfer',
      'reception', 'cleaning', 'ac'
    ];
    
    const hotelGroup = hotelParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (hotelGroup.length > 0) {
      groups.push({
        title: 'Услуги отеля',
        items: hotelGroup
      });
    }
    
    // Параметры для коммерческой недвижимости
    const commercialParams = [
      'power', 'loading_lift', 'entrance_type', 'rooms_count'
    ];
    
    const commercialGroup = commercialParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (commercialGroup.length > 0) {
      groups.push({
        title: 'Коммерческие параметры',
        items: commercialGroup
      });
    }
    
    // Дополнительные параметры
    const additionalParams = [
      'metro', 'metro_distance', 'owner_type', 'is_negotiable'
    ];
    
    const additionalGroup = additionalParams
      .filter(key => propertyDetails[key] !== undefined && propertyDetails[key] !== '')
      .map(key => ({
        label: getFieldLabel(key),
        value: formatValue(key, propertyDetails[key])
      }));
    
    if (additionalGroup.length > 0) {
      groups.push({
        title: 'Дополнительная информация',
        items: additionalGroup
      });
    }
    
    return groups;
  };

  // Форматирование адреса
  const formatLocationForDetail = (location) => {
    if (!location || location.trim() === '') {
      return [{ text: 'Местоположение не указано', type: 'empty' }];
    }
    
    const parts = location.split(', ');
    let country = '';
    let city = '';
    let street = '';
    let house = '';
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      
      if (part.includes('д.')) {
        house = part;
      } else if (part.includes('ул.')) {
        street = part;
      } else if (
        !part.match(/^\d{5,6}$/) &&
        !part.includes('район') &&
        !part.includes('область') &&
        !part.includes('округ') &&
        !part.includes('муниципальный')
      ) {
        if (!country) {
          country = part;
        } else if (!city) {
          city = part;
        }
      }
    }
    
    const resultParts = [];
    if (country) resultParts.push({ text: country, type: 'country' });
    if (city) resultParts.push({ text: city, type: 'city' });
    if (street) resultParts.push({ text: street, type: 'street' });
    if (house) resultParts.push({ text: house, type: 'house' });
    
    if (resultParts.length === 0) {
      return parts.map(part => ({ text: part, type: 'regular' }));
    }
    
    return resultParts;
  };

  const getInitialsFromTelegram = (user) => {
    if (!user) return 'П';
    if (user.user_first_name) {
      return user.user_first_name[0].toUpperCase();
    }
    if (user.user_username) {
      return user.user_username[0].toUpperCase();
    }
    return 'П';
  };

  const getNameFromTelegram = (user) => {
    if (!user) return 'Пользователь';
    
    // Если есть имя и фамилия
    if (user.user_first_name && user.user_last_name) {
      return `${user.user_first_name} ${user.user_last_name}`;
    }
    
    // Если только имя
    if (user.user_first_name) {
      return user.user_first_name;
    }
    
    // Если только username
    if (user.user_username) {
      return `@${user.user_username}`;
    }
    
    return 'Пользователь';
  };

  const photos = getPhotos();
  const totalPhotos = photos.length;
  const hasLocation = ad?.location && ad.location.trim() !== '';
  const formattedLocation = formatLocationForDetail(ad?.location);
  const propertyGroups = getPropertyGroups();

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [ad]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Открываем адрес в Google Maps
  const openInMaps = () => {
    if (!hasLocation) return;
    
    const encodedAddress = encodeURIComponent(ad.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Функция для открытия Telegram с предзаполненным сообщением
const openTelegramChat = (username, adTitle = '') => {
  if (!username) {
    alert('У пользователя нет username в Telegram');
    return;
  }
  
  // Создаём текст сообщения
  let message = 'Здравствуйте! Пишу по поводу объявления на SpaceGo.';
  
  if (adTitle) {
    message += `\n\nОбъявление: "${adTitle}"`;
  }
  
  message += '\n\nМожем обсудить детали?';
  
  // Кодируем сообщение для URL
  const encodedMessage = encodeURIComponent(message);
  
  // Ссылка с предзаполненным сообщением
  const telegramUrl = `https://t.me/${username}?text=${encodedMessage}`;
  
  console.log('Opening Telegram URL:', telegramUrl);
  
  // Пытаемся открыть через Telegram WebApp если внутри Telegram
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.openTelegramLink(telegramUrl);
  } else {
    // Иначе обычная ссылка
    window.open(telegramUrl, '_blank');
  }
};

  return (
    <div style={detailPageStyle}>
      {/* Header */}
      <div style={detailHeaderStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button style={shareButtonStyle}>
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>

      {/* Image Slider */}
      <div style={detailImageWrapperStyle}>
        {totalPhotos > 0 && !imageErrors[currentPhotoIndex] ? (
          <>
            <div style={imageContainerStyle}>
              <img 
                src={photos[currentPhotoIndex]} 
                alt={`${ad?.title || 'Объявление'} - фото ${currentPhotoIndex + 1}`}
                style={detailImageStyle}
                onError={() => handleImageError(currentPhotoIndex)}
              />
            </div>
            
            {/* Навигационные кнопки */}
            {totalPhotos > 1 && (
              <>
                <button 
                  onClick={prevPhoto} 
                  style={{...navButtonStyle, left: 8}}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={nextPhoto} 
                  style={{...navButtonStyle, right: 8}}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </>
        ) : (
          <div style={detailImagePlaceholderStyle}>
            <span className="material-symbols-outlined" style={placeholderIconStyle}>
              photo_camera
            </span>
          </div>
        )}
        
        <button style={detailHeartButtonStyle}>
          <span className="material-symbols-outlined">favorite_border</span>
        </button>
        
        {/* Счетчик фото */}
        {totalPhotos > 0 && !imageErrors[currentPhotoIndex] && (
          <div style={imageCounterStyle}>
            {currentPhotoIndex + 1} / {totalPhotos}
          </div>
        )}
        
        {/* Индикатор точек */}
        {totalPhotos > 1 && (
          <div style={dotsStyle}>
            {photos.map((_, index) => (
              <div 
                key={index}
                onClick={() => goToPhoto(index)}
                style={index === currentPhotoIndex ? dotActiveStyle : dotStyle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={detailContentStyle}>
        <h1 style={detailTitleStyle}>{ad?.title || 'Без названия'}</h1>
        <h2 style={detailPriceStyle}>
          {ad?.property_details?.is_negotiable ? 'Цена договорная' : formatPrice(ad?.price)}
        </h2>
        <p style={detailMetaStyle}>
          Опубликовано {getTimeAgo(ad?.created_at)} • {ad?.views || 0} просмотров
        </p>

        <div style={tagsStyle}>
          <div style={tagPrimaryStyle}>{ad?.category_name || 'Без категории'}</div>
          <div style={tagGrayStyle}>{ad?.condition === 'new' ? 'Новое' : 'Б/у'}</div>
        </div>

        {/* Основное описание */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Описание</h3>
          <p style={sectionTextStyle}>
            {ad?.description || 'Описание отсутствует'}
          </p>
        </div>

        {/* Параметры недвижимости */}
        {propertyGroups.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Характеристики</h3>
            <div style={propertyDetailsContainerStyle}>
              {propertyGroups.map((group, groupIndex) => (
                <div key={groupIndex} style={propertyGroupStyle}>
                  <h4 style={propertyGroupTitleStyle}>{group.title}</h4>
                  <div style={propertyGridStyle}>
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} style={propertyItemStyle}>
                        <span style={propertyLabelStyle}>{item.label}:</span>
                        <span style={propertyValueStyle}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Местоположение */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Местоположение</h3>
          <div style={locationCardStyle}>
            <div style={locationRowStyle}>
              <span className="material-symbols-outlined" style={locationIconStyle}>
                location_on
              </span>
              <div style={locationTextStyle}>
                <div style={locationAddressStyle}>
                  {formattedLocation.map((part, index) => (
                    <span
                      key={index}
                      style={
                        part.type === 'empty' ? locationEmptyStyle :
                        part.type === 'house' ? locationHouseStyle :
                        part.type === 'street' ? locationStreetStyle :
                        part.type === 'city' ? locationCityStyle :
                        part.type === 'country' ? locationCountryStyle :
                        locationRegularStyle
                      }
                    >
                      {part.text}
                      {index < formattedLocation.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {hasLocation && (
                  <button onClick={openInMaps} style={mapLinkStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      open_in_new
                    </span>
                    <span>Открыть в Картах</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Продавец */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Продавец</h3>
          <div style={sellerCardStyle}>
            {/* Аватар */}
            {ad.user_photo_url ? (
              <img 
                src={ad.user_photo_url} 
                alt="Аватар"
                style={sellerAvatarImageStyle}
              />
            ) : (
              <div style={sellerAvatarStyle}>
                {getInitialsFromTelegram(ad)}
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              {/* Имя продавца */}
              <div style={sellerNameStyle}>
                {getNameFromTelegram(ad)}
              </div>
              
              {/* Username если есть */}
              {ad.user_username && (
                <div style={sellerUsernameStyle}>
                  @{ad.user_username}
                </div>
              )}
              
              {/* Рейтинг и дата регистрации */}
              <div style={sellerRatingStyle}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 14 }}>star</span>
                <span style={{ fontWeight: 'bold', marginRight: 4 }}>4.8</span>
                <span style={{ color: '#6b7280' }}>
                  • На Spacego с {ad?.created_at ? new Date(ad.created_at).toLocaleDateString('ru-RU') : 'недавно'}
                </span>
              </div>
            </div>
            
            {/* Кнопка перехода к профилю */}
            <button 
              style={profileButtonStyle}
              onClick={() => {
                // Можно сделать переход к профилю продавца
                console.log('Переход к профилю пользователя:', ad.user_id);
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#46A8C1', fontSize: 20 }}>person</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={detailFooterStyle}>
       <button 
      style={footerButtonSecondaryStyle}
      onClick={() => {
    if (ad.user_username) {
      // Открываем Telegram чат с пользователем с предзаполненным сообщением
      openTelegramChat(ad.user_username, ad.title);
    } else {
      alert('У пользователя нет username в Telegram');
    }
  }}
>
  <span className="material-symbols-outlined">chat_bubble</span>
  <span>Написать в TG</span>
</button>
        
        <button 
          style={footerButtonPrimaryStyle}
          onClick={() => {
            // Здесь можно сделать кнопку "Позвонить" или другую функцию
            if (ad.user_username) {
              // Альтернатива: открыть диалог в Telegram WebApp
              if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.openTelegramLink(`https://t.me/${ad.user_username}`);
              } else {
                window.open(`https://t.me/${ad.user_username}`, '_blank');
              }
            }
          }}
        >
          <span className="material-symbols-outlined">call</span>
          <span>Связаться</span>
        </button>
      </div>
    </div>
  );
}

// Стили
const detailPageStyle = {
  backgroundColor: '#f6f6f8',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const detailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee'
};

const backButtonStyle = {
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

const shareButtonStyle = {
  ...backButtonStyle
};

const detailImageWrapperStyle = {
  position: 'relative',
  backgroundColor: '#e5e7eb',
  height: '300px'
};

const detailImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: '#f6f6f8'
};

const imageContainerStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f6f6f8'
};

const detailImagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#e5e7eb'
};

const placeholderIconStyle = {
  fontSize: 64,
  color: '#9ca3af'
};

const navButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#0d121b'
};

const detailHeartButtonStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  cursor: 'pointer'
};

const imageCounterStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12
};

const dotsStyle = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0
};

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'white',
  opacity: 0.5,
  cursor: 'pointer'
};

const dotActiveStyle = {
  ...dotStyle,
  opacity: 1,
  width: 20
};

const detailContentStyle = {
  padding: '16px',
  paddingBottom: '80px'
};

const detailTitleStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0d121b',
  margin: '0 0 8px 0'
};

const detailPriceStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#46A8C1',
  margin: '0 0 8px 0'
};

const detailMetaStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 16px 0'
};

const tagsStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: '16px'
};

const tagPrimaryStyle = {
  padding: '6px 12px',
  backgroundColor: 'rgba(70, 168, 193, 0.2)',
  color: '#46A8C1',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
};

const tagGrayStyle = {
  padding: '6px 12px',
  backgroundColor: '#f0f0f0',
  color: '#4b5563',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '500'
};

const sectionStyle = {
  marginTop: '24px'
};

const sectionTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0d121b',
  marginBottom: '12px'
};

const sectionTextStyle = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: 1.5
};

// Новые стили для параметров недвижимости
const propertyDetailsContainerStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid #eee'
};

const propertyGroupStyle = {
  borderBottom: '1px solid #eee',
  padding: '16px'
};

const propertyGroupTitleStyle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #f0f0f0'
};

const propertyGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const propertyItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  fontSize: '14px',
  lineHeight: '1.4',
  padding: '4px 0'
};

const propertyLabelStyle = {
  color: '#6b7280',
  minWidth: '140px', 
  flexShrink: 0,
  paddingRight: '12px'
};

const propertyValueStyle = {
  color: '#0d121b',
  fontWeight: '500',
  flex: 1,
  wordBreak: 'break-word'
};

const locationCardStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16
};

const locationRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12
};

const locationIconStyle = {
  color: '#46A8C1',
  fontSize: 20,
  flexShrink: 0,
  marginTop: 2
};

const locationTextStyle = {
  flex: 1
};

const locationAddressStyle = {
  fontSize: 16,
  color: '#0d121b',
  fontWeight: '500',
  marginBottom: 8,
  lineHeight: 1.4
};

const locationCountryStyle = {
  color: '#0d121b',
  fontSize: '16px'
};

const locationCityStyle = {
  color: '#0d121b',
  fontSize: '16px'
};

const locationStreetStyle = {
  color: '#0d121b',
  fontSize: '16px'
};

const locationHouseStyle = {
  color: '#0d121b',
  fontSize: '16px'
};

const locationRegularStyle = {
  color: '#0d121b',
  fontSize: '16px'
};

const locationEmptyStyle = {
  color: '#0d121b',
  fontSize: '16px',
  fontStyle: 'italic'
};

const mapLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#46A8C1',
  fontSize: 14,
  cursor: 'pointer',
  padding: 0
};

const sellerCardStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: '12px',
  padding: '16px'
};

const sellerAvatarStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#46A8C1',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  marginRight: '12px'
};

const sellerNameStyle = {
  fontWeight: 'bold',
  color: '#0d121b',
  fontSize: '16px'
};

const sellerRatingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px'
};

const detailFooterStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  gap: '12px',
  padding: '16px',
  borderTop: '1px solid #eee',
  backgroundColor: 'white'
};

const footerButtonPrimaryStyle = {
  flex: 1,
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: '#46A8C1',
  color: 'white'
};

const footerButtonSecondaryStyle = {
  flex: 1,
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: 'rgba(70, 168, 193, 0.2)',
  color: '#46A8C1'
};

const sellerAvatarImageStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  objectFit: 'cover',
  marginRight: '12px'
};

const sellerUsernameStyle = {
  fontSize: '14px',
  color: '#46A8C1',
  marginTop: '2px'
};

const profileButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 20,
  transition: 'background-color 0.2s ease'
};

export default AdDetail;