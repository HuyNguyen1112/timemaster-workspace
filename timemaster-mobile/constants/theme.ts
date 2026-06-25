/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#16A34A', // Vibrant Green - Xanh lá sáng rực rỡ, tràn đầy năng lượng (giống logo VNUA)
  background: '#F6F4F0', // Warm Beige - Màu kem/nền giấy siêu dịu mắt
  surface: '#ffffff', // Trắng ngà nhạt cho các thẻ
  text: '#333D39', // Xám ánh rêu sâu - Mềm mại hơn màu đen
  textDim: '#8A9A92', // Xám rêu nhạt
  border: '#D9D4C7', // Viền be đậm hơn một chút để hiện rõ ràng
  error: '#E5989B', // Đỏ hồng san hô (Rose) - Dịu hơn đỏ tươi
  success: '#6B9080', // Xanh xám
  warning: '#E2B57B', // Vàng cát (Gold/Sand)
  matrix: {
    q1: '#E5989B', // Đỏ san hô nhạt (Quan trọng & Khẩn cấp)
    q2: '#16A34A', // Xanh Vibrant Green (Quan trọng & Không khẩn)
    q3: '#E2B57B', // Vàng cát (Khẩn cấp & Không quan trọng)
    q4: '#A3B18A'  // Xanh rêu nhạt (Không khẩn & Không quan trọng)
  },
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
