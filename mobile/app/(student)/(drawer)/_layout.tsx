import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'nativewind';
import { CustomDrawerContent } from '../../../components/navigation/CustomDrawerContent';
import { DRAWER_CONFIG } from '../../../utils/drawerConfig';
import "../../../global.css";

/**
 * Advanced Dynamic Drawer Layout
 * Registers all routes from DRAWER_CONFIG and uses custom orchestration.
 * Sanket
 */
export default function DrawerLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Flatten items for route registration
  const allNavItems = DRAWER_CONFIG.flatMap(cat => cat.items);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: {
            backgroundColor: isDark ? '#020817' : '#ffffff',
            width: 320,
          },
          overlayColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          swipeEdgeWidth: 100,
        }}
      >
        {/* Step 1: Register Category-less routes or specific tab groups */}
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerItemStyle: { display: 'none' }, // Handled by our custom UI
          }}
        />

        {/* Step 2: Dynamically register all other routes from config */}
        {allNavItems
          .filter(item => !item.route.includes('(tabs)'))
          .map((item) => {
            // Extract the filename from the route
            const routeName = item.route.split('/').pop() || '';

            return (
              <Drawer.Screen
                key={item.id}
                name={routeName}
                options={{
                  drawerItemStyle: { display: 'none' }, // Handled by our custom UI
                }}
              />
            );
          })}
      </Drawer>
    </GestureHandlerRootView>
  );
}

