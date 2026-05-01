import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
// Run 'ipconfig' in cmd to find your IPv4 address
const API_URL = 'http://192.168.56.1:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;