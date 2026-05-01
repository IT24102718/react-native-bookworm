import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CategoryListScreen from '../screens/categories/CategoryListScreen';
import AddCategoryScreen from '../screens/categories/AddCategoryScreen';
import EditCategoryScreen from '../screens/categories/EditCategoryScreen';
import { COLORS } from '../styles/colors';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Categories"
          component={CategoryListScreen}
          options={{ title: 'Book Categories' }}
        />
        <Stack.Screen
          name="AddCategory"
          component={AddCategoryScreen}
          options={{ title: 'Add Category' }}
        />
        <Stack.Screen
          name="EditCategory"
          component={EditCategoryScreen}
          options={{ title: 'Edit Category' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}