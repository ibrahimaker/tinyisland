import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <Text style={styles.title}>Tiny Island</Text>
        <Text style={styles.subtitle}>Your island awaits.</Text>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: '#dff5ff',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  phone: {
    alignItems: 'center',
    backgroundColor: '#fffdf4',
    borderRadius: 28,
    boxShadow: '0 10px 30px rgba(28, 78, 92, 0.16)',
    justifyContent: 'center',
    maxWidth: 430,
    minHeight: 720,
    padding: 32,
    width: '100%',
  },
  subtitle: {
    color: '#5f7478',
    fontSize: 17,
    marginTop: 10,
  },
  title: {
    color: '#244d3b',
    fontSize: 36,
    fontWeight: '700',
  },
});
