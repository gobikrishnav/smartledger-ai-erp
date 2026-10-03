import { apiClient } from './client';
import type { FraudAuditLog } from '../types';

export const getPendingAnomalies = async () => {
  const response = await apiClient.get<FraudAuditLog[]>('/api/v1/ai/anomalies/pending');
  return response.data;
};

export const getAllAnomalies = async () => {
  const response = await apiClient.get<FraudAuditLog[]>('/api/v1/ai/anomalies');
  return response.data;
};

export const overrideAnomaly = async (auditId: string, action: 'CONFIRM' | 'OVERRIDE', notes: string) => {
  const response = await apiClient.post(`/api/v1/ai/anomalies/${auditId}/override`, { action, notes });
  return response.data;
};
