import { View, Text, StyleSheet, FlatList } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Activity {
  id: string;
  type: string;
  parcela: string;
  date: string;
  status: 'completed' | 'in_progress' | 'planned';
}

export function RecentActivities() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Mock data
  const activities: Activity[] = [
    {
      id: '1',
      type: 'siembra',
      parcela: 'Campo Norte',
      date: 'Hoy, 14:30',
      status: 'completed',
    },
    {
      id: '2',
      type: 'fertilizacion',
      parcela: 'El Olivar',
      date: 'Ayer, 09:15',
      status: 'completed',
    },
    {
      id: '3',
      type: 'riego',
      parcela: 'Huerto Sur',
      date: 'Mañana, 07:00',
      status: 'planned',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'siembra':
        return 'leaf.fill';
      case 'fertilizacion':
        return 'drop.fill';
      case 'riego':
        return 'drop.fill';
      case 'tratamiento':
        return 'thermometer';
      default:
        return 'checkmark.circle.fill';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'siembra':
        return colors.siembra;
      case 'fertilizacion':
        return colors.fertilizacion;
      case 'riego':
        return colors.riego;
      case 'tratamiento':
        return colors.tratamiento;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.info;
      case 'planned':
        return colors.warning;
      default:
        return colors.mutedForeground;
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <View style={[styles.activityItem, { borderBottomColor: colors.cardBorder }]}>
      <View style={styles.activityHeader}>
        <IconSymbol 
          name={getActivityIcon(item.type)} 
          size={20} 
          color={getActivityColor(item.type)} 
        />
        <View style={styles.activityInfo}>
          <Text style={[styles.activityType, { color: colors.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={[styles.activityParcela, { color: colors.mutedForeground }]}>
            {item.parcela}
          </Text>
        </View>
      </View>
      
      <View style={styles.activityFooter}>
        <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
          {item.date}
        </Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.title, { color: colors.text }]}>Actividades Recientes</Text>
      
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 100, // Extra space for tab bar
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  activityItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityParcela: {
    fontSize: 14,
    marginTop: 2,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});