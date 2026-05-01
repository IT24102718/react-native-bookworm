import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import InventoryListScreen   from "./screens/inventory/InventoryListScreen";
import InventoryDetailScreen from "./screens/inventory/InventoryDetailScreen";
import AddStockScreen        from "./screens/inventory/AddStockScreen";
import LowStockAlertsScreen  from "./screens/inventory/LowStockAlertsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="InventoryList"
        screenOptions={{
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="InventoryList"
          component={InventoryListScreen}
          options={{ title: "Stock Manager" }}
        />
        <Stack.Screen
          name="InventoryDetail"
          component={InventoryDetailScreen}
          options={{ title: "Stock Detail" }}
        />
        <Stack.Screen
          name="AddStock"
          component={AddStockScreen}
          options={{ title: "Update Stock" }}
        />
        <Stack.Screen
          name="LowStockAlerts"
          component={LowStockAlertsScreen}
          options={{ title: "Low Stock Alerts" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}