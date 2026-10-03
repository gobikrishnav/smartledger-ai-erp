import { apiClient } from './client';
import type { Product } from '../types';

export const getProducts = async (branchId?: string) => {
  const url = branchId ? `/api/v1/inventory/products?branch_id=${branchId}` : '/api/v1/inventory/products';
  const response = await apiClient.get<Product[]>(url);
  return response.data;
};

export const createProduct = async (data: any) => {
  const response = await apiClient.post<Product>('/api/v1/inventory/products', data);
  return response.data;
};
