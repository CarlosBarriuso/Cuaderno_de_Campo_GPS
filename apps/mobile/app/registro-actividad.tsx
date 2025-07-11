import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '@clerk/clerk-expo';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface ActivityForm {
  tipo: string;
  descripcion: string;
  parcela: string;
  ubicacion: LocationData | null;
}

export default function RegistroActividadScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [form, setForm] = useState<ActivityForm>({
    tipo: '',
    descripcion: '',
    parcela: '',
    ubicacion: null,
  });
  
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'La aplicación necesita acceso a la ubicación para registrar actividades GPS.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurar', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert('Error', 'Permisos de ubicación no concedidos');
      return;
    }

    setLocationLoading(true);
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000,
        timeout: 15000,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Date.now(),
      };

      setForm(prev => ({ ...prev, ubicacion: locationData }));
      
      Alert.alert(
        'Ubicación capturada',
        `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}\nPrecisión: ${location.coords.accuracy}m`
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error de ubicación',
        'No se pudo obtener la ubicación actual. Verifica que el GPS esté activado.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!form.tipo.trim()) {
      Alert.alert('Error', 'Selecciona un tipo de actividad');
      return;
    }
    
    if (!form.descripcion.trim()) {
      Alert.alert('Error', 'Ingresa una descripción');
      return;
    }
    
    if (!form.ubicacion) {
      Alert.alert('Error', 'Captura la ubicación GPS antes de guardar');
      return;
    }

    try {
      // Simular envío a API
      const activityData = {
        ...form,
        userId,
        fechaRegistro: new Date().toISOString(),
      };

      console.log('Enviando actividad:', activityData);
      
      // TODO: Implementar llamada real a API
      // await api.actividades.create(activityData);
      
      Alert.alert(
        'Actividad registrada',
        'La actividad se ha registrado correctamente',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'No se pudo guardar la actividad');
    }
  };

  const tiposActividad = [
    'Siembra',
    'Fertilización',
    'Tratamiento Fitosanitario',
    'Riego',
    'Poda',
    'Cosecha',
    'Laboreo',
    'Supervisión',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Actividad</Text>
          <Text style={styles.subtitle}>Registra la actividad con ubicación GPS</Text>
        </View>

        {/* Tipo de Actividad */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Actividad *</Text>
          <View style={styles.optionsContainer}>
            {tiposActividad.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.optionButton,
                  form.tipo === tipo && styles.optionButtonSelected
                ]}
                onPress={() => setForm(prev => ({ ...prev, tipo }))}
              >
                <Text style={[
                  styles.optionText,
                  form.tipo === tipo && styles.optionTextSelected
                ]}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={styles.textArea}
            value={form.descripcion}
            onChangeText={(text) => setForm(prev => ({ ...prev, descripcion: text }))}
            placeholder="Describe la actividad realizada..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Parcela */}
        <View style={styles.section}>
          <Text style={styles.label}>Parcela (opcional)</Text>
          <TextInput
            style={styles.input}
            value={form.parcela}
            onChangeText={(text) => setForm(prev => ({ ...prev, parcela: text }))}
            placeholder="Nombre o código de la parcela"
          />
        </View>

        {/* GPS Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Ubicación GPS *</Text>
          
          {form.ubicacion ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Lat: {form.ubicacion.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📍 Lng: {form.ubicacion.longitude.toFixed(6)}
              </Text>
              <Text style={styles.accuracyText}>
                Precisión: {form.ubicacion.accuracy?.toFixed(1)}m
              </Text>
              <Text style={styles.timestampText}>
                {new Date(form.ubicacion.timestamp).toLocaleString()}
              </Text>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Text style={styles.noLocationText}>
                No se ha capturado la ubicación
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.locationButton,
              locationLoading && styles.locationButtonDisabled
            ]}
            onPress={getCurrentLocation}
            disabled={locationLoading || !locationPermission}
          >
            {locationLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.locationButtonText}>
                {form.ubicacion ? '🔄 Actualizar Ubicación' : '📍 Capturar Ubicación GPS'}
              </Text>
            )}
          </TouchableOpacity>

          {!locationPermission && (
            <Text style={styles.permissionWarning}>
              ⚠️ Permisos de ubicación requeridos
            </Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!form.tipo || !form.descripcion || !form.ubicacion) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!form.tipo || !form.descripcion || !form.ubicacion}
        >
          <Text style={styles.submitButtonText}>
            💾 Registrar Actividad
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  locationInfo: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  noLocationContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  noLocationText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionWarning: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#10b981',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});