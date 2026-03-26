import { useUser } from '@clerk/expo'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomePage() {
  const { user } = useUser()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>{greeting}</Text>

        <Text style={styles.subheading}>
          Welcome back{user ? `, ${user.firstName || 'User'}` : ''}
        </Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Book Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>My Trips</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Home</Text>
          <Text style={styles.cardText}>
            This is the main dashboard of your MoveO app.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Features</Text>
          <Text style={styles.cardText}>• Book rides</Text>
          <Text style={styles.cardText}>• View trip history</Text>
          <Text style={styles.cardText}>• Real‑time ride tracking</Text>
          <Text style={styles.cardText}>• Chat with drivers</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F6F9',
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2F2F42',
  },
  subheading: {
    fontSize: 18,
    color: '#6B6B80',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2F2F42',
  },
  cardText: {
    fontSize: 14,
    color: '#6B6B80',
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#5D5D7D',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
})