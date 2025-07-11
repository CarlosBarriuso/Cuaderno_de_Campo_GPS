import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function WeatherWidget() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Mock weather data
  const weatherData = {
    temperature: 18,
    description: 'Parcialmente nublado',
    humidity: 65,
    wind: 12,
    precipitation: 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <IconSymbol name="sun.max.fill" size={24} color={colors.warning} />
        <Text style={[styles.title, { color: colors.text }]}>Condiciones Actuales</Text>
      </View>

      <View style={styles.mainInfo}>
        <Text style={[styles.temperature, { color: colors.text }]}>{weatherData.temperature}°C</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {weatherData.description}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <IconSymbol name="drop.fill" size={16} color={colors.info} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {weatherData.humidity}%
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <IconSymbol name="wind" size={16} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {weatherData.wind} km/h
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <IconSymbol name="drop.fill" size={16} color={colors.info} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {weatherData.precipitation} mm
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginTop: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
});