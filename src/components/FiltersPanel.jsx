// frontend/src/components/FiltersPanel.jsx
import React, { useState, useEffect } from 'react';

// Определяем все возможные фильтры и их типы/компоненты
const ALL_FILTERS_CONFIG = {
  // Общие
  min_price: { label: 'Цена от', type: 'number', group: 'Общие', unit: '₽' },
  max_price: { label: 'Цена до', type: 'number', group: 'Общие', unit: '₽' },
  location: { label: 'Местоположение', type: 'text', group: 'Общие' },

  // Недвижимость - общие
  transaction_type: { label: 'Тип сделки', type: 'select', options: ['', 'sell', 'rent', 'rent_daily'], group: 'Недвижимость' },
  total_area_min: { label: 'Площадь от', type: 'number', unit: 'м²', group: 'Недвижимость' },
  total_area_max: { label: 'Площадь до', type: 'number', unit: 'м²', group: 'Недвижимость' },
  rooms: { label: 'Комнат', type: 'select', options: ['', '1', '2', '3', '4', '5'], group: 'Недвижимость' },
  floor_min: { label: 'Этаж от', type: 'number', group: 'Недвижимость' },
  floor_max: { label: 'Этаж до', type: 'number', group: 'Недвижимость' },
  total_floors_min: { label: 'Всего этажей от', type: 'number', group: 'Недвижимость' },
  total_floors_max: { label: 'Всего этажей до', type: 'number', group: 'Недвижимость' },
  building_type: { label: 'Тип дома', type: 'select', options: ['', 'panel', 'brick', 'monolith', 'wooden', 'block'], group: 'Недвижимость' },
  condition_detail: { label: 'Состояние', type: 'select', options: ['', 'needs_repair', 'cosmetic_repair', 'euro_repair', 'designer_repair', 'new_finish'], group: 'Недвижимость' },
  furniture: { label: 'Мебель', type: 'select', options: ['', 'none', 'partial', 'full'], group: 'Недвижимость' },
  bathroom_type: { label: 'Санузел', type: 'select', options: ['', 'separate', 'combined', 'multiple'], group: 'Недвижимость' },
  balcony: { label: 'Балкон / лоджия', type: 'select', options: ['', 'balcony', 'loggia', 'both', 'none'], group: 'Недвижимость' },
  lift: { label: 'Лифт', type: 'select', options: ['', 'passenger', 'cargo', 'both', 'none'], group: 'Недвижимость' },
  parking: { label: 'Парковка', type: 'select', options: ['', 'open', 'covered', 'guarded', 'none'], group: 'Недвижимость' },

  // Недвижимость - квартиры
  area_room_min: { label: 'Площадь комнаты от', type: 'number', unit: 'м²', group: 'Квартиры' },
  area_room_max: { label: 'Площадь комнаты до', type: 'number', unit: 'м²', group: 'Квартиры' },
  area_apartment_min: { label: 'Площадь квартиры от', type: 'number', unit: 'м²', group: 'Квартиры' },
  area_apartment_max: { label: 'Площадь квартиры до', type: 'number', unit: 'м²', group: 'Квартиры' },
  room_type: { label: 'Тип комнаты', type: 'select', options: ['', 'isolated', 'pass_through'], group: 'Квартиры' },
  neighbors: { label: 'Соседи', type: 'text', group: 'Квартиры' },

  // Недвижимость - дома
  floors_min: { label: 'Количество этажей от', type: 'number', group: 'Дома / Дачи / Коттеджи' },
  floors_max: { label: 'Количество этажей до', type: 'number', group: 'Дома / Дачи / Коттеджи' },
  material_type: { label: 'Материал стен', type: 'select', options: ['', 'wood', 'brick', 'panel', 'block', 'frame'], group: 'Дома / Дачи / Коттеджи' },
  utilities: { label: 'Коммуникации', type: 'text', group: 'Дома / Дачи / Коттеджи' },
  heating_type: { label: 'Отопление', type: 'select', options: ['', 'gas', 'electric', 'solid_fuel', 'none'], group: 'Дома / Дачи / Коттеджи' },
  gas: { label: 'Газ', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },
  water: { label: 'Вода', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },
  sewage: { label: 'Канализация', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },
  garage: { label: 'Гараж', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },
  outbuildings: { label: 'Хозпостройки', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },
  bathhouse: { label: 'Баня', type: 'checkbox', group: 'Дома / Дачи / Коттеджи' },

  // Недвижимость - земля
  plot_area_min: { label: 'Площадь участка от', type: 'number', unit: 'соток', group: 'Земельные участки' },
  plot_area_max: { label: 'Площадь участка до', type: 'number', unit: 'соток', group: 'Земельные участки' },
  land_category: { label: 'Категория земли', type: 'select', options: ['', 'IZHS', 'LPH', 'SNT', 'commercial', 'agricultural'], group: 'Земельные участки' },
  allowed_use: { label: 'Разрешённое использование', type: 'text', group: 'Земельные участки' },
  terrain: { label: 'Рельеф', type: 'select', options: ['', 'flat', 'slope', 'hilly'], group: 'Земельные участки' },
  access_road: { label: 'Подъездные пути', type: 'select', options: ['', 'asphalt', 'gravel', 'dirt'], group: 'Земельные участки' },

  // Недвижимость - гаражи
  area_min: { label: 'Площадь от', type: 'number', unit: 'м²', group: 'Гаражи и машиноместа' },
  area_max: { label: 'Площадь до', type: 'number', unit: 'м²', group: 'Гаражи и машиноместа' },
garage_type: { label: 'Тип гаража', type: 'select', options: ['', 'garage', 'parking_space', 'box', 'canopy'], group: 'Гаражи и машиноместа' }, 
  heating: { label: 'Отопление', type: 'checkbox', group: 'Гаражи и машиноместа' },
  security: { label: 'Охрана', type: 'checkbox', group: 'Гаражи и машиноместа' },
  floor: { label: 'Этаж', type: 'number', group: 'Гаражи и машиноместа' },

  // Недвижимость - новостройки
  completion_quarter: { label: 'Сдача (квартал)', type: 'select', options: ['', 'Q1', 'Q2', 'Q3', 'Q4'], group: 'Новостройки' },
  completion_year: { label: 'Сдача (год)', type: 'number', group: 'Новостройки' },
  finish_type: { label: 'Отделка', type: 'select', options: ['', 'rough', 'finish'], group: 'Новостройки' },
  developer: { label: 'Застройщик', type: 'text', group: 'Новостройки' },
  mortgage_friendly: { label: 'Подходит под ипотеку', type: 'checkbox', group: 'Новостройки' },

  // Недвижимость - посуточно
  guests_min: { label: 'Гостей от', type: 'number', group: 'Посуточная аренда' },
  guests_max: { label: 'Гостей до', type: 'number', group: 'Посуточная аренда' },
  bedrooms_min: { label: 'Спальен от', type: 'number', group: 'Посуточная аренда' },
  bedrooms_max: { label: 'Спальен до', type: 'number', group: 'Посуточная аренда' },
  amenities: { label: 'Удобства', type: 'text', group: 'Посуточная аренда' },
  checkin_time: { label: 'Время заезда', type: 'text', group: 'Посуточная аренда' },
  checkout_time: { label: 'Время выезда', type: 'text', group: 'Посуточная аренда' },
  rules: { label: 'Правила', type: 'text', group: 'Посуточная аренда' },
  pets_allowed: { label: 'Можно с животными', type: 'checkbox', group: 'Посуточная аренда' },
  smoking_allowed: { label: 'Можно курить', type: 'checkbox', group: 'Посуточная аренда' },

  // Недвижимость - отели
  services: { label: 'Услуги', type: 'text', group: 'Отели / Апартаменты' },
  wifi: { label: 'Wi-Fi', type: 'checkbox', group: 'Отели / Апартаменты' },
  breakfast: { label: 'Завтрак', type: 'checkbox', group: 'Отели / Апартаменты' },
  reception: { label: 'Ресепшн', type: 'checkbox', group: 'Отели / Апартаменты' },
  cleaning: { label: 'Уборка', type: 'checkbox', group: 'Отели / Апартаменты' },
  air_conditioning: { label: 'Кондиционер', type: 'checkbox', group: 'Отели / Апартаменты' },

  // Недвижимость - коммерческая
  property_type: { label: 'Тип коммерции', type: 'select', options: ['', 'office', 'retail', 'warehouse', 'production', 'psn'], group: 'Коммерческая недвижимость' },
  power_supply_kw: { label: 'Электрическая мощность', type: 'number', unit: 'кВт', group: 'Коммерческая недвижимость' },
  entrance_type: { label: 'Тип входа', type: 'select', options: ['', 'street', 'courtyard'], group: 'Коммерческая недвижимость' },
  ceiling_height: { label: 'Высота потолков', type: 'number', unit: 'м', group: 'Коммерческая недвижимость' },
  rooms_count: { label: 'Количество помещений', type: 'number', group: 'Коммерческая недвижимость' },

  // Дополнительные фильтры
  has_photo: { label: 'Только с фото', type: 'checkbox', group: 'Дополнительно' },
  deal_from_owner: { label: 'Собственник', type: 'checkbox', group: 'Дополнительно' },
};

// Словарь переводов для опций select
const OPTION_LABELS = {
  sell: 'Продажа',
  rent: 'Аренда',
  rent_daily: 'Посуточно',
  panel: 'Панельный',
  brick: 'Кирпичный',
  monolith: 'Монолит',
  wooden: 'Деревянный',
  block: 'Блочный',
  needs_repair: 'Требует ремонта',
  cosmetic_repair: 'Косметический ремонт',
  euro_repair: 'Евро-ремонт',
  designer_repair: 'Дизайнерский ремонт',
  new_finish: 'Новая отделка',
  none: 'Нет',
  partial: 'Частично',
  full: 'Полностью',
  separate: 'Раздельный',
  combined: 'Совмещённый',
  multiple: 'Несколько',
  balcony: 'Балкон',
  loggia: 'Лоджия',
  both: 'Балкон и лоджия',
  passenger: 'Пассажирский',
  cargo: 'Грузовой',
  open: 'Открытая',
  covered: 'Навес',
  guarded: 'Охраняемая',
  wood: 'Деревянный',
  frame: 'Каркасный',
  gas: 'Газ',
  electric: 'Электричество',
  solid_fuel: 'Твёрдое топливо',
  IZHS: 'ИЖС',
  LPH: 'ЛПХ',
  SNT: 'СНТ',
  commercial: 'Коммерческое',
  agricultural: 'Сельхозугодия',
  flat: 'Ровный',
  slope: 'Склон',
  hilly: 'Холмистый',
  asphalt: 'Асфальт',
  gravel: 'Гравий',
  dirt: 'Грунт',
  garage: 'Гараж',
  parking_space: 'Машиноместо',
  box: 'Бокс',
  awning: 'Навес',
  Q1: 'I кв.',
  Q2: 'II кв.',
  Q3: 'III кв.',
  Q4: 'IV кв.',
  rough: 'Черновая',
  finish: 'Чистовая',
  isolated: 'Изолированная',
  pass_through: 'Проходная',
  office: 'Офис',
  retail: 'Торговая площадь',
  warehouse: 'Склад',
  production: 'Производство',
  psn: 'ПСН',
  street: 'С улицы',
  courtyard: 'Со двора',
  // ... другие переводы
};

function FiltersPanel({ filters, onFiltersChange, onApply, onReset, onClose, category, applicableFilterKeys }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply(localFilters);
  };

  const handleReset = () => {
    // Сбрасываем только те фильтры, которые могут быть применимы к текущему типу
    // или являются общими
    const resetFilters = { ...filters }; // Начинаем с текущих фильтров
    Object.keys(resetFilters).forEach(key => {
      // Проверяем, является ли фильтр общим или применимым
      const isCommonFilter = ['min_price', 'max_price', 'location', 'has_photo', 'deal_from_owner'].includes(key);
      if (isCommonFilter || applicableFilterKeys.has(key)) {
         if (ALL_FILTERS_CONFIG[key]?.type === 'checkbox') {
          resetFilters[key] = false;
        } else {
          resetFilters[key] = ''; // Сбрасываем применимые
        }
      }
    });

    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset(resetFilters);
  };

  // Определяем, какие фильтры показывать
  // Общие фильтры + применимые к категории
  const alwaysVisible = ['min_price', 'max_price', 'location', 'has_photo', 'deal_from_owner'];
  const filtersToShow = [...new Set([...alwaysVisible, ...Array.from(applicableFilterKeys)])];

  const renderFilter = (key) => {
    const config = ALL_FILTERS_CONFIG[key];
    if (!config) return null; // Защита от неизвестных ключей

    const value = localFilters[key];
    const label = config.label;
    const unit = config.unit || '';

    switch (config.type) {
      case 'number':
        return (
          <div key={key} style={inputRowStyle}>
            <label style={labelStyle}>{label}:</label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value ? parseFloat(e.target.value) : '')}
              style={inputStyle}
            />
            {unit && <span style={{ marginLeft: '4px' }}>{unit}</span>}
          </div>
        );
      case 'text':
        return (
          <div key={key} style={inputRowStyle}>
            <label style={labelStyle}>{label}:</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              style={inputStyle}
            />
          </div>
        );
      case 'select':
        return (
          <div key={key} style={inputRowStyle}>
            <label style={labelStyle}>{label}:</label>
            <select
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              style={selectStyle}
            >
              {config.options.map(opt => (
                <option key={opt} value={opt}>
                  {OPTION_LABELS[opt] || opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={key} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={!!value} // Приводим к булю
              onChange={(e) => handleChange(key, e.target.checked)}
              style={checkboxStyle}
            />
            {label}
          </div>
        );
      default:
        return null;
    }
  };

  // Проверяем, является ли текущая категория или её родитель "Недвижимость"
  const isRealEstate = category && (category.name === 'Недвижимость' || applicableFilterKeys.size > 0); // Простая проверка

  return (
    <div style={filtersPanelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Фильтры</h3>
        <button onClick={onClose} style={closeButtonStyle}>×</button>
      </div>

      <div style={scrollableContentStyle}>
        {/* --- ОБЩИЕ ФИЛЬТРЫ --- */}
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Общие</h4>
          {renderFilter('min_price')}
          {renderFilter('max_price')}
          {renderFilter('location')}
        </div>

        {/* --- ФИЛЬТРЫ НЕДВИЖИМОСТИ (отображаются только если выбрана недвижимость) --- */}
        {isRealEstate && (
          <>
            <div style={sectionStyle}>
              <h4 style={sectionTitleStyle}>Недвижимость</h4>
              {filtersToShow
                .filter(key => key !== 'min_price' && key !== 'max_price' && key !== 'location') // Исключаем общие
                .map(renderFilter)}
            </div>
          </>
        )}

        {/* --- ДОПОЛНИТЕЛЬНЫЕ ФИЛЬТРЫ --- */}
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Дополнительно</h4>
          {renderFilter('has_photo')}
          {renderFilter('deal_from_owner')}
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={buttonContainerStyle}>
        <button onClick={handleReset} style={resetButtonStyle}>Сбросить</button>
        <button onClick={handleApply} style={applyButtonStyle}>Применить</button>
      </div>
    </div>
  );
}

// --- СТИЛИ ---
const filtersPanelStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  width: '100%',
  maxWidth: '100%', // Изменено с 400px
  backgroundColor: 'white',
  boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const headerStyle = {
  padding: '16px',
  borderBottom: '1px solid #eee',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'white',
  position: 'sticky',
  top: 0,
  zIndex: 2,
};

const titleStyle = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0d121b',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
};

const scrollableContentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  paddingBottom: '80px',
  width: '100%',
  boxSizing: 'border-box',
  WebkitOverflowScrolling: 'touch'
}

const sectionStyle = {
  marginBottom: '20px',
};

const sectionTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0d121b',
  marginBottom: '12px',
};

const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '8px',
};

const labelStyle = {
  fontSize: '14px',
  color: '#0d121b',
  minWidth: '150px', // Для выравнивания
  marginRight: '10px',
};

const inputStyle = {
  flex: 1,
  padding: '10px 12px',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
};

const selectStyle = { ...inputStyle };

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#0d121b',
  marginBottom: '8px',
};

const checkboxStyle = {
  width: 16,
  height: 16,
};

const buttonContainerStyle = {
  padding: '16px',
  display: 'flex',
  gap: '12px',
  borderTop: '1px solid #eee',
  backgroundColor: 'white',
  position: 'sticky',
  bottom: 0,
  zIndex: 2,
};

const resetButtonStyle = {
  flex: 1,
  padding: '12px',
  backgroundColor: '#f0f0f0',
  color: '#0d121b',
  border: '1px solid #ccc',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: '500',
  cursor: 'pointer',
};

const applyButtonStyle = {
  flex: 1,
  padding: '12px',
  backgroundColor: '#46A8C1',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: '500',
  cursor: 'pointer',
};

export default FiltersPanel;