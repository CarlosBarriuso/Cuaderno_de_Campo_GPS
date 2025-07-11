import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Esquema de validación para parcelas
const parcelaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la parcela es requerido'),
  superficie: z.number().min(0.01, 'La superficie debe ser mayor a 0').max(10000, 'Superficie máxima 10,000 ha'),
  cultivo: z.string().min(1, 'El tipo de cultivo es requerido'),
  variedad: z.string().optional(),
  fechaSiembra: z.string().optional(),
  sistemaRiego: z.string().optional(),
  tipoSuelo: z.string().optional(),
  pendiente: z.string().optional(),
  orientacion: z.string().optional(),
  referenciasCatastrales: z.string().optional(),
  observaciones: z.string().optional(),
  coordenadas: z.object({
    latitud: z.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90'),
    longitud: z.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180'),
  }).optional(),
  poligono: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
  })).optional(),
});

type ParcelaFormData = z.infer<typeof parcelaSchema>;

interface ParcelaFormProps {
  onSubmit: (data: ParcelaFormData) => void;
  loading?: boolean;
  initialData?: Partial<ParcelaFormData>;
  mode?: 'create' | 'edit';
}

export function ParcelaForm({ 
  onSubmit, 
  loading = false, 
  initialData, 
  mode = 'create' 
}: ParcelaFormProps) {
  const [coordenadasManuales, setCoordenadasManuales] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ParcelaFormData>({
    resolver: zodResolver(parcelaSchema),
    defaultValues: initialData,
  });

  const tiposCultivo = [
    // Cereales
    { value: 'trigo', label: 'Trigo', categoria: 'cereales' },
    { value: 'cebada', label: 'Cebada', categoria: 'cereales' },
    { value: 'avena', label: 'Avena', categoria: 'cereales' },
    { value: 'maiz', label: 'Maíz', categoria: 'cereales' },
    { value: 'arroz', label: 'Arroz', categoria: 'cereales' },
    
    // Oleaginosas
    { value: 'girasol', label: 'Girasol', categoria: 'oleaginosas' },
    { value: 'soja', label: 'Soja', categoria: 'oleaginosas' },
    { value: 'colza', label: 'Colza', categoria: 'oleaginosas' },
    
    // Frutales
    { value: 'olivo', label: 'Olivo', categoria: 'frutales' },
    { value: 'vid', label: 'Vid', categoria: 'frutales' },
    { value: 'almendro', label: 'Almendro', categoria: 'frutales' },
    { value: 'naranjo', label: 'Naranjo', categoria: 'frutales' },
    { value: 'limonero', label: 'Limonero', categoria: 'frutales' },
    { value: 'manzano', label: 'Manzano', categoria: 'frutales' },
    
    // Hortalizas
    { value: 'tomate', label: 'Tomate', categoria: 'hortalizas' },
    { value: 'pimiento', label: 'Pimiento', categoria: 'hortalizas' },
    { value: 'lechuga', label: 'Lechuga', categoria: 'hortalizas' },
    { value: 'brocoli', label: 'Brócoli', categoria: 'hortalizas' },
    { value: 'patata', label: 'Patata', categoria: 'hortalizas' },
    { value: 'cebolla', label: 'Cebolla', categoria: 'hortalizas' },
    
    // Leguminosas
    { value: 'guisante', label: 'Guisante', categoria: 'leguminosas' },
    { value: 'garbanzo', label: 'Garbanzo', categoria: 'leguminosas' },
    { value: 'lenteja', label: 'Lenteja', categoria: 'leguminosas' },
    { value: 'alfalfa', label: 'Alfalfa', categoria: 'leguminosas' },
  ];

  const sistemasRiego = [
    'Secano',
    'Riego por Gravedad',
    'Riego por Aspersión',
    'Riego por Goteo',
    'Riego Localizado',
    'Riego por Microaspersión',
    'Riego Subterráneo',
  ];

  const tiposSuelo = [
    'Arcilloso',
    'Limoso',
    'Arenoso',
    'Franco',
    'Franco-Arcilloso',
    'Franco-Limoso',
    'Franco-Arenoso',
    'Margoso',
    'Calizo',
    'Salino',
  ];

  const handleCoordenadasChange = () => {
    setCoordenadasManuales(!coordenadasManuales);
  };

  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('coordenadas.latitud', position.coords.latitude);
          setValue('coordenadas.longitud', position.coords.longitude);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      alert('Geolocalización no soportada por el navegador');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'create' ? 'Registrar Nueva Parcela' : 'Editar Parcela'}
        </h2>
        <p className="text-gray-600">
          {mode === 'create' 
            ? 'Registra una nueva parcela en tu explotación agrícola'
            : 'Modifica los datos de la parcela seleccionada'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Parcela *
            </label>
            <input
              type="text"
              {...register('nombre')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Parcela Norte, Campo 1, etc."
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie (hectáreas) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('superficie', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
            />
            {errors.superficie && (
              <p className="mt-1 text-sm text-red-600">{errors.superficie.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultivo Principal *
            </label>
            <select
              {...register('cultivo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar cultivo...</option>
              {Object.entries(
                tiposCultivo.reduce((acc, cultivo) => {
                  if (!acc[cultivo.categoria]) acc[cultivo.categoria] = [];
                  acc[cultivo.categoria].push(cultivo);
                  return acc;
                }, {} as Record<string, typeof tiposCultivo>)
              ).map(([categoria, cultivos]) => (
                <optgroup key={categoria} label={categoria.charAt(0).toUpperCase() + categoria.slice(1)}>
                  {cultivos.map((cultivo) => (
                    <option key={cultivo.value} value={cultivo.value}>
                      {cultivo.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.cultivo && (
              <p className="mt-1 text-sm text-red-600">{errors.cultivo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variedad (Opcional)
            </label>
            <input
              type="text"
              {...register('variedad')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Variedad específica del cultivo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Siembra
            </label>
            <input
              type="date"
              {...register('fechaSiembra')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sistema de Riego
            </label>
            <select
              {...register('sistemaRiego')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar sistema...</option>
              {sistemasRiego.map((sistema) => (
                <option key={sistema} value={sistema.toLowerCase().replace(/\s+/g, '-')}>
                  {sistema}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Características del Terreno */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Características del Terreno
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Suelo
              </label>
              <select
                {...register('tipoSuelo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar tipo...</option>
                {tiposSuelo.map((tipo) => (
                  <option key={tipo} value={tipo.toLowerCase()}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pendiente
              </label>
              <select
                {...register('pendiente')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar pendiente...</option>
                <option value="plana">Plana (0-2%)</option>
                <option value="suave">Suave (2-5%)</option>
                <option value="moderada">Moderada (5-10%)</option>
                <option value="pronunciada">Pronunciada (10-20%)</option>
                <option value="muy-pronunciada">Muy Pronunciada (+20%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientación
              </label>
              <select
                {...register('orientacion')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar orientación...</option>
                <option value="norte">Norte</option>
                <option value="noreste">Noreste</option>
                <option value="este">Este</option>
                <option value="sureste">Sureste</option>
                <option value="sur">Sur</option>
                <option value="suroeste">Suroeste</option>
                <option value="oeste">Oeste</option>
                <option value="noroeste">Noroeste</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ubicación y Coordenadas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ubicación y Coordenadas
          </h3>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={coordenadasManuales}
                onChange={handleCoordenadasChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Introducir coordenadas manualmente
              </span>
            </label>
          </div>

          {coordenadasManuales && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('coordenadas.latitud', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="40.416775"
                />
                {errors.coordenadas?.latitud && (
                  <p className="mt-1 text-sm text-red-600">{errors.coordenadas.latitud.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('coordenadas.longitud', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="-3.703790"
                />
                {errors.coordenadas?.longitud && (
                  <p className="mt-1 text-sm text-red-600">{errors.coordenadas.longitud.message}</p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={obtenerUbicacionActual}
                  variant="outline"
                  className="w-full"
                >
                  📍 Usar Ubicación Actual
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencias Catastrales
            </label>
            <input
              type="text"
              {...register('referenciasCatastrales')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: 28079A001000010000AB"
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Adicionales
          </label>
          <textarea
            {...register('observaciones')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Observaciones, características especiales, historial, etc."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading 
              ? 'Guardando...' 
              : mode === 'create' 
                ? 'Registrar Parcela' 
                : 'Actualizar Parcela'
            }
          </Button>
        </div>
      </form>
    </Card>
  );
}