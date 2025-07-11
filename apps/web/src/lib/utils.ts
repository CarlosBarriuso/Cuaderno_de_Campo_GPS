import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formateo de fechas
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formateo de números
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatArea(hectares: number): string {
  if (hectares < 1) {
    return `${Math.round(hectares * 10000)} m²`;
  }
  return `${formatNumber(hectares)} ha`;
}

// Utilidades para actividades agrícolas
export function getActivityColor(tipo: string): string {
  const colors: Record<string, string> = {
    siembra: 'green',
    fertilizacion: 'blue',
    tratamiento: 'orange',
    cosecha: 'red',
    riego: 'cyan',
    mantenimiento: 'purple',
    poda: 'yellow',
    default: 'gray',
  };
  
  return colors[tipo.toLowerCase()] || colors.default;
}

export function getActivityIcon(tipo: string): string {
  const icons: Record<string, string> = {
    siembra: '🌱',
    fertilizacion: '🧪',
    tratamiento: '💊',
    cosecha: '🌾',
    riego: '💧',
    mantenimiento: '🔧',
    poda: '✂️',
    default: '📋',
  };
  
  return icons[tipo.toLowerCase()] || icons.default;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completada: 'green',
    en_curso: 'blue',
    planificada: 'yellow',
    cancelada: 'red',
    default: 'gray',
  };
  
  return colors[status.toLowerCase()] || colors.default;
}

// Utilidades de validación
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isValidSpanishCoordinate(lat: number, lng: number): boolean {
  // Coordenadas aproximadas de España
  return lat >= 35 && lat <= 44 && lng >= -10 && lng <= 5;
}

// Cálculos geoespaciales básicos
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Utilidades de almacenamiento local
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
}

// Utilidades de debugging
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Generadores de datos mock para desarrollo
export function generateMockParcela(id: string) {
  const nombres = ['El Olivar', 'La Viña', 'Campo Norte', 'Huerto Sur', 'Pradera Este'];
  const cultivos = ['trigo', 'olivos', 'viñas', 'tomates', 'lechugas'];
  
  return {
    id,
    nombre: nombres[Math.floor(Math.random() * nombres.length)],
    superficie: Math.round((Math.random() * 10 + 1) * 100) / 100,
    cultivo: cultivos[Math.floor(Math.random() * cultivos.length)],
    ultimaActividad: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    rentabilidad: Math.round((Math.random() * 2000 + 500) * 100) / 100,
    estado: Math.random() > 0.8 ? 'warning' : 'active',
  };
}

export function generateMockActividad(id: string) {
  const tipos = ['siembra', 'fertilizacion', 'tratamiento', 'riego', 'cosecha'];
  const estados = ['completada', 'en_curso', 'planificada'];
  
  return {
    id,
    tipo: tipos[Math.floor(Math.random() * tipos.length)],
    fecha: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    estado: estados[Math.floor(Math.random() * estados.length)],
    parcela: generateMockParcela('p1'),
    productos: [
      {
        nombre: 'Producto Mock',
        cantidad: Math.round(Math.random() * 100),
        unidad: 'kg/ha',
      },
    ],
  };
}