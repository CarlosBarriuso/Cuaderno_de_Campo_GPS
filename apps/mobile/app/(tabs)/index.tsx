import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';
import { useState } from 'react';

import { MetricCard } from '@/components/dashboard/MetricCard';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function DashboardScreen() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Buenos días</Text>
          <Text style={styles.userName}>{user?.firstName || 'Agricultor'}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Superficie Total"
            value="247.5 ha"
            trend="+12%"
            trendPositive={true}
            icon="leaf"
          />
          <MetricCard
            title="Actividades"
            value="156"
            trend="+8"
            trendPositive={true}
            icon="activity"
            subtitle="esta semana"
          />
          <MetricCard
            title="Parcelas Activas"
            value="23/28"
            trend="82%"
            trendPositive={true}
            icon="map-pin"
            subtitle="productivas"
          />
          <MetricCard
            title="Rentabilidad"
            value="€1,245/ha"
            trend="+15%"
            trendPositive={true}
            icon="trending-up"
            subtitle="vs anterior"
          />
        </View>

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activities */}
        <RecentActivities />
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
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
});