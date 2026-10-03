import { apiClient } from './client';
import type { Invoice, ExecutiveSummary } from '../types';

export const createInvoice = async (data: any) => {
  const response = await apiClient.post<Invoice>('/api/v1/pos/invoices', data);
  return response.data;
};

export const getInvoices = async () => {
  const response = await apiClient.get<Invoice[]>('/api/v1/pos/invoices');
  return response.data;
};

export const getProfitSummary = async () => {
  const response = await apiClient.get<ExecutiveSummary>('/api/v1/pos/invoices/profit-summary');
  return response.data;
};
