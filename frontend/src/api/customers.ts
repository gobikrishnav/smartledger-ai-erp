import { apiClient } from './client';

export const getCustomers = async () => {
  const response = await apiClient.get('/api/v1/customers');
  return response.data;
};

export const createCustomer = async (data: any) => {
  const response = await apiClient.post('/api/v1/customers', data);
  return response.data;
};

export const getCustomer = async (id: string) => {
  const response = await apiClient.get(`/api/v1/customers/${id}`);
  return response.data;
};
