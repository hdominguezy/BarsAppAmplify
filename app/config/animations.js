import { Animated, Easing } from 'react-native';

// HomeScreen
// ListItemDetails
export const fadeInAnimation = (value, duration = 100) => Animated.timing(value, {
  toValue: 1,
  duration,
  easing: Easing.ease,
  useNativeDriver: true,
});

// ListItem
export const itemAnimation = value => Animated.timing(value, {
  toValue: 1,
  duration: 100,
  easing: Easing.linear,
  useNativeDriver: true,
});
