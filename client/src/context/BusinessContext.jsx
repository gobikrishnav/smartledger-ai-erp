import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchBusinessProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get('/business');
      if (res.data?.data) {
        setBusiness(res.data.data);
      }
    } catch (err) {
      // Graceful fallback defaults if not yet logged in or offline
      setBusiness({
        business_name: 'SmartLedger AI Enterprise',
        legal_name: 'SmartLedger Enterprise Ltd',
        currency: 'INR',
        currency_symbol: '₹',
        industry: 'General Enterprise',
        is_onboarded: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const refreshBusiness = () => fetchBusinessProfile();

  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);

  const currencySymbol = business?.currency_symbol || '₹';

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    try {
      return `${currencySymbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    } catch (e) {
      return `${currencySymbol}${num.toFixed(2)}`;
    }
  };

  const setupBusiness = async (formData) => {
    const res = await client.post('/business/setup-wizard', formData);
    if (res.data?.data?.business) {
      setBusiness(res.data.data.business);
    }
    await refreshBusiness();
    return res.data;
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        loading,
        currencySymbol,
        formatCurrency,
        refreshBusiness,
        isWizardOpen,
        openWizard,
        closeWizard,
        setupBusiness,
        isOnboarded: Boolean(business?.is_onboarded)
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
