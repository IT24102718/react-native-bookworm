import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteBook, getAllBooks } from '../services/bookService';

const BASE_URL = 'http://172.23.239.125:5000';

export default function BookListScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortModal, setSortModal] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const [filterAvailable, setFilterAvailable] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await getAllBooks();
      setBooks(res.data);
      applyFilters(res.data, search, sortOption, filterAvailable);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchBooks);
    return unsubscribe;
  }, [navigation]);

  const applyFilters = (data, searchText, sort, availableOnly) => {
    let result = [...data];
    if (searchText) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(searchText.toLowerCase()) ||
        book.author.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (availableOnly) {
      result = result.filter(book => book.stockQuantity > 0);
    }
    switch (sort) {
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      case 'title_az': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title_za': result.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'stock_high': result.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
      default: break;
    }
    setFilteredBooks(result);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(books, text, sortOption, filterAvailable);
  };

  const handleSort = (option) => {
    setSortOption(option);
    setSortModal(false);
    applyFilters(books, search, option, filterAvailable);
  };

  const handleAvailableFilter = () => {
    const newFilter = !filterAvailable;
    setFilterAvailable(newFilter);
    applyFilters(books, search, sortOption, newFilter);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Book', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBook(id, 'temp-token');
            fetchBooks();
          } catch {
            Alert.alert('Error', 'Failed to delete book');
          }
        }
      }
    ]);
  };

  const handleToggleAvailability = async (book) => {
    try {
      const response = await fetch(`${BASE_URL}/api/books/${book._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityStatus: !book.availabilityStatus }),
      });
      if (response.ok) {
        fetchBooks();
      } else {
        Alert.alert('Error', 'Failed to update availability');
      }
    } catch {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'price_low': return 'Price: Low to High';
      case 'price_high': return 'Price: High to Low';
      case 'title_az': return 'Title: A to Z';
      case 'title_za': return 'Title: Z to A';
      case 'stock_high': return 'Stock: High to Low';
      default: return 'Sort By';
    }
  };

  const totalBooks = books.length;
  const inStockBooks = books.filter(b => b.stockQuantity > 0).length;
  const outOfStockBooks = books.filter(b => b.stockQuantity === 0).length;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading books...</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.summaryNumber}>{totalBooks}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#2e7d32' }]}>
          <Text style={styles.summaryNumber}>{inStockBooks}</Text>
          <Text style={styles.summaryLabel}>In Stock</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#e53935' }]}>
          <Text style={styles.summaryNumber}>{outOfStockBooks}</Text>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBook')}
      >
        <Text style={styles.addButtonText}>+ Add New Book</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by title or author..."
        placeholderTextColor="#767676"
        value={search}
        onChangeText={handleSearch}
      />

      {/* Sort & Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortModal(true)}
        >
          <Text style={styles.sortButtonText}>⇅ {getSortLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.availableButton, filterAvailable && styles.availableButtonActive]}
          onPress={handleAvailableFilter}
        >
          <Text style={[styles.availableButtonText, filterAvailable && styles.availableButtonTextActive]}>
            ✅ In Stock Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result Count */}
      <Text style={styles.resultCount}>
        {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found
      </Text>

      {/* Book List */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchBooks}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('BookDetail', { book: item })}
          >
            <View style={[styles.card, !item.availabilityStatus && styles.cardUnavailable]}>
              {item.coverImage ? (
                <Image
                  source={{ uri: `${BASE_URL}${item.coverImage}` }}
                  style={styles.bookImage}
                />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>📚</Text>
                </View>
              )}
              <View style={styles.bookInfo}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.author}>By {item.author}</Text>
                <Text style={styles.price}>LKR {item.price}</Text>

                <View style={[
                  styles.stockBadge,
                  item.stockQuantity > 0 ? styles.inStock : styles.outOfStock
                ]}>
                  <Text style={styles.stockBadgeText}>
                    {item.stockQuantity > 0 ? `In Stock (${item.stockQuantity})` : 'Out of Stock'}
                  </Text>
                </View>

                {item.stockQuantity > 0 && item.stockQuantity < 5 && (
                  <Text style={styles.lowStockText}>⚠️ Low stock!</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    item.availabilityStatus ? styles.toggleActive : styles.toggleInactive
                  ]}
                  onPress={() => handleToggleAvailability(item)}
                >
                  <Text style={styles.toggleText}>
                    {item.availabilityStatus ? '✅ Available' : '❌ Unavailable'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditBook', { book: item })}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item._id)}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.empty}>No books found!</Text>
            <Text style={styles.emptySubtext}>Try a different search or filter</Text>
          </View>
        }
      />

      {/* Sort Modal */}
      <Modal visible={sortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Books By</Text>
            {[
              { label: '📋 Default', value: 'default' },
              { label: '💰 Price: Low to High', value: 'price_low' },
              { label: '💰 Price: High to Low', value: 'price_high' },
              { label: '🔤 Title: A to Z', value: 'title_az' },
              { label: '🔤 Title: Z to A', value: 'title_za' },
              { label: '📦 Stock: High to Low', value: 'stock_high' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortOption, sortOption === option.value && styles.sortOptionActive]}
                onPress={() => handleSort(option.value)}
              >
                <Text style={[styles.sortOptionText, sortOption === option.value && styles.sortOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeModal} onPress={() => setSortModal(false)}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#688f68', marginTop: 10 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1, borderRadius: 10, padding: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  summaryNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 11, color: '#fff', marginTop: 2 },
  addButton: {
    backgroundColor: '#4CAF50', padding: 14,
    borderRadius: 10, alignItems: 'center', marginBottom: 12
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  searchInput: {
    backgroundColor: '#f4faf5', borderWidth: 1, borderColor: '#c8e6c9',
    borderRadius: 10, padding: 12, fontSize: 15, color: '#1b361b', marginBottom: 10
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sortButton: {
    flex: 1, backgroundColor: '#f1f8f2', borderWidth: 1,
    borderColor: '#c8e6c9', borderRadius: 8, padding: 10, alignItems: 'center'
  },
  sortButtonText: { color: '#2e5a2e', fontSize: 13, fontWeight: '600' },
  availableButton: {
    flex: 1, backgroundColor: '#f1f8f2', borderWidth: 1,
    borderColor: '#c8e6c9', borderRadius: 8, padding: 10, alignItems: 'center'
  },
  availableButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  availableButtonText: { color: '#2e5a2e', fontSize: 13, fontWeight: '600' },
  availableButtonTextActive: { color: '#fff' },
  resultCount: { fontSize: 12, color: '#688f68', marginBottom: 8 },
  card: {
    backgroundColor: '#f1f8f2', borderRadius: 10,
    padding: 12, marginBottom: 12, borderWidth: 1,
    borderColor: '#c8e6c9', flexDirection: 'row', gap: 12
  },
  cardUnavailable: { opacity: 0.6, borderColor: '#ffcdd2' },
  bookImage: { width: 80, height: 110, borderRadius: 6 },
  noImage: {
    width: 80, height: 110, borderRadius: 6,
    backgroundColor: '#c8e6c9', justifyContent: 'center', alignItems: 'center'
  },
  noImageText: { fontSize: 30 },
  bookInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1b361b' },
  author: { fontSize: 13, color: '#688f68', marginTop: 2 },
  price: { fontSize: 14, color: '#2e5a2e', marginTop: 4, fontWeight: '600' },
  stockBadge: {
    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, alignSelf: 'flex-start'
  },
  inStock: { backgroundColor: '#c8e6c9' },
  outOfStock: { backgroundColor: '#ffcdd2' },
  stockBadgeText: { fontSize: 11, fontWeight: '600', color: '#1b361b' },
  lowStockText: { fontSize: 11, color: '#e65100', marginTop: 3, fontWeight: '600' },
  toggleBtn: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, alignSelf: 'flex-start'
  },
  toggleActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#4CAF50' },
  toggleInactive: { backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#e53935' },
  toggleText: { fontSize: 11, fontWeight: '600', color: '#1b361b' },
  actions: { flexDirection: 'row', marginTop: 8, gap: 8 },
  editBtn: {
    backgroundColor: '#4CAF50', padding: 6,
    borderRadius: 6, flex: 1, alignItems: 'center'
  },
  deleteBtn: {
    backgroundColor: '#e53935', padding: 6,
    borderRadius: 6, flex: 1, alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 50 },
  empty: { color: '#688f68', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptySubtext: { color: '#688f68', fontSize: 14, marginTop: 4 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1b361b',
    marginBottom: 16, textAlign: 'center'
  },
  sortOption: {
    padding: 14, borderRadius: 8, marginBottom: 8,
    backgroundColor: '#f1f8f2'
  },
  sortOptionActive: { backgroundColor: '#4CAF50' },
  sortOptionText: { fontSize: 15, color: '#2e5a2e', fontWeight: '500' },
  sortOptionTextActive: { color: '#fff' },
  closeModal: {
    padding: 14, borderRadius: 8, marginTop: 4,
    backgroundColor: '#ffcdd2', alignItems: 'center'
  },
  closeModalText: { color: '#e53935', fontWeight: 'bold', fontSize: 15 },
});