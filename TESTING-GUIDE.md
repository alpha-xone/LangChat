# LangChat Testing Guide

## Overview
This guide provides comprehensive testing instructions for the LangChat React Native AI chat package, covering environment setup, code quality checks, unit tests, integration tests, and manual testing.

## Prerequisites

### System Requirements
- Node.js 18+
- npm or yarn
- React Native development environment
- Expo CLI (for example app)
- Android Studio/Xcode (for device testing)

### Environment Setup
1. **Install Dependencies**
   ```bash
   cd c:\Repo\LangChat
   npm install
   ```

2. **Install Example App Dependencies**
   ```bash
   cd c:\Repo\LangChat\example
   npm install
   ```

3. **Environment Variables**
   Create `.env` file in the example directory:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   LANGGRAPH_API_URL=your_langgraph_api_url
   LANGGRAPH_API_KEY=your_langgraph_api_key
   ```

## Testing Levels

### 1. Code Quality & Static Analysis

#### Type Checking
```bash
cd c:\Repo\LangChat
npm run typecheck
```
**Expected Result**: No TypeScript errors

#### Linting
```bash
cd c:\Repo\LangChat
npm run lint
```
**Expected Result**: No ESLint errors or warnings

#### Formatting Check
```bash
cd c:\Repo\LangChat
npx prettier --check "src/**/*.{ts,tsx}"
```

### 2. Unit Tests

#### Run All Unit Tests
```bash
cd c:\Repo\LangChat
npm test
```

#### Run Tests with Coverage
```bash
cd c:\Repo\LangChat
npm test -- --coverage
```

#### Run Tests in Watch Mode
```bash
cd c:\Repo\LangChat
npm test -- --watch
```

#### Run Specific Test Files
```bash
# MessageInput tests
npm test -- MessageInput.test.tsx

# LangGraphClient tests
npm test -- LangGraphClient.test.ts

# All component tests
npm test -- --testPathPattern=components
```

### 3. Integration Tests

#### Test Chat Flow End-to-End
```bash
cd c:\Repo\LangChat
npm test -- --testNamePattern="chat flow"
```

#### Test AI Service Integration
```bash
cd c:\Repo\LangChat
npm test -- --testNamePattern="AI service"
```

### 4. Example App Testing

#### Start Development Server
```bash
cd c:\Repo\LangChat\example
npm start
```

#### Run on Android
```bash
cd c:\Repo\LangChat\example
npm run android
```

#### Run on iOS
```bash
cd c:\Repo\LangChat\example
npm run ios
```

#### Run on Web
```bash
cd c:\Repo\LangChat\example
npm run web
```

## Manual Testing Checklist

### Core Chat Features
- [ ] **Message Sending**
  - [ ] Text messages send successfully
  - [ ] Messages appear in chat interface
  - [ ] Loading states work correctly
  - [ ] Error handling for failed sends

- [ ] **Message Receiving**
  - [ ] AI responses appear correctly
  - [ ] Streaming responses work (if implemented)
  - [ ] Response formatting is correct
  - [ ] Timestamps are accurate

- [ ] **Message Display**
  - [ ] Messages are properly grouped
  - [ ] Sender identification works
  - [ ] Message bubbles display correctly
  - [ ] Scroll behavior is smooth

### File Upload Features
- [ ] **File Selection**
  - [ ] File picker opens correctly
  - [ ] Multiple file types supported
  - [ ] File size validation works
  - [ ] File preview displays

- [ ] **File Upload**
  - [ ] Files upload successfully
  - [ ] Progress indicators work
  - [ ] Error handling for failed uploads
  - [ ] File attachments display in messages

### AI Integration
- [ ] **LangGraph Integration**
  - [ ] API connections work
  - [ ] Authentication succeeds
  - [ ] Responses are properly formatted
  - [ ] Error handling for API failures

- [ ] **Supabase Integration**
  - [ ] Database connections work
  - [ ] Messages persist correctly
  - [ ] User sessions maintain
  - [ ] Real-time updates function

### UI/UX Testing
- [ ] **Responsive Design**
  - [ ] Layout adapts to different screen sizes
  - [ ] Touch targets are appropriately sized
  - [ ] Text scaling works correctly
  - [ ] Dark/light theme support

- [ ] **Accessibility**
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation works
  - [ ] Color contrast is sufficient
  - [ ] Focus indicators are visible

- [ ] **Performance**
  - [ ] App loads quickly
  - [ ] Scrolling is smooth
  - [ ] Memory usage is reasonable
  - [ ] Battery impact is minimal

## Test Scenarios

### Scenario 1: Basic Chat Interaction
1. Open the example app
2. Type a message in the input field
3. Send the message
4. Verify message appears in chat
5. Wait for AI response
6. Verify AI response appears
7. Send follow-up message
8. Verify conversation flow

### Scenario 2: File Upload and Sharing
1. Open the example app
2. Tap the file upload button
3. Select an image file
4. Verify file preview appears
5. Send message with attachment
6. Verify file uploads successfully
7. Verify message with attachment displays

### Scenario 3: Error Handling
1. Disconnect from internet
2. Try to send a message
3. Verify error handling
4. Reconnect to internet
5. Verify message retry/recovery

### Scenario 4: Performance Testing
1. Send 100+ messages rapidly
2. Verify app remains responsive
3. Check memory usage
4. Verify scrolling performance
5. Test with large file uploads

## Debugging Common Issues

### Build Errors
- Ensure all dependencies are installed
- Clear node_modules and reinstall
- Check TypeScript configuration
- Verify React Native version compatibility

### Test Failures
- Check Jest configuration
- Verify test environment setup
- Update test snapshots if needed
- Check mock implementations

### Runtime Errors
- Check console logs for errors
- Verify environment variables
- Test API endpoints independently
- Check network connectivity

## Performance Benchmarks

### Expected Metrics
- **App Launch Time**: < 3 seconds
- **Message Send Time**: < 1 second
- **AI Response Time**: < 10 seconds
- **File Upload Time**: < 5 seconds (1MB file)
- **Memory Usage**: < 150MB
- **Bundle Size**: < 5MB

### Monitoring Tools
- React Native Performance Monitor
- Flipper for debugging
- Metro bundler analysis
- Device performance profiling

## Continuous Integration

### GitHub Actions (if applicable)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
```

## Test Data Management

### Mock Data
- Sample messages for testing
- Mock AI responses
- Test file attachments
- User personas for testing

### Test Cleanup
- Clear test databases after runs
- Remove temporary files
- Reset user preferences
- Clear cached data

## Reporting Issues

### Bug Report Template
1. **Environment**: OS, device, React Native version
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots/Videos**: Visual evidence
6. **Logs**: Console output and error messages

### Performance Issues
1. **Device Specifications**: RAM, CPU, OS version
2. **Performance Metrics**: Timing measurements
3. **Memory Usage**: Profiling data
4. **Network Conditions**: Connection speed, latency

## Next Steps

After completing this testing guide:

1. **Documentation Updates**
   - Update README with testing instructions
   - Add troubleshooting section
   - Document known limitations

2. **Test Coverage Improvements**
   - Add more unit tests for edge cases
   - Implement integration tests
   - Add performance benchmarks

3. **Automation**
   - Set up CI/CD pipeline
   - Automate regression testing
   - Add performance monitoring

4. **User Acceptance Testing**
   - Conduct beta testing
   - Gather user feedback
   - Iterate based on feedback

## Resources

- [React Native Testing Guide](https://reactnative.dev/docs/testing-overview)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
