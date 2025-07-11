import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  icon: IconSymbolName;
  subtitle?: string;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  trendPositive = true, 
  icon, 
  subtitle 
}: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <IconSymbol 
          name={icon} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      
      {(trend || subtitle) && (
        <View style={styles.footer}>
          {trend && (
            <Text style={[
              styles.trend, 
              { color: trendPositive ? colors.success : colors.error }
            ]}>
              {trend}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
  },
});