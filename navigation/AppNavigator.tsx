import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import NotesScreen from '../screens/NotesScreen';

export type RootStackParamList = {
  Auth: undefined;
  Notes: undefined;
};

type AuthScreenNavigationProps = StackScreenProps<RootStackParamList, 'Auth'>;

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Auth">
            {(props: AuthScreenNavigationProps) => (
              <AuthScreen
                {...props}
                onAuthSuccess={() => setAuthenticated(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Notes" component={NotesScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
