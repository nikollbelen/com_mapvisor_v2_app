import { useState, useEffect, useRef } from 'react';
import './LotSearchModal.css';

interface LotSearchModalProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const DEFAULT_PRICE_BOUNDS = { min: 0, max: 100000 };
const DEFAULT_AREA_BOUNDS = { min: 90, max: 1000 };

const SORT_OPTIONS = [
  { value: 'area-asc',    label: 'Área: de menor a mayor' },
  { value: 'area-desc',   label: 'Área: de mayor a menor' },
  { value: 'price-asc',   label: 'Precio: de menor a mayor' },
  { value: 'price-desc',  label: 'Precio: de mayor a menor' },
  { value: 'number-asc',  label: 'Número: de menor a mayor' },
  { value: 'number-desc', label: 'Número: de mayor a menor' },
];

const ALL_STATUSES = ['vendido', 'reservado', 'negociacion', 'disponible'] as const;
const ALL_PROPERTY_TYPES = ['lote', 'casa', 'departamento'] as const;
const ALL_OPERATIONS = ['venta', 'alquiler'] as const;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  lote: 'Lote',
  casa: 'Casa',
  departamento: 'Departamento',
};

const OPERATION_LABELS: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
};

const LotSearchModal = ({ isVisible = false, onClose }: LotSearchModalProps) => {
  const [priceMin, setPriceMin] = useState(DEFAULT_PRICE_BOUNDS.min);
  const [priceMax, setPriceMax] = useState(DEFAULT_PRICE_BOUNDS.max);
  const [areaMin, setAreaMin] = useState(DEFAULT_AREA_BOUNDS.min);
  const [areaMax, setAreaMax] = useState(DEFAULT_AREA_BOUNDS.max);
  const [priceBounds, setPriceBounds] = useState(DEFAULT_PRICE_BOUNDS);
  const [areaBounds, setAreaBounds] = useState(DEFAULT_AREA_BOUNDS);
  const [sortBy, setSortBy] = useState('area-asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [statuses, setStatuses] = useState<Set<string>>(new Set(ALL_STATUSES));
  const [propertyTypes, setPropertyTypes] = useState<Set<string>>(new Set(ALL_PROPERTY_TYPES));
  const [operations, setOperations] = useState<Set<string>>(new Set(ALL_OPERATIONS));
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [lotFilter, setLotFilter] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [bathroomsMin, setBathroomsMin] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const readNumber = (value: unknown, fallback: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
      return fallback;
    };

    const applyBounds = (detail: any) => {
      const nextPriceBounds = {
        min: Math.max(0, Math.floor(readNumber(detail?.minPrice, priceBounds.min))),
        max: Math.max(0, Math.ceil(readNumber(detail?.maxPrice, priceBounds.max))),
      };
      const nextAreaBounds = {
        min: Math.max(0, Math.floor(readNumber(detail?.minArea, areaBounds.min))),
        max: Math.max(0, Math.ceil(readNumber(detail?.maxArea, areaBounds.max))),
      };
      if (nextPriceBounds.max <= nextPriceBounds.min) nextPriceBounds.max = nextPriceBounds.min + 1;
      if (nextAreaBounds.max <= nextAreaBounds.min) nextAreaBounds.max = nextAreaBounds.min + 1;

      setPriceBounds((prev) => {
        const wasFullRange = priceMin <= prev.min && priceMax >= prev.max;
        if (wasFullRange) {
          setPriceMin(nextPriceBounds.min);
          setPriceMax(nextPriceBounds.max);
        } else {
          setPriceMin((current) => clampToBounds(current, nextPriceBounds));
          setPriceMax((current) => clampToBounds(current, nextPriceBounds));
        }
        return nextPriceBounds;
      });

      setAreaBounds((prev) => {
        const wasFullRange = areaMin <= prev.min && areaMax >= prev.max;
        if (wasFullRange) {
          setAreaMin(nextAreaBounds.min);
          setAreaMax(nextAreaBounds.max);
        } else {
          setAreaMin((current) => clampToBounds(current, nextAreaBounds));
          setAreaMax((current) => clampToBounds(current, nextAreaBounds));
        }
        return nextAreaBounds;
      });
    };

    const handleRangeConfigUpdated = (event: CustomEvent) => {
      applyBounds(event.detail);
    };

    window.addEventListener('lotRangeConfigUpdated', handleRangeConfigUpdated as EventListener);
    if (window.getMinPrice && window.getMaxPrice && window.getMinArea && window.getMaxArea) {
      applyBounds({
        minPrice: window.getMinPrice(),
        maxPrice: window.getMaxPrice(),
        minArea: window.getMinArea(),
        maxArea: window.getMaxArea(),
      });
    }

    return () => {
      window.removeEventListener('lotRangeConfigUpdated', handleRangeConfigUpdated as EventListener);
    };
  }, [isVisible, priceMin, priceMax, areaMin, areaMax, priceBounds.min, priceBounds.max, areaBounds.min, areaBounds.max]);

  const clampToBounds = (value: number, bounds: { min: number; max: number }) => {
    if (Number.isNaN(value)) return bounds.min;
    return Math.max(bounds.min, Math.min(value, bounds.max));
  };

  const updateRangeSlider = (
    minInput: number, maxInput: number,
    minOutput: string, maxOutput: string, inclRange: string,
    formatValue: (v: number) => string, rangeBounds: { min: number; max: number }
  ) => {
    const minRange = rangeBounds?.min ?? 0;
    const maxRangeRaw = rangeBounds?.max ?? minRange + 1;
    const maxRange = maxRangeRaw > minRange ? maxRangeRaw : minRange + 1;
    const rangeSpan = maxRange - minRange;
    const minEl = document.querySelector(minOutput);
    const maxEl = document.querySelector(maxOutput);
    if (minEl) minEl.innerHTML = formatValue(minInput);
    if (maxEl) maxEl.innerHTML = formatValue(maxInput);
    const inclEl = document.querySelector(inclRange) as HTMLElement;
    if (inclEl) {
      const eMin = Math.min(minInput, maxInput);
      const eMax = Math.max(minInput, maxInput);
      inclEl.style.width = ((eMax - eMin) / rangeSpan) * 100 + '%';
      inclEl.style.left = ((eMin - minRange) / rangeSpan) * 100 + '%';
    }
  };

  useEffect(() => {
    if (isVisible && window.loadLotData) setTimeout(() => window.loadLotData(), 100);
  }, [isVisible, priceMax, areaMax]);

  useEffect(() => {
    if (isVisible) {
      updateRangeSlider(priceMin, priceMax, '.price-output-min', '.price-output-max', '.price-range-slider .incl-range', (v) => `$${parseInt(v.toString()).toLocaleString()}`, priceBounds);
      updateRangeSlider(areaMin, areaMax, '.area-output-min', '.area-output-max', '.area-range-slider .incl-range', (v) => `${parseInt(v.toString())} m²`, areaBounds);
    }
  }, [isVisible, priceMin, priceMax, areaMin, areaMax, priceBounds, areaBounds]);

  const handleClose = () => onClose?.();

  const handleClearFilters = () => {
    setPriceMin(priceBounds.min); setPriceMax(priceBounds.max);
    setAreaMin(areaBounds.min); setAreaMax(areaBounds.max);
    setSortBy('area-asc'); setStatuses(new Set(ALL_STATUSES));
    setPropertyTypes(new Set(ALL_PROPERTY_TYPES)); setOperations(new Set(ALL_OPERATIONS));
    setSearchQuery(''); setCityFilter(''); setDistrictFilter(''); setPhaseFilter('');
    setBlockFilter(''); setLotFilter(''); setBedroomsMin(''); setBathroomsMin('');
    setMediaFilter('all');
    triggerFilterUpdate();
  };

  const triggerFilterUpdate = () => {
    setTimeout(() => { if (window.loadLotData) window.loadLotData(); }, 0);
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToBounds(parseFloat(e.target.value), priceBounds);
    setPriceMin(v);
    if (window.loadLotData) window.loadLotData();
  };
  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToBounds(parseFloat(e.target.value), priceBounds);
    setPriceMax(v);
    if (window.loadLotData) window.loadLotData();
  };
  const handleAreaMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToBounds(parseFloat(e.target.value), areaBounds);
    setAreaMin(v);
    if (window.loadLotData) window.loadLotData();
  };
  const handleAreaMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToBounds(parseFloat(e.target.value), areaBounds);
    setAreaMax(v);
    if (window.loadLotData) window.loadLotData();
  };

  const handleStatusToggle = (s: string) => {
    setStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
    triggerFilterUpdate();
  };

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { next.delete(type); } else { next.add(type); }
      return next;
    });
    triggerFilterUpdate();
  };

  const handleOperationToggle = (operation: string) => {
    setOperations(prev => {
      const next = new Set(prev);
      if (next.has(operation)) { next.delete(operation); } else { next.add(operation); }
      return next;
    });
    triggerFilterUpdate();
  };

  const handleTextFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setter(e.target.value);
    triggerFilterUpdate();
  };

  const handleSortSelect = (value: string) => {
    setSortBy(value);
    setSortOpen(false);
    // Sync hidden select for Cesium's applyFilters
    const sel = document.getElementById('sortSelect') as HTMLSelectElement;
    if (sel) sel.value = value;
    if (window.loadLotData) window.loadLotData();
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? '';

  if (!isVisible) return null;

  return (
    <div
      className={`lot-search-modal hud-glass-panel hud-gold-edge ${isMobile ? 'mobile-modal' : ''}`}
      id="lotSearchModalOverlay"
    >
      {/* Hidden native select so Cesium's applyFilters can read it */}
      <select id="sortSelect" value={sortBy} onChange={() => {}} style={{ display: 'none' }}>
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <button className="lot-search-close-btn" id="closeLotSearchModal" onClick={handleClose}>
        <span className="material-symbols-outlined">close</span>
      </button>

      {/* Header */}
      <div className="lot-search-header">
        <div className="lot-search-title">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          <span className="lot-search-title-text">Búsqueda de lotes</span>
        </div>
      </div>

      <div className="lot-search-content">
        <div className="filter-section">
          <label className="filter-label" htmlFor="lotSearchQuery">Buscar</label>
          <div className="search-input-shell">
            <span className="material-symbols-outlined">search</span>
            <input
              id="lotSearchQuery"
              name="lotSearchQuery"
              className="lot-search-input"
              type="search"
              placeholder="Nombre, ciudad, distrito, etapa..."
              value={searchQuery}
              onChange={handleTextFilterChange(setSearchQuery)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Price range */}
        <div className="filter-section">
          <label className="filter-label">Precio</label>
          <div className="range-slider-container">
            <div className="range-slider price-range-slider">
              <span className="output outputOne price-output-min">${priceMin.toLocaleString()}</span>
              <span className="output outputTwo price-output-max">${priceMax.toLocaleString()}</span>
              <span className="full-range"></span>
              <span className="incl-range"></span>
              <input name="priceMin" value={priceMin} min={priceBounds.min} max={priceBounds.max} step="1" type="range" onChange={handlePriceMinChange} />
              <input name="priceMax" value={priceMax} min={priceBounds.min} max={priceBounds.max} step="1" type="range" onChange={handlePriceMaxChange} />
            </div>
          </div>
        </div>

        {/* Area range */}
        <div className="filter-section">
          <label className="filter-label">Área</label>
          <div className="range-slider-container">
            <div className="range-slider area-range-slider">
              <span className="output outputOne area-output-min">{areaMin} m²</span>
              <span className="output outputTwo area-output-max">{areaMax} m²</span>
              <span className="full-range"></span>
              <span className="incl-range"></span>
              <input name="areaMin" value={areaMin} min={areaBounds.min} max={areaBounds.max} step="1" type="range" onChange={handleAreaMinChange} />
              <input name="areaMax" value={areaMax} min={areaBounds.min} max={areaBounds.max} step="1" type="range" onChange={handleAreaMaxChange} />
            </div>
          </div>
        </div>

        {/* Clear filters */}
        <button className="clear-filters-btn" id="clearFiltersBtn" onClick={handleClearFilters}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>
          Limpiar filtros
        </button>

        <div className="filter-grid">
          <div className="filter-section">
            <label className="filter-label">Tipo</label>
            <div className="compact-pill-group">
              {ALL_PROPERTY_TYPES.map(type => (
                <button
                  key={type}
                  className={`compact-pill property-type-btn ${propertyTypes.has(type) ? 'active' : ''}`}
                  data-property-type={type}
                  onClick={() => handlePropertyTypeToggle(type)}
                  type="button"
                >
                  {PROPERTY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label className="filter-label">Operación</label>
            <div className="compact-pill-group">
              {ALL_OPERATIONS.map(operation => (
                <button
                  key={operation}
                  className={`compact-pill operation-btn ${operations.has(operation) ? 'active' : ''}`}
                  data-operation={operation}
                  onClick={() => handleOperationToggle(operation)}
                  type="button"
                >
                  {OPERATION_LABELS[operation]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-grid">
          <div className="filter-section">
            <label className="filter-label" htmlFor="cityFilter">Ciudad</label>
            <input id="cityFilter" name="cityFilter" className="lot-search-input" value={cityFilter} onChange={handleTextFilterChange(setCityFilter)} placeholder="Todas" autoComplete="off" />
          </div>

          <div className="filter-section">
            <label className="filter-label" htmlFor="districtFilter">Distrito</label>
            <input id="districtFilter" name="districtFilter" className="lot-search-input" value={districtFilter} onChange={handleTextFilterChange(setDistrictFilter)} placeholder="Todos" autoComplete="off" />
          </div>
        </div>

        <div className="filter-grid three">
          <div className="filter-section">
            <label className="filter-label" htmlFor="phaseFilter">Etapa</label>
            <input id="phaseFilter" name="phaseFilter" className="lot-search-input" value={phaseFilter} onChange={handleTextFilterChange(setPhaseFilter)} placeholder="Todas" autoComplete="off" />
          </div>

          <div className="filter-section">
            <label className="filter-label" htmlFor="blockFilter">Mz.</label>
            <input id="blockFilter" name="blockFilter" className="lot-search-input" value={blockFilter} onChange={handleTextFilterChange(setBlockFilter)} placeholder="Todas" autoComplete="off" />
          </div>

          <div className="filter-section">
            <label className="filter-label" htmlFor="lotFilter">Lote</label>
            <input id="lotFilter" name="lotFilter" className="lot-search-input" value={lotFilter} onChange={handleTextFilterChange(setLotFilter)} placeholder="Todos" autoComplete="off" />
          </div>
        </div>

        <div className="filter-grid three">
          <div className="filter-section">
            <label className="filter-label" htmlFor="bedroomsMin">Dorm.</label>
            <select id="bedroomsMin" name="bedroomsMin" className="lot-search-input" value={bedroomsMin} onChange={handleTextFilterChange(setBedroomsMin)}>
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label" htmlFor="bathroomsMin">Baños</label>
            <select id="bathroomsMin" name="bathroomsMin" className="lot-search-input" value={bathroomsMin} onChange={handleTextFilterChange(setBathroomsMin)}>
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label" htmlFor="mediaFilter">Media</label>
            <select id="mediaFilter" name="mediaFilter" className="lot-search-input" value={mediaFilter} onChange={handleTextFilterChange(setMediaFilter)}>
              <option value="all">Todos</option>
              <option value="with">Con media</option>
              <option value="without">Sin media</option>
            </select>
          </div>
        </div>

        {/* Sort — custom dropdown */}
        <div className="filter-section">
          <label className="filter-label">Ordenar por</label>
          <div className="custom-dropdown" ref={sortRef}>
            <button className={`custom-dropdown-trigger ${sortOpen ? 'open' : ''}`} onClick={() => setSortOpen(!sortOpen)}>
              <span className="custom-dropdown-label">{sortLabel}</span>
              <span className="material-symbols-outlined custom-dropdown-arrow">expand_more</span>
            </button>
            {sortOpen && (
              <div className="custom-dropdown-menu">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={`custom-dropdown-item ${sortBy === o.value ? 'selected' : ''}`}
                    onClick={() => handleSortSelect(o.value)}
                  >
                    {sortBy === o.value && <span className="material-symbols-outlined check-icon">check</span>}
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="filter-section">
          <label className="filter-label">Estado</label>
          <div className="status-buttons">
            {/* Keep both class names: status-pill for styling + status-btn + data-status for Cesium */}
            {(['vendido','reservado','negociacion','disponible'] as const).map(s => (
              <button
                key={s}
                className={`status-pill status-btn ${s} ${statuses.has(s) ? 'active' : ''}`}
                data-status={s}
                onClick={() => handleStatusToggle(s)}
              >
                <span className="status-dot" />
                {{ vendido:'Vendido', reservado:'Reservado', negociacion:'Negociación', disponible:'Disponible' }[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="results-section">
          <div className="results-count" id="resultsCount">Mostrando (0) lotes</div>
          <div className="lot-cards-container" id="lotCardsContainer"></div>
        </div>
      </div>
    </div>
  );
};

export default LotSearchModal;
