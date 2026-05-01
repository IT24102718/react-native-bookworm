import axios from 'axios';

// IMPORTANT: Change this to your computer's IP address
// To find your IP: Open Command Prompt (cmd) and type 'ipconfig'
// Look for "IPv4 Address" - example: 192.168.1.100
const YOUR_COMPUTER_IP = '192.168.8.132'; // Use the IP from your Expo screen!

const BASE_URL = `http://${YOUR_COMPUTER_IP}:5000/api`;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;