import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import AddBookScreen from './screens/AddBookScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import BookListScreen from './screens/BookListScreen';
import EditBookScreen from './screens/EditBookScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'Bookstore' }} />
        <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add New Book' }} />
        <Stack.Screen name="EditBook" component={EditBookScreen} options={{ title: 'Edit Book' }} />
        <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);
