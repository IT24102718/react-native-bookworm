import axiosInstance from './axiosConfig';

export const cartAPI = {
  getCart: () => axiosInstance.get('/cart'),
  addToCart: (bookId, title, price, quantity = 1, coverImage = '') => 
    axiosInstance.post('/cart/add', { bookId, title, price, quantity, coverImage }),
  updateCartItem: (bookId, quantity) => axiosInstance.put(`/cart/update/${bookId}`, { quantity }),
  removeFromCart: (bookId) => axiosInstance.delete(`/cart/remove/${bookId}`),
  clearCart: () => axiosInstance.delete('/cart/clear')
};