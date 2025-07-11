import { View, Text, StyleSheet, ImageBackground, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Cuaderno de Campo GPS</Text>
              <Text style={styles.subtitle}>
                Gestiona tus parcelas y actividades agrícolas con precisión GPS
              </Text>
              <Text style={styles.description}>
                Registra siembras, tratamientos, fertilización y cosechas. 
                Optimiza tu producción con datos precisos y análisis detallados.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                <Text style={styles.primaryButtonText}>Comenzar</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.8,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  content: {
    gap: 48,
  },
  textContainer: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});