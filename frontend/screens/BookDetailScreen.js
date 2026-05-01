import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const BASE_URL = 'http://10.108.116.125:5000';

export default function BookDetailScreen({ navigation, route }) {
  const { book } = route.params;

  return (
    <ScrollView style={styles.container}>
      {book.coverImage ? (
        <Image
          source={{ uri: `${BASE_URL}${book.coverImage}` }}
          style={styles.coverImage}
        />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>📚</Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>By {book.author}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={styles.infoValue}>LKR {book.price}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={styles.infoValue}>{book.stockQuantity}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {book.availabilityStatus ? '✅ Available' : '❌ Unavailable'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ISBN</Text>
        <Text style={styles.isbn}>{book.isbn}</Text>

        {book.description ? (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{book.description}</Text>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditBook', { book })}
        >
          <Text style={styles.editButtonText}>Edit Book</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  coverImage: { width: '100%', height: 300 },
  noImage: {
    width: '100%', height: 200,
    backgroundColor: '#c8e6c9', justifyContent: 'center', alignItems: 'center'
  },
  noImageText: { fontSize: 60 },
  details: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1b361b' },
  author: { fontSize: 16, color: '#688f68', marginTop: 4 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  infoBox: {
    flex: 1, backgroundColor: '#f1f8f2', borderRadius: 8,
    padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#c8e6c9'
  },
  infoLabel: { fontSize: 11, color: '#688f68', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#1b361b', fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e5a2e', marginTop: 16 },
  isbn: { fontSize: 14, color: '#688f68', marginTop: 4 },
  description: { fontSize: 14, color: '#1b361b', marginTop: 4, lineHeight: 22 },
  editButton: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 24, marginBottom: 40
  },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});