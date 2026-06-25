import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CalendarDays, Timer, MessageSquare, BarChart3, BrainCircuit, Flame, User } from 'lucide-react-native';

function CustomBottomNav({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const navItems = [
    { name: 'index', icon: LayoutDashboard, isCentral: false },
    { name: 'habits', icon: Flame, isCentral: false },
    { name: 'chat', icon: MessageSquare, isCentral: true },
    { name: 'focus', icon: Timer, isCentral: false },
    { name: 'profile', icon: User, isCentral: false },
  ];

  return (
    <View style={[styles.navContainer, { height: 75 + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const item = navItems.find((n) => n.name === route.name);
        if (!item) return null;

        const isFocused = state.index === index;
        const Icon = item.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (item.isCentral) {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.8} style={styles.centralButtonWrapper}>
              <View style={[styles.centralButton, isFocused && styles.centralButtonActive]}>
                <BrainCircuit size={28} color={isFocused ? Colors.surface : Colors.textDim} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.navItem}>
            <Icon size={24} color={isFocused ? Colors.primary : Colors.textDim} />
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomBottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="focus" />
      <Tabs.Screen name="profile" />

      {/* Hidden screens from Tab Bar */}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centralButtonWrapper: {
    top: -20,
    zIndex: 50,
  },
  centralButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: Colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  centralButtonActive: {
    backgroundColor: Colors.primary,
  },
  navItem: {
    padding: 8,
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  }
});
