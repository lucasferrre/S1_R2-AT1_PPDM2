import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types/navigation';

import HomeScreen from './src/screens/Home';
import PosicaoGpsScreen from './src/screens/PosicaoGPS';
import RedesWifiScreen from './src/screens/RedesWifi';
import AcelerometroScreen from './src/screens/Acelerometro';
import CameraScreen from './src/screens/Camera';

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name='HomeScreen'
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='PosicaoGpsScreen'
          component={PosicaoGpsScreen}
          options={{ title: 'Posição atual' }}
        />
        <Stack.Screen
          name='RedesWifiScreen'
          component={RedesWifiScreen}
          options={{ title: 'Dados da conexão' }}
        />
        <Stack.Screen
          name='AcelerometroScreen'
          component={AcelerometroScreen}
          options={{ title: 'Acelerometro' }}
        />
        <Stack.Screen
          name='CameraScreen'
          component={CameraScreen}
          options={{headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}