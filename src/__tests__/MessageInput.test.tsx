import 'react-native';
import { MessageInput } from '../components/chat/MessageInput';
import { mockTheme } from './setup';

// Mock the theme hook
jest.mock('../theming/useAppTheme', () => ({
  useAppTheme: () => ({ theme: mockTheme }),
}));

// Mock FileUpload component
jest.mock('../components/chat/FileUpload', () => ({
  FileUpload: () => null,
}));

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnFileUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    onFileUpload: mockOnFileUpload,
  };

  it('should create component instance', () => {
    expect(MessageInput).toBeDefined();
    expect(typeof MessageInput).toBe('function');
  });

  it('should have correct default props', () => {
    const component = MessageInput(defaultProps);
    expect(component).toBeDefined();
  });

  it('should accept all required props', () => {
    const props = {
      onSendMessage: jest.fn(),
      placeholder: 'Test placeholder',
      disabled: false,
      maxLength: 1000,
      autoFocus: true,
    };

    const component = MessageInput(props);
    expect(component).toBeDefined();
  });
});
