import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Esquema de validación con Zod
const activitySchema = z.object({
  tipo: z.string().min(1, 'El tipo de actividad es requerido'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  parcelaId: z.string().optional(),
  cultivo: z.string().min(1, 'El tipo de cultivo es requerido'),
  superficie: z.number().min(0.01, 'La superficie debe ser mayor a 0').max(1000, 'Superficie máxima 1000 ha'),
  fechaRealizacion: z.string().min(1, 'La fecha de realización es requerida'),
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
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      fechaRealizacion: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  });

  const tipoActividad = watch('tipo');

  const tiposActividad = [
    { value: 'siembra', label: 'Siembra', categoria: 'cultivo' },
    { value: 'fertilizacion', label: 'Fertilización', categoria: 'nutricion' },
    { value: 'tratamiento', label: 'Tratamiento Fitosanitario', categoria: 'proteccion' },
    { value: 'riego', label: 'Riego', categoria: 'agua' },
    { value: 'poda', label: 'Poda', categoria: 'manejo' },
    { value: 'cosecha', label: 'Cosecha', categoria: 'recoleccion' },
    { value: 'laboreo', label: 'Laboreo del Suelo', categoria: 'suelo' },
    { value: 'supervision', label: 'Supervisión/Inspección', categoria: 'control' },
  ];

  const tiposCultivo = [
    'Trigo', 'Cebada', 'Avena', 'Maíz', 'Girasol', 'Soja',
    'Olivo', 'Vid', 'Almendro', 'Naranjo', 'Limonero',
    'Tomate', 'Pimiento', 'Lechuga', 'Brócoli', 'Patata',
  ];

  const requiereProductos = ['fertilizacion', 'tratamiento'].includes(tipoActividad);

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

  const onFormSubmit = (data: ActivityFormData) => {
    onSubmit({
      ...data,
      productos: requiereProductos ? productos : undefined,
    });
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
              Cultivo *
            </label>
            <select
              {...register('cultivo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar cultivo...</option>
              {tiposCultivo.map((cultivo) => (
                <option key={cultivo} value={cultivo.toLowerCase()}>
                  {cultivo}
                </option>
              ))}
            </select>
            {errors.cultivo && (
              <p className="mt-1 text-sm text-red-600">{errors.cultivo.message}</p>
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
              Fecha de Realización *
            </label>
            <input
              type="date"
              {...register('fechaRealizacion')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.fechaRealizacion && (
              <p className="mt-1 text-sm text-red-600">{errors.fechaRealizacion.message}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción de la Actividad *
          </label>
          <textarea
            {...register('descripcion')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe detalladamente la actividad realizada..."
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Productos Utilizados */}
        {requiereProductos && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Productos Utilizados
              </h3>
              <Button
                type="button"
                onClick={agregarProducto}
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
                    onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
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
                    onChange={(e) => actualizarProducto(index, 'dosis', e.target.value)}
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
                    onChange={(e) => actualizarProducto(index, 'unidad', e.target.value)}
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
                    onClick={() => eliminarProducto(index)}
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