import axiosInstance from './axiosConfig';

export const categoryAPI = {
  // Get all categories
  getAllCategories: () => axiosInstance.get('/categories'),

  // Get single category
  getCategoryById: (id) => axiosInstance.get(`/categories/${id}`),

  // Create category
  createCategory: (data) => axiosInstance.post('/categories', data),

  // Update category
  updateCategory: (id, data) => axiosInstance.put(`/categories/${id}`, data),

  // Delete category
  deleteCategory: (id) => axiosInstance.delete(`/categories/${id}`),
};
