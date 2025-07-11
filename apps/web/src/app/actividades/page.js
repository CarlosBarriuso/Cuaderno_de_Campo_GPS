'use client';

import React, { useState, useEffect } from 'react';
import { ActivityForm } from '@/components/forms/ActivityForm';
import { api } from '@/lib/api';

export default function ActividadesPage() {
  const [loading, setLoading] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadActividades();
  }, []);

  const loadActividades = async () => {
    try {
      setLoading(true);
      const response = await api.actividades.getAll();
      setActividades(response.data || []);
    } catch (error) {
      console.error('Error loading actividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Enviando actividad:', data);
      
      // TODO: Enviar a API real
      // await api.actividades.create(data);
      
      // Simular guardado exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Actividad registrada correctamente');
      setShowForm(false);
      loadActividades();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Actividades
              </h1>
              <p className="mt-2 text-gray-600">
                Registra y gestiona las actividades realizadas en campo
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {showForm ? '← Volver a Lista' : '+ Nueva Actividad'}
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        {showForm ? (
          <ActivityForm
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : (
          <div className="bg-white shadow rounded-lg">
            {/* Lista de Actividades */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Actividades Recientes
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando actividades...</p>
                </div>
              ) : actividades.length > 0 ? (
                actividades.map((actividad, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium">
                              {actividad.tipo?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {actividad.tipo}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {actividad.descripcion}
                          </p>
                          <p className="text-xs text-gray-400">
                            {actividad.fechaRealizacion}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {actividad.superficie} ha
                        </p>
                        <p className="text-sm text-gray-500">
                          {actividad.cultivo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay actividades registradas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza registrando tu primera actividad de campo.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      + Registrar Primera Actividad
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}