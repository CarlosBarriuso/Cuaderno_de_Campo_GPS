import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface QuickAction {
  title: string;
  icon: IconSymbolName;
  color: string;
  onPress: () => void;
}

export function QuickActions() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const actions: QuickAction[] = [
    {
      title: 'Nueva Actividad',
      icon: 'plus.circle.fill',
      color: colors.primary,
      onPress: () => router.push('/registro-actividad'),
    },
    {
      title: 'Ver Mapa',
      icon: 'map.fill',
      color: colors.info,
      onPress: () => router.push('/(tabs)/map'),
    },
    {
      title: 'Tomar Foto',
      icon: 'camera.fill',
      color: colors.warning,
      onPress: () => {
        // TODO: Implementar captura de foto
        console.log('Tomar foto');
      },
    },
    {
      title: 'GPS Actual',
      icon: 'location.fill',
      color: colors.error,
      onPress: () => router.push('/registro-actividad'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.title, { color: colors.text }]}>Acciones Rápidas</Text>
      
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            onPress={action.onPress}
          >
            <IconSymbol 
              name={action.icon} 
              size={24} 
              color={action.color} 
            />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {action.title}
            </Text>
          </Pressable>
        ))}
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});