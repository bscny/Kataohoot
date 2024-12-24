import apiClient from '@/services/APIClient.js;';

const api = {
    async getUsers() {
        try {
            const response = await apiClient.get('/users');
            return response.data;
        } catch (error) {
            console.error('Error while fetching users', error);
            return [];
        }
    },
    async getUserById(id) {
        try {
            const response = await apiClient.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error while fetching user by id', error);
            return null;
        }
    },
    async createUser(user) {
        try {
            const response = await apiClient.post('/users', user);
            return response.data;
        } catch (error) {
            console.error('Error while creating user', error);
            return null;
        }
    },
    async updateUser(user) {
        try {
            const response = await apiClient.put(`/users/${user.id}`, user);
            return response.data;
        } catch (error) {
            console.error('Error while updating user', error);
            return null;
        }
    },
    async deleteUser(id) {
        try {
            const response = await apiClient.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error while deleting user', error);
            return null;
        }
    }
};
  
export default api;