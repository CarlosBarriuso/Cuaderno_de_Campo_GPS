'use client';

import React, { useState, useEffect } from 'react';
import { ParcelaForm } from '@/components/forms/ParcelaForm';
import { api } from '@/lib/api';

export default function ParcelasPage() {
  const [loading, setLoading] = useState(false);
  const [parcelas, setParcelas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingParcela, setEditingParcela] = useState(null);

  useEffect(() => {
    loadParcelas();
  }, []);

  const loadParcelas = async () => {
    try {
      setLoading(true);
      const response = await api.parcelas.getAll();
      setParcelas(response.data || []);
    } catch (error) {
      console.error('Error loading parcelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Enviando parcela:', data);
      
      if (editingParcela) {
        // TODO: Actualizar parcela existente
        // await api.parcelas.update(editingParcela.id, data);
        console.log('Actualizando parcela:', editingParcela.id);
      } else {
        // TODO: Crear nueva parcela
        // await api.parcelas.create(data);
        console.log('Creando nueva parcela');
      }
      
      // Simular guardado exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(editingParcela ? 'Parcela actualizada correctamente' : 'Parcela registrada correctamente');
      setShowForm(false);
      setEditingParcela(null);
      loadParcelas();
    } catch (error) {
      console.error('Error saving parcela:', error);
      alert('Error al guardar la parcela');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (parcela) => {
    setEditingParcela(parcela);
    setShowForm(true);
  };

  const handleDelete = async (parcelaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta parcela?')) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Eliminar parcela
      // await api.parcelas.delete(parcelaId);
      console.log('Eliminando parcela:', parcelaId);
      
      alert('Parcela eliminada correctamente');
      loadParcelas();
    } catch (error) {
      console.error('Error deleting parcela:', error);
      alert('Error al eliminar la parcela');
    } finally {
      setLoading(false);
    }
  };

  const handleNewParcela = () => {
    setEditingParcela(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingParcela(null);
  };

  const getTotalSuperficie = () => {
    return parcelas.reduce((total, parcela) => total + (parcela.superficie || 0), 0);
  };

  const getCultivoStats = () => {
    const stats = {};
    parcelas.forEach(parcela => {
      if (parcela.cultivo) {
        stats[parcela.cultivo] = (stats[parcela.cultivo] || 0) + (parcela.superficie || 0);
      }
    });
    return stats;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Parcelas
              </h1>
              <p className="mt-2 text-gray-600">
                Administra las parcelas de tu explotación agrícola
              </p>
            </div>
            {!showForm && (
              <button
                onClick={handleNewParcela}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                + Nueva Parcela
              </button>
            )}
          </div>

          {/* Estadísticas rápidas */}
          {!showForm && parcelas.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🌾</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Parcelas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {parcelas.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📏</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Superficie Total
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {getTotalSuperficie().toFixed(2)} ha
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🌱</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Cultivos Diferentes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {Object.keys(getCultivoStats()).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        {showForm ? (
          <div>
            <div className="mb-4">
              <button
                onClick={handleCancelForm}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                ← Volver a Lista
              </button>
            </div>
            <ParcelaForm
              onSubmit={handleSubmit}
              loading={loading}
              initialData={editingParcela}
              mode={editingParcela ? 'edit' : 'create'}
            />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {/* Lista de Parcelas */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Mis Parcelas
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando parcelas...</p>
                </div>
              ) : parcelas.length > 0 ? (
                parcelas.map((parcela, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-bold text-lg">
                              {parcela.nombre?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {parcela.nombre}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>🌾 {parcela.cultivo}</span>
                            <span>📏 {parcela.superficie} ha</span>
                            {parcela.sistemaRiego && (
                              <span>💧 {parcela.sistemaRiego}</span>
                            )}
                          </div>
                          {parcela.fechaSiembra && (
                            <p className="text-xs text-gray-400 mt-1">
                              Siembra: {new Date(parcela.fechaSiembra).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(parcela)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(parcela.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay parcelas registradas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza registrando tu primera parcela.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleNewParcela}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      + Registrar Primera Parcela
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