// components/sigpac/SIGPACSearchForm.tsx - Formulario de búsqueda SIGPAC
'use client';

import { useState, useEffect } from 'react';
import { useSIGPAC } from '../../hooks/useSIGPAC';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface SIGPACSearchFormProps {
  onParcelaFound?: (parcela: any) => void;
  onError?: (error: string) => void;
  initialReference?: string;
}

export function SIGPACSearchForm({ 
  onParcelaFound, 
  onError, 
  initialReference = '' 
}: SIGPACSearchFormProps) {
  const {
    loading,
    error,
    getParcela,
    validateReferenceFormat,
    parseReference,
    clearError
  } = useSIGPAC();

  const [referencia, setReferencia] = useState(initialReference);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parcela, setParcela] = useState<any | null>(null);

  // Validar referencia en tiempo real
  useEffect(() => {
    if (referencia.trim()) {
      const validation = validateReferenceFormat(referencia);
      setValidationError(validation.valid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  }, [referencia, validateReferenceFormat]);

  // Notificar errores al padre
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSearch = async () => {
    if (!referencia.trim()) {
      setValidationError('Referencia catastral requerida');
      return;
    }

    const validation = validateReferenceFormat(referencia);
    if (!validation.valid) {
      setValidationError(validation.error || 'Referencia inválida');
      return;
    }

    clearError();
    setValidationError(null);

    try {
      const result = await getParcela(referencia);
      
      if (result) {
        setParcela(result);
        if (onParcelaFound) {
          onParcelaFound(result);
        }
      }
    } catch (err) {
      console.error('Error buscando parcela:', err);
    }
  };

  const handleReferenceChange = (value: string) => {
    // Formatear automáticamente mientras escribe
    let formatted = value.toUpperCase().replace(/[^0-9A-Z:]/g, '');
    
    // Agregar automáticamente los dos puntos en posiciones correctas
    if (formatted.length > 2 && formatted[2] !== ':') {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
    }
    if (formatted.length > 6 && formatted[6] !== ':') {
      formatted = formatted.slice(0, 6) + ':' + formatted.slice(6);
    }
    if (formatted.length > 11 && formatted[11] !== ':') {
      formatted = formatted.slice(0, 11) + ':' + formatted.slice(11);
    }
    if (formatted.length > 17 && formatted[17] !== ':') {
      formatted = formatted.slice(0, 17) + ':' + formatted.slice(17);
    }
    if (formatted.length > 22 && formatted[22] !== ':') {
      formatted = formatted.slice(0, 22) + ':' + formatted.slice(22);
    }

    // Limitar longitud máxima
    if (formatted.length <= 25) { // PP:MMM:AAAA:ZZZZZ:PPPP:RR
      setReferencia(formatted);
    }
  };

  const clearForm = () => {
    setReferencia('');
    setParcela(null);
    setValidationError(null);
    clearError();
  };

  const exampleReferences = [
    '28:079:0001:00001:0001:WI', // Madrid
    '41:091:0001:00001:0001:XY', // Sevilla
    '08:019:0001:00001:0001:AB', // Barcelona
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-2">
              Referencia Catastral SIGPAC
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  id="referencia"
                  type="text"
                  value={referencia}
                  onChange={(e) => handleReferenceChange(e.target.value)}
                  placeholder="PP:MMM:AAAA:ZZZZZ:PPPP:RR"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    validationError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {validationError && (
                  <p className="text-red-600 text-sm mt-1">{validationError}</p>
                )}
                {error && (
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !!validationError || !referencia.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              {(parcela || referencia) && (
                <Button
                  onClick={clearForm}
                  variant="outline"
                  disabled={loading}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Ayuda de formato */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Formato:</p>
            <ul className="space-y-1 text-xs">
              <li><strong>PP:</strong> Provincia (01-52)</li>
              <li><strong>MMM:</strong> Municipio (001-999)</li>
              <li><strong>AAAA:</strong> Agregado (0000-9999)</li>
              <li><strong>ZZZZZ:</strong> Zona (00001-99999)</li>
              <li><strong>PPPP:</strong> Parcela (0001-9999)</li>
              <li><strong>RR:</strong> Recinto (2 caracteres alfanuméricos)</li>
            </ul>
          </div>

          {/* Referencias de ejemplo */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Referencias de ejemplo:</p>
            <div className="flex flex-wrap gap-2">
              {exampleReferences.map((ref) => {
                const parsed = parseReference(ref);
                return (
                  <button
                    key={ref}
                    onClick={() => setReferencia(ref)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                    disabled={loading}
                  >
                    {ref}
                    {parsed && (
                      <span className="block text-gray-600">
                        {parsed.provincia_nombre}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Resultado de la parcela */}
      {parcela && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Parcela SIGPAC Encontrada
              </h3>
              <div className="flex gap-2">
                <Badge 
                  variant={parcela.fuente === 'WMS' ? 'default' : 'secondary'}
                  className={
                    parcela.fuente === 'WMS' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {parcela.fuente}
                </Badge>
                <Badge variant="outline">
                  Confianza: {Math.round(parcela.confianza * 100)}%
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Información General</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referencia:</span>
                    <span className="font-mono">{parcela.referencia.full}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provincia:</span>
                    <span>{parcela.provincia_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comunidad:</span>
                    <span>{parcela.comunidad_autonoma}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Superficie:</span>
                    <span>{parcela.superficie.toFixed(2)} ha</span>
                  </div>
                  {parcela.cultivo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cultivo:</span>
                      <span>{parcela.cultivo}</span>
                    </div>
                  )}
                  {parcela.uso_sigpac && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uso SIGPAC:</span>
                      <span>{parcela.uso_sigpac}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Ubicación</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitud:</span>
                    <span className="font-mono">{parcela.coordenadas_centroide.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitud:</span>
                    <span className="font-mono">{parcela.coordenadas_centroide.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Geometría:</span>
                    <span>{parcela.geometria.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consulta:</span>
                    <span>{new Date(parcela.fecha_consulta).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  const lat = parcela.coordenadas_centroide.lat;
                  const lng = parcela.coordenadas_centroide.lng;
                  const url = `https://www.google.com/maps/@${lat},${lng},17z`;
                  window.open(url, '_blank');
                }}
                variant="outline"
                size="sm"
              >
                Ver en Google Maps
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(parcela.referencia.full);
                }}
                variant="outline"
                size="sm"
              >
                Copiar Referencia
              </Button>
              <Button
                onClick={() => {
                  const coords = `${parcela.coordenadas_centroide.lat}, ${parcela.coordenadas_centroide.lng}`;
                  navigator.clipboard.writeText(coords);
                }}
                variant="outline"
                size="sm"
              >
                Copiar Coordenadas
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}