import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  delay?: number;
  style?: ViewStyle;
}>;

export default function Reveal({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        delay,
        duration: 260,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        delay,
        duration: 260,
        toValue: 0,
        useNativeDriver: true
      })
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
