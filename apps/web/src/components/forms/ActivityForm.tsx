import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

// Esquema de validación con Zod - actualizado para modelo SQLAlchemy
const activitySchema = z.object({
  tipo: z.string().min(1, 'El tipo de actividad es requerido'),
  nombre: z.string().min(1, 'El nombre de la actividad es requerido'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  parcela_id: z.string().min(1, 'Debe seleccionar una parcela'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  duracion_horas: z.number().min(0.1, 'La duración debe ser mayor a 0').optional(),
  superficie_afectada: z.number().min(0.01, 'La superficie debe ser mayor a 0').max(1000, 'Superficie máxima 1000 ha').optional(),
  coordenadas: z.object({
    latitud: z.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90').optional(),
    longitud: z.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180').optional(),
  }).optional(),
  productos: z.array(z.object({
    nombre: z.string().min(1, 'Nombre del producto requerido'),
    dosis: z.string().min(1, 'Dosis requerida'),
    unidad: z.string().min(1, 'Unidad requerida'),
  })).optional(),
  observaciones: z.string().optional(),
  condicionesClimaticas: z.object({
    temperatura: z.number().optional(),
    humedad: z.number().optional(),
    viento: z.string().optional(),
    condiciones: z.string().optional(),
  }).optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => void;
  loading?: boolean;
  initialData?: Partial<ActivityFormData>;
}

export function ActivityForm({ onSubmit, loading = false, initialData }: ActivityFormProps) {
  const [productos, setProductos] = useState(initialData?.productos || []);
  const [parcelas, setParcelas] = useState([]);
  const [loadingParcelas, setLoadingParcelas] = useState(true);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [parcelaDetectada, setParcelaDetectada] = useState(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  });

  const tipoActividad = watch('tipo');
  const parcelaSeleccionada = watch('parcela_id');

  // Cargar parcelas del usuario al montar el componente
  useEffect(() => {
    const cargarParcelas = async () => {
      try {
        setLoadingParcelas(true);
        console.log('🔄 Cargando parcelas...');
        const response = await api.parcelas.getAll();
        console.log('📦 Respuesta de parcelas:', response);
        
        if (response && response.success && response.data) {
          console.log('✅ Parcelas encontradas:', response.data.length);
          setParcelas(response.data);
        } else {
          console.log('⚠️ No se encontraron parcelas o estructura incorrecta:', response);
          setParcelas([]);
        }
      } catch (error) {
        console.error('❌ Error cargando parcelas:', error);
        setParcelas([]);
      } finally {
        setLoadingParcelas(false);
      }
    };

    cargarParcelas();
  }, []);

  // Función para detectar ubicación GPS y encontrar parcela automáticamente
  const detectarUbicacionGPS = async () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada por el navegador');
      return;
    }

    setGpsDetecting(true);
    setParcelaDetectada(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Guardar coordenadas en el formulario
          setValue('coordenadas.latitud', latitude);
          setValue('coordenadas.longitud', longitude);

          // Buscar parcela que contenga estas coordenadas
          const response = await api.parcelas.findByLocation({
            latitude,
            longitude
          });

          if (response.success && response.data.parcela_found) {
            const parcela = response.data.parcela_found;
            setParcelaDetectada(parcela);
            setValue('parcela_id', parcela.id);
            alert(`📍 Ubicación detectada dentro de: ${parcela.nombre}`);
          } else if (response.data.nearest_parcelas.length > 0) {
            const nearest = response.data.nearest_parcelas[0];
            const distanceKm = (nearest.distance_meters / 1000).toFixed(1);
            setParcelaDetectada(nearest);
            setValue('parcela_id', nearest.id);
            alert(`📍 Parcela más cercana: ${nearest.nombre} (${distanceKm} km)`);
          } else {
            alert('📍 No se encontraron parcelas cercanas a tu ubicación');
          }
        } catch (error) {
          console.error('Error detectando parcela:', error);
          alert('Error al detectar la parcela automáticamente');
        } finally {
          setGpsDetecting(false);
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('No se pudo obtener la ubicación actual');
        setGpsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const tiposActividad = [
    { value: 'SIEMBRA', label: 'Siembra', categoria: 'cultivo' },
    { value: 'FERTILIZACION', label: 'Fertilización', categoria: 'nutricion' },
    { value: 'TRATAMIENTO', label: 'Tratamiento Fitosanitario', categoria: 'proteccion' },
    { value: 'RIEGO', label: 'Riego', categoria: 'agua' },
    { value: 'PODA', label: 'Poda', categoria: 'manejo' },
    { value: 'COSECHA', label: 'Cosecha', categoria: 'recoleccion' },
    { value: 'LABOREO', label: 'Laboreo del Suelo', categoria: 'suelo' },
    { value: 'ABONADO', label: 'Abonado', categoria: 'nutricion' },
    { value: 'OTROS', label: 'Otros', categoria: 'general' },
  ];

  const tiposCultivo = [
    'Trigo', 'Cebada', 'Avena', 'Maíz', 'Girasol', 'Soja',
    'Olivo', 'Vid', 'Almendro', 'Naranjo', 'Limonero',
    'Tomate', 'Pimiento', 'Lechuga', 'Patata', 'Cebolla',
    'Guisante', 'Garbanzo', 'Lenteja', 'Alfalfa', 'Barbecho'
  ];


  // Simplificar para evitar errores de compilación
  const onFormSubmit = (data: ActivityFormData) => {
    console.log('Datos del formulario:', data);
    onSubmit(data);
  };

  const agregarProducto = () => {
    setProductos([...productos, { nombre: '', dosis: '', unidad: 'L/ha' }]);
  };

  const eliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_, i) => i !== index);
    setProductos(nuevosProductos);
    setValue('productos', nuevosProductos);
  };

  const actualizarProducto = (index: number, campo: string, valor: string) => {
    const nuevosProductos = productos.map((producto, i) => 
      i === index ? { ...producto, [campo]: valor } : producto
    );
    setProductos(nuevosProductos);
    setValue('productos', nuevosProductos);
  };


  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registro de Actividad Agrícola
        </h2>
        <p className="text-gray-600">
          Registra las actividades realizadas en campo con todos los detalles necesarios
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Actividad *
            </label>
            <select
              {...register('tipo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar actividad...</option>
              {tiposActividad.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              {...register('nombre')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Fertilización NPK, Siembra trigo..."
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>
        </div>

        {/* Selección de Parcela con GPS */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Parcela y Ubicación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parcela *
              </label>
              {loadingParcelas ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Cargando parcelas...
                </div>
              ) : (
                <select
                  {...register('parcela_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar parcela...</option>
                  {console.log('🗂️ Renderizando parcelas:', parcelas)}
                  {parcelas && parcelas.length > 0 ? parcelas.map((parcela) => {
                    console.log('📋 Parcela individual:', parcela);
                    return (
                      <option key={parcela.id} value={parcela.id}>
                        {parcela.nombre} - {parcela.superficie} ha ({parcela.cultivo})
                      </option>
                    );
                  }) : (
                    <option disabled>No hay parcelas disponibles</option>
                  )}
                </select>
              )}
              {errors.parcela_id && (
                <p className="mt-1 text-sm text-red-600">{errors.parcela_id.message}</p>
              )}
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={detectarUbicacionGPS}
                disabled={gpsDetecting || loadingParcelas}
                variant="outline"
                className="w-full"
              >
                {gpsDetecting ? (
                  <>🔄 Detectando...</>
                ) : (
                  <>📍 Detectar Parcela por GPS</>
                )}
              </Button>
            </div>
          </div>

          {parcelaDetectada && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ Parcela detectada: <strong>{parcelaDetectada.nombre}</strong> 
                ({parcelaDetectada.superficie} ha - {parcelaDetectada.cultivo})
              </p>
            </div>
          )}
        </div>

        {/* Información de Tiempo y Superficie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              {...register('fecha')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.fecha && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (horas)
            </label>
            <input
              type="number"
              step="0.5"
              {...register('duracion_horas', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="2.5"
            />
            {errors.duracion_horas && (
              <p className="mt-1 text-sm text-red-600">{errors.duracion_horas.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie Afectada (ha)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('superficie_afectada', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.50"
            />
            {errors.superficie_afectada && (
              <p className="mt-1 text-sm text-red-600">{errors.superficie_afectada.message}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            {...register('descripcion')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe la actividad realizada, métodos utilizados, observaciones..."
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Productos Utilizados - Solo para fertilización y tratamientos */}
        {(tipoActividad === 'FERTILIZACION' || tipoActividad === 'TRATAMIENTO') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Productos Utilizados
              </h3>
              <Button
                type="button"
                onClick={() => {
                  const nuevoProducto = { nombre: '', dosis: '', unidad: 'L/ha' };
                  const nuevosProductos = [...productos, nuevoProducto];
                  setProductos(nuevosProductos);
                  setValue('productos', nuevosProductos);
                }}
                variant="outline"
                size="sm"
              >
                + Agregar Producto
              </Button>
            </div>

            {productos.map((producto, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    value={producto.nombre}
                    onChange={(e) => {
                      const nuevosProductos = [...productos];
                      nuevosProductos[index].nombre = e.target.value;
                      setProductos(nuevosProductos);
                      setValue('productos', nuevosProductos);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Fertilizante NPK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={producto.dosis}
                    onChange={(e) => {
                      const nuevosProductos = [...productos];
                      nuevosProductos[index].dosis = e.target.value;
                      setProductos(nuevosProductos);
                      setValue('productos', nuevosProductos);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: 2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={producto.unidad}
                    onChange={(e) => {
                      const nuevosProductos = [...productos];
                      nuevosProductos[index].unidad = e.target.value;
                      setProductos(nuevosProductos);
                      setValue('productos', nuevosProductos);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="L/ha">L/ha</option>
                    <option value="kg/ha">kg/ha</option>
                    <option value="g/ha">g/ha</option>
                    <option value="ml/L">ml/L</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const nuevosProductos = productos.filter((_, i) => i !== index);
                      setProductos(nuevosProductos);
                      setValue('productos', nuevosProductos);
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Condiciones Climáticas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Condiciones Climáticas (Opcional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperatura (°C)
              </label>
              <input
                type="number"
                {...register('condicionesClimaticas.temperatura', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Humedad (%)
              </label>
              <input
                type="number"
                {...register('condicionesClimaticas.humedad', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="65"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viento
              </label>
              <select
                {...register('condicionesClimaticas.viento')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar...</option>
                <option value="calma">Calma (0-5 km/h)</option>
                <option value="suave">Suave (6-15 km/h)</option>
                <option value="moderado">Moderado (16-25 km/h)</option>
                <option value="fuerte">Fuerte (+25 km/h)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condiciones Generales
            </label>
            <select
              {...register('condicionesClimaticas.condiciones')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar...</option>
              <option value="soleado">Soleado</option>
              <option value="nublado">Nublado</option>
              <option value="parcialmente-nublado">Parcialmente Nublado</option>
              <option value="lluvia-ligera">Lluvia Ligera</option>
              <option value="lluvia-intensa">Lluvia Intensa</option>
              <option value="niebla">Niebla</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Adicionales
          </label>
          <textarea
            {...register('observaciones')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Observaciones, incidencias, notas adicionales..."
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
            {loading ? 'Guardando...' : 'Registrar Actividad'}
          </Button>
        </div>
      </form>
    </Card>
  );
}