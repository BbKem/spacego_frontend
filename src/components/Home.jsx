// frontend/src/components/Home.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import AdCard from './AdCard'
import { useAppCache } from '../App'
import logo from '../assets/logo.png'
import SkeletonCard from './SkeletonCard'
import FiltersPanel from './FiltersPanel'
import BottomNav from './BottomNav'

// Простая утилита для поверхностного сравнения объектов
function shallowEqual(objA, objB) {
  if (objA === objB) return true;

  if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

// --- ОПРЕДЕЛЕНИЕ ТИПОВ КАТЕГОРИЙ И ФИЛЬТРОВ ---
const CATEGORY_TYPES = {
  apartment: {
    name: 'Квартиры',
    applicableFilters: [
      'transaction_type', 'total_area_min', 'total_area_max',
      'rooms', 'floor_min', 'floor_max', 'total_floors_min', 'total_floors_max',
      'building_type', 'condition_detail', 'furniture', 'bathroom_type', 'balcony', 'lift', 'parking'
    ]
  },
  room: {
    name: 'Комнаты',
    applicableFilters: [
      'transaction_type', 'area_room_min', 'area_room_max',
      'area_apartment_min', 'area_apartment_max', 'room_type', 'furniture', 'neighbors'
    ]
  },
  house: {
    name: 'Дома / Дачи / Коттеджи',
    applicableFilters: [
      'transaction_type', 'total_area_min', 'total_area_max',
    'property_type', 'material_type', 'heating_type',
    'plot_area_min', 'plot_area_max', 'land_category',
    'floors_min', 'floors_max',
    'condition_detail', 'furniture',
    'gas', 'water', 'sewage', 'electricity',
    'garage', 'outbuildings', 'bathhouse',
    'bathroom_type', 'balcony', 'parking'
    ]
  },
  land: {
    name: 'Земельные участки',
    applicableFilters: [
      'transaction_type',  'plot_area_min', 'plot_area_max', 
      'land_category', 'allowed_use', 'utilities', 'terrain', 'access_road'
    ]
  },
  garage: {
    name: 'Гаражи и машиноместа',
    applicableFilters: [
       'transaction_type', 'total_area_min', 'total_area_max',
    'property_type',   
    'heating', 'security', 'floor',
    'parking'
    ]
  },
  newbuilding: {
    name: 'Новостройки',
    applicableFilters: [
      'transaction_type', 'total_area_min', 'total_area_max',
      'rooms', 'floor_min', 'floor_max', 'total_floors_min', 'total_floors_max',
      'building_type', 'completion_quarter', 'completion_year', 'finish_type', 'developer', 'mortgage_friendly'
    ]
  },
  dailyrental: {
    name: 'Посуточная аренда',
    applicableFilters: [
      'total_area_min', 'total_area_max',
      'guests_min', 'guests_max', 'bedrooms_min', 'bedrooms_max',
      'amenities', 'checkin_time', 'checkout_time', 'rules', 'pets_allowed', 'smoking_allowed'
    ]
  },
  hotel: {
    name: 'Отели / Апартаменты',
    applicableFilters: [
      'guests_min', 'guests_max', 'rooms_min', 'rooms_max',
      'amenities', 'services', 'parking', 'wifi', 'breakfast', 'reception', 'cleaning', 'air_conditioning'
    ]
  },
  commercial: {
    name: 'Коммерческая недвижимость',
    applicableFilters: [
      'transaction_type', 'total_area_min', 'total_area_max',
      'property_type', 'power_supply_kw', 'entrance_type', 'lift', 'parking', 'ceiling_height', 'rooms_count'
    ]
  }
};

// Функция для определения типа категории на основе её названия
const getCategoryType = (categoryName) => {
  if (!categoryName) return null;
  for (const [typeKey, typeInfo] of Object.entries(CATEGORY_TYPES)) {
    if (typeInfo.name.includes(categoryName) || categoryName.includes(typeInfo.name.split(' / ')[0])) {
      return typeKey;
    }
  }
  return null; // Для не-недвижимости или неизвестных типов
};
// --- КОНЕЦ ОПРЕДЕЛЕНИЯ ---

function Home({ user, onLogout, onViewAd, onCreateAd,setCurrentPage,safeAreaTop  }) {
  const { ads: cachedAds, categories, subcategories, getSubcategories, isLoading, refreshData, lastUpdated } = useAppCache()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredAds, setFilteredAds] = useState([])
  const [localLoading, setLocalLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false)
  const [realEstateSubcats, setRealEstateSubcats] = useState([])
  const [realEstateCat, setRealEstateCat] = useState(null)
  const [allSubcategories, setAllSubcategories] = useState([])
  const [showFilters, setShowFilters] = useState(false);

  // Используем useRef для хранения предыдущих значений
  const prevCategoryRef = useRef(null);
  const prevFiltersRef = useRef({});

  const [activeFilters, setActiveFilters] = useState({
    min_price: '',
    max_price: '',
    location: '',
    rooms: '',
    total_area_min: '',
    total_area_max: '',
    floor_min: '',
    floor_max: '',
    total_floors_min: '',
    total_floors_max: '',
    building_type: '',
    condition_detail: '',
    furniture: '',
    transaction_type: '',
    // --- Добавляем остальные возможные фильтры ---
    bathroom_type: '',
    balcony: '',
    lift: '',
    parking: '',
    area_room_min: '',
    area_room_max: '',
    area_apartment_min: '',
    area_apartment_max: '',
    room_type: '',
    neighbors: '',
    floors_min: '',
    floors_max: '',
    material_type: '',
    utilities: '',
    heating_type: '',
    gas: false,
    water: false,
    sewage: false,
    garage: false,
    outbuildings: false,
    bathhouse: false,
    land_area_min: '',
    land_area_max: '',
    land_category: '',
    allowed_use: '',
    terrain: '',
    access_road: '',
    area_min: '',
    area_max: '',
    garage_type: '',
    heating: false,
    security: false,
    floor: '',
    completion_quarter: '',
    completion_year: '',
    finish_type: '',
    developer: '',
    mortgage_friendly: false,
    guests_min: '',
    guests_max: '',
    bedrooms_min: '',
    bedrooms_max: '',
    amenities: '',
    checkin_time: '',
    checkout_time: '',
    rules: '',
    pets_allowed: false,
    smoking_allowed: false,
    services: '',
    wifi: false,
    breakfast: false,
    reception: false,
    cleaning: false,
    air_conditioning: false,
    property_type: '',
    power_supply_kw: '',
    entrance_type: '',
    ceiling_height: '',
    rooms_count: '',
    // --- Добавляем остальные возможные фильтры ---
    has_photo: false,
    deal_from_owner: false,
  });

  const suggestionsRef = useRef(null)
  const API_BASE = import.meta.env.DEV ? 'http://localhost:4000' : 'https://spacego-backend.onrender.com'

  useEffect(() => {
    const realEstate = categories?.find(cat => cat.name === 'Недвижимость')
    if (realEstate) {
      setRealEstateCat(realEstate)
      getSubcategories(realEstate.id).then(subcats => {
        setRealEstateSubcats(subcats)
        setAllSubcategories(subcats)
      })
    }
  }, [categories, getSubcategories])

  // Определяем тип категории и применимые фильтры
  const selectedCategoryType = getCategoryType(selectedCategory?.name);
  const applicableFilterKeys = useMemo(() => {
    if (selectedCategoryType) {
      return new Set(CATEGORY_TYPES[selectedCategoryType]?.applicableFilters || []);
    }
    return new Set(Object.keys(activeFilters)); // Все фильтры, если тип не определён
  }, [selectedCategoryType]);

  const backendFilters = useMemo(() => {
    // Фильтруем только те фильтры, которые применимы к текущему типу категории
    const filteredFilters = {};
    Object.keys(activeFilters).forEach(key => {
      // Включаем фильтр, если он применим к текущей категории ИЛИ если он общий (не зависит от типа)
      // Общие фильтры: min_price, max_price, location, has_photo, deal_from_owner
      const isCommonFilter = ['min_price', 'max_price', 'location', 'has_photo', 'deal_from_owner'].includes(key);
      if (isCommonFilter || applicableFilterKeys.has(key)) {
        if (activeFilters[key] !== '' && activeFilters[key] !== false) {
          filteredFilters[key] = activeFilters[key];
        }
      }
    });

    return {
      ...filteredFilters,
      category_id: selectedCategory?.id || undefined,
    };
  }, [selectedCategory, activeFilters, applicableFilterKeys]);

  // Загружаем объявления с фильтрами при изменении фильтров
  useEffect(() => {
    const prevCategory = prevCategoryRef.current;
    const prevFilters = prevFiltersRef.current;

    const categoryChanged = prevCategory?.id !== selectedCategory?.id;
    const filtersChanged = !shallowEqual(prevFilters, backendFilters);

    if (categoryChanged || filtersChanged) {
      const loadFilteredAds = async () => {
        setLocalLoading(true);
        try {
          await refreshData(backendFilters);
          // Обновляем ref'ы после успешной загрузки
          prevCategoryRef.current = selectedCategory;
          prevFiltersRef.current = backendFilters;
        } catch (error) {
          console.error("Ошибка загрузки отфильтрованных объявлений:", error);
        } finally {
          setLocalLoading(false);
        }
      };

      loadFilteredAds();
    } else {
      // Если фильтры не изменились, обновляем ref'ы, чтобы не было ложного срабатывания
      prevCategoryRef.current = selectedCategory;
      prevFiltersRef.current = backendFilters;
    }
  }, [selectedCategory, backendFilters, refreshData]); // Убран activeFilters из зависимостей, так как мы используем backendFilters и ref'ы


  // Фильтрация на фронтенде
  useEffect(() => {
    if (!cachedAds) return;

    let result = cachedAds;

    if (searchTerm) {
      result = result.filter(ad =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (activeFilters.has_photo) {
      result = result.filter(ad => ad.photo_urls && ad.photo_urls.length > 0);
    }
    // if (activeFilters.deal_from_owner) {
    //   result = result.filter(ad => ad.is_owner);
    // }

    setFilteredAds(result);
  }, [cachedAds, searchTerm, activeFilters]); // Этот эффект зависит от cachedAds, searchTerm и фронтенд-фильтров


  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await refreshData(backendFilters);
      // Обновляем ref'ы при ручном обновлении
      prevCategoryRef.current = selectedCategory;
      prevFiltersRef.current = backendFilters;
    } catch (error) {
      console.error("Ошибка обновления:", error);
    } finally {
      setLocalLoading(false);
    }
  }

  const handleCategoryClick = (category) => {
    // Если кликаем на уже выбранную категорию - снимаем выбор
    if (selectedCategory && selectedCategory.id === category.id) {
      clearFilters();
      return;
    }

    if (category.name === 'Недвижимость') {
      setSelectedCategory(category)
      setIsSubcategoriesOpen(true)
    } else {
      setSelectedCategory(category)
      setIsSubcategoriesOpen(false)
    }
  }

  const handleSubcategoryClick = (subcategory) => {
    setSelectedCategory(subcategory)
    // Не закрываем подменю
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSearchTerm('')
    setIsSubcategoriesOpen(false)
    // Сбрасываем активные фильтры
    const resetFilters = {
      min_price: '',
      max_price: '',
      location: '',
      rooms: '',
      total_area_min: '',
      total_area_max: '',
      floor_min: '',
      floor_max: '',
      total_floors_min: '',
      total_floors_max: '',
      building_type: '',
      condition_detail: '',
      furniture: '',
      transaction_type: '',
      bathroom_type: '',
      balcony: '',
      lift: '',
      parking: '',
      area_room_min: '',
      area_room_max: '',
      area_apartment_min: '',
      area_apartment_max: '',
      room_type: '',
      neighbors: '',
      floors_min: '',
      floors_max: '',
      material_type: '',
      utilities: '',
      heating_type: '',
      gas: false,
      water: false,
      sewage: false,
      garage: false,
      outbuildings: false,
      bathhouse: false,
      land_area_min: '',
      land_area_max: '',
      land_category: '',
      allowed_use: '',
      terrain: '',
      access_road: '',
      area_min: '',
      area_max: '',
      garage_type: '',
      heating: false,
      security: false,
      floor: '',
      completion_quarter: '',
      completion_year: '',
      finish_type: '',
      developer: '',
      mortgage_friendly: false,
      guests_min: '',
      guests_max: '',
      bedrooms_min: '',
      bedrooms_max: '',
      amenities: '',
      checkin_time: '',
      checkout_time: '',
      rules: '',
      pets_allowed: false,
      smoking_allowed: false,
      services: '',
      wifi: false,
      breakfast: false,
      reception: false,
      cleaning: false,
      air_conditioning: false,
      property_type: '',
      power_supply_kw: '',
      entrance_type: '',
      ceiling_height: '',
      rooms_count: '',
      has_photo: false,
      deal_from_owner: false,
    };
    setActiveFilters(resetFilters);

    // Явно вызываем refreshData с пустыми фильтрами для получения всех объявлений
    const loadAllAds = async () => {
      setLocalLoading(true);
      try {
        await refreshData(resetFilters); // Передаём сброшенные фильтры (без category_id)
        // Обновляем ref'ы после сброса
        prevCategoryRef.current = null;
        prevFiltersRef.current = resetFilters;
      } catch (error) {
        console.error("Ошибка сброса фильтров:", error);
      } finally {
        setLocalLoading(false);
      }
    };
    loadAllAds();
  }

  const openFilters = () => {
    setShowFilters(true);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  const updateLocalFilters = (newFilters) => {
    // Обновляем только локальное состояние в FiltersPanel
  };

  const applyFilters = (appliedFilters) => {
    // Устанавливаем новые фильтры, это вызовет useEffect с фильтрацией
    setActiveFilters(appliedFilters);
    closeFilters();
  };
  

  const resetFilters = (resetFiltersObj) => {
    setActiveFilters(resetFiltersObj);
  };

  const displayAds = filteredAds || []
  const displayCategories = categories || []

return (
    <div style={containerStyle}>
      <div style={{ backgroundColor: '#f6f6f8', minHeight: '150vh', paddingBottom: '80px',paddingTop: safeAreaTop}}>
        {/* TopAppBar */}
        <div style={topAppBarStyle}>
          <div style={{ width: 48 }}>
            {user && (
              <button onClick={onLogout} style={logoutButtonStyle}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            )}
          </div>
          <div style={appTitleContainerStyle}>
            <img src={logo} alt="Spacego" style={appLogoStyle} />
          </div>
          <div style={headerButtonsStyle}>
            <button
              style={refreshButtonStyle}
              onClick={handleRefresh}
              disabled={localLoading}
              title="Обновить"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  animation: localLoading ? 'spin 1s linear infinite' : 'none'
                }}
              >
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* SearchBar */}
        <div style={searchContainerStyle}>
          <div style={searchWrapperStyle}>
            <span style={searchIconStyle} className="material-symbols-outlined">search</span>
            <input
              placeholder="Поиск объявлений..."
              style={searchInputStyle}
              maxLength="100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button style={filterButtonStyle} onClick={openFilters}>
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        {/* Основные категории */}
        <div style={chipsContainerStyle}>
          <div
            key="all"
            style={!selectedCategory ? chipActiveStyle : chipStyle}
            onClick={clearFilters}
          >
            Все
          </div>

          {displayCategories.map(category => (
            <div
              key={category.id}
              style={selectedCategory && selectedCategory.id === category.id ? chipActiveStyle : chipStyle}
              onClick={() => handleCategoryClick(category)}
            >
              {category.name}
            </div>
          ))}
        </div>

        {/* Подкатегории недвижимости */}
        {isSubcategoriesOpen && realEstateCat && realEstateSubcats.length > 0 && (
          <div style={subcategoriesContainerStyle}>
            <div style={subcategoriesTitleStyle}>
              <span style={subcategoriesIconStyle} className="material-symbols-outlined">
                expand_more
              </span>
              <span>Выберите тип недвижимости:</span>
            </div>
            <div style={subcategoriesChipsStyle}>
              <div
                style={selectedCategory && selectedCategory.id === realEstateCat.id ? subcategoryChipActiveStyle : subcategoryChipStyle}
                onClick={() => handleCategoryClick(realEstateCat)}
              >
                Все типы
              </div>
              {realEstateSubcats.map(subcat => (
                <div
                  key={subcat.id}
                  style={selectedCategory && selectedCategory.id === subcat.id ? subcategoryChipActiveStyle : subcategoryChipStyle}
                  onClick={() => handleSubcategoryClick(subcat)}
                >
                  {subcat.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Индикатор выбранной категории/поиска/фильтров */}
        {(selectedCategory || searchTerm || Object.values(activeFilters).some(val => val !== '' && val !== false)) && (
          <div style={filterIndicatorStyle}>
            <span>
              {searchTerm && `Поиск: "${searchTerm}"`}
              {selectedCategory && !searchTerm && !Object.values(activeFilters).some(val => val !== '' && val !== false) && `Категория: ${selectedCategory.name}`}
              {selectedCategory && (searchTerm || Object.values(activeFilters).some(val => val !== '' && val !== false)) && ` | Категория: ${selectedCategory.name}`}
              {activeFilters.rooms && ` | Комнат: ${activeFilters.rooms}`}
              {activeFilters.min_price && ` | Цена от: ${activeFilters.min_price}`}
              {activeFilters.max_price && ` | Цена до: ${activeFilters.max_price}`}
              {activeFilters.total_area_min && ` | Площадь от: ${activeFilters.total_area_min} м²`}
              {activeFilters.total_area_max && ` | Площадь до: ${activeFilters.total_area_max} м²`}
              {activeFilters.transaction_type && ` | Сделка: ${activeFilters.transaction_type === 'sell' ? 'Продажа' : activeFilters.transaction_type === 'rent' ? 'Аренда' : 'Посуточно'}`}
              {activeFilters.has_photo && ` | Только с фото`}
            </span>
            <button style={clearFilterStyle} onClick={clearFilters}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Grid */}
        <div style={gridContainerStyle}>
          <div style={gridStyle}>
            {(isLoading || localLoading) ? (
              Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            ) : displayAds.length > 0 ? (
              displayAds.map(ad => (
                <AdCard key={ad.id} ad={ad} onClick={() => onViewAd(ad)} />
              ))
            ) : (
              <div style={noResultsStyle}>
                {searchTerm ? (
                  <p>По запросу "{searchTerm}" ничего не найдено</p>
                ) : selectedCategory || Object.values(activeFilters).some(val => val !== '' && val !== false) ? (
                  <p>Нет объявлений по заданным критериям</p>
                ) : (
                  <p>Нет объявлений</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FAB */}
        <button style={fabStyle} onClick={onCreateAd}>
          <span className="material-symbols-outlined">add</span>
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            filters={activeFilters}
            onFiltersChange={updateLocalFilters}
            onApply={applyFilters}
            onReset={resetFilters}
            onClose={closeFilters}
            category={selectedCategory}
            applicableFilterKeys={applicableFilterKeys}
          />
        )}
      </div>

      {/* BottomNav - теперь используется общий компонент из App.jsx */}
    </div>
  )
}

const topAppBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 16px',
  backgroundColor: 'white',
  borderBottom: '1px solid #eee',
  height: '95px', 
  minHeight: '95px',
  boxSizing: 'border-box',
  width: '100%',
  paddingTop: '20px',
  marginTop: 'env(safe-area-inset-top, 0)', 
}

const logoutButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  fontSize: '24px',
  padding: '8px'
}

const appTitleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1 // Занимает все доступное пространство для центрирования
}

const appLogoStyle = {
  width: 200, // Уменьшаем размер для лучшего отображения
  height: 200,
  objectFit: 'contain',
  maxWidth: '100%'
}

const headerButtonsStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  width: '48px' // Фиксированная ширина для выравнивания
}

const refreshButtonStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  borderRadius: '20px',
  transition: 'background-color 0.2s ease'
}

const searchContainerStyle = {
  padding: '0 16px 12px',
  marginTop: '4px'
}

const searchWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: 12,
  height: 48
}

const searchIconStyle = {
  marginLeft: 12,
  color: '#46A8C1',
  fontSize: 20
}

const searchInputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingLeft: 8,
  fontSize: 16,
  color: '#0d121b'
}

// Новый стиль для кнопки фильтров
const filterButtonStyle = {
  width: 48,
  height: 48,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  borderRadius: '0 12px 12px 0', // Закругление справа
  marginLeft: -48 // Перекрывает часть инпута
}

const chipsContainerStyle = {
  display: 'flex',
  gap: 12,
  padding: '0 16px 12px',
  overflowX: 'auto',
  width: '100%',
  boxSizing: 'border-box',
  WebkitOverflowScrolling: 'touch',
  maxWidth: '100vw' // Добавьте это
}

const chipStyle = {
  padding: '8px 16px',
  backgroundColor: 'white',
  color: '#46A8C1',
  border: '1px solid #cfd7e7',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: '500',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0
}

const chipActiveStyle = {
  ...chipStyle,
  backgroundColor: '#46A8C1',
  color: 'white',
  border: '1px solid #46A8C1'
}

const subcategoriesContainerStyle = {
  padding: '0 16px 12px',
  backgroundColor: 'rgba(70, 168, 193, 0.05)',
  borderTop: '1px solid #e6f2f5',
  borderBottom: '1px solid #e6f2f5',
  marginBottom: 12
}

const subcategoriesTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#46A8C1',
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8
}

const subcategoriesIconStyle = {
  fontSize: 18,
  transform: 'rotate(90deg)'
}

const subcategoriesChipsStyle = {
  display: 'flex',
  gap: 10,
  overflowX: 'auto',
  paddingBottom: 4
}

const subcategoryChipStyle = {
  padding: '6px 14px',
  backgroundColor: 'white',
  color: '#4a5568',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: '400',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
}

const subcategoryChipActiveStyle = {
  ...subcategoryChipStyle,
  backgroundColor: '#46A8C1',
  color: 'white',
  border: '1px solid #46A8C1',
  fontWeight: '500'
}

const filterIndicatorStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: 'rgba(70, 168, 193, 0.1)',
  margin: '0 16px 12px',
  borderRadius: 8,
  fontSize: 14,
  color: '#0d121b'
}

const clearFilterStyle = {
  background: 'none',
  border: 'none',
  color: '#46A8C1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: 4
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
  gap: '12px',
  padding: '0 16px 80px',
  width: '100%',
  boxSizing: 'border-box',
  maxWidth: '100vw' // Добавьте это
}

const noResultsStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  padding: '40px 20px',
  color: '#6b7280',
  fontSize: 16
}

const fabStyle = {
  position: 'fixed',
  bottom: '140px', // вместо 96px
  right: 16,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#50B79C',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 12px rgba(80, 183, 156, 0.3)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  zIndex: 9999 // Очень высокий z-index
}

const containerStyle = {
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  position: 'relative'
}

const gridContainerStyle = {
  width: '100%',
  overflowX: 'hidden'
}

export default Home