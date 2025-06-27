import * as Clipboard from 'expo-clipboard';

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const getClipboardContent = async (): Promise<string | null> => {
  try {
    return await Clipboard.getStringAsync();
  } catch (error) {
    console.error('Failed to get clipboard content:', error);
    return null;
  }
};