import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

export const getMonospaceFont = (): string => {
  return isIOS ? 'Courier' : 'monospace';
};

export const getKeyboardAvoidingBehavior = () => {
  return isIOS ? 'padding' : 'height';
};

export const getKeyboardVerticalOffset = () => {
  return isIOS ? 0 : 20;
};