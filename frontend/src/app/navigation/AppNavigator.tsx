import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore }         from '@features/auth/store/authStore';

// Auth Screens
import { LoginScreen }    from '@features/auth/screens/LoginScreen';
import { RegisterScreen } from '@features/auth/screens/RegisterScreen';

// App Screens
import { DashboardScreen }   from '@features/inventory/screens/DashboardScreen';
import { ScanScreen }        from '@features/inventory/screens/ScanScreen';
import { FridgeCheckScreen } from '@features/inventory/screens/FridgeCheckScreen';
import { RecipeScreen }      from '@features/recipe/screens/RecipeScreen';
import { Colors }            from '@app/theme/theme';

const Stack = createStackNavigator();

const SCREEN_OPTIONS = {
  headerShown: false,
  cardStyle:   { backgroundColor: Colors.background }, // warm cream #FFF8EA
};

export const AppNavigator: React.FC = () => {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const isAuthenticated = !!(token && user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="Dashboard"   component={DashboardScreen} />
            <Stack.Screen name="Scan"        component={ScanScreen} />
            <Stack.Screen name="FridgeCheck" component={FridgeCheckScreen} />
            <Stack.Screen name="Recipe"      component={RecipeScreen} />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
