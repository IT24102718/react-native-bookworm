import axios from 'axios';

const BASE_URL = 'http://172.23.239.125:5000/api';

const API = axios.create({ baseURL: BASE_URL });

export const getAllBooks = () => API.get('/books');
export const getBookById = (id) => API.get(`/books/${id}`);
export const createBook = (data, token) =>
  API.post('/books', data, { headers: { Authorization: `Bearer ${token}` } });
export const updateBook = (id, data, token) =>
  API.put(`/books/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteBook = (id, token) =>
  API.delete(`/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });