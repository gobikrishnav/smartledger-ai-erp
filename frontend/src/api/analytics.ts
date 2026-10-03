import { apiClient } from './client';

export const getExecutiveSummary = async (dateRange?: { start: string; end: string }) => {
  const params = dateRange ? { start_date: dateRange.start, end_date: dateRange.end } : {};
  const response = await apiClient.get('/api/v1/analytics/executive-summary', { params });
  return response.data;
};

export const getCashflowForecast = async () => {
  const response = await apiClient.get('/api/v1/analytics/cashflow-forecast');
  return response.data;
};
