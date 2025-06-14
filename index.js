import { URL, URLSearchParams } from 'react-native-url-polyfill';

global.URL = URL;
global.URLSearchParams = URLSearchParams;

import 'expo-router/entry';
