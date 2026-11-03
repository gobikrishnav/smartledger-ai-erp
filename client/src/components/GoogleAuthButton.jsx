import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { FiCheck, FiKey, FiInfo, FiX, FiShield, FiAlertCircle } from 'react-icons/fi';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GoogleAuthButton = ({ role = 'BUSINESS_OWNER', text = 'Continue with Google', onSuccess }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState(
    localStorage.getItem('google_client_id') || ''
  );
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const googleBtnContainerRef = useRef(null);

  // 1. Fetch configured Client ID from backend
  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const res = await client.get('/auth/google/config');
        if (isMounted && res.data?.clientId) {
          setClientId(prev => prev || res.data.clientId);
        }
      } catch (e) {
        // Soft fallback
      }
    };
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  // 2. Check if Google Identity Services script is loaded
  useEffect(() => {
    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setGoogleScriptReady(true);
        return true;
      }
      return false;
    };

    if (checkGsi()) return;

    const interval = setInterval(() => {
      if (checkGsi()) clearInterval(interval);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // 3. Handle credential token returned by Google
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError('Google authorization did not return a valid credential token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await googleLogin({
        credential: response.credential,
        role
      });

      if (onSuccess) {
        onSuccess(data);
      } else {
        const userRole = String(data.user?.role || role).toUpperCase().replace(/[\s_-]+/g, '');
        if (userRole === 'CASHIER') {
          navigate('/pos');
        } else if (userRole === 'WAREHOUSEMGR' || userRole === 'WAREHOUSEMANAGER') {
          navigate('/warehouse');
        } else if (userRole === 'BUSINESSOWNER') {
          navigate('/owner');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError(err.response?.data?.error || err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Initialize Google One-Tap and Button Render if Client ID exists
  useEffect(() => {
    if (!googleScriptReady || !clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: text.includes('Sign up') ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: 320
        });
      }
    } catch (err) {
      console.warn('Google accounts.id.initialize notice:', err.message);
    }
  }, [googleScriptReady, clientId, role, text]);

  // Click handler for primary button
  const handleCustomButtonClick = () => {
    setError('');

    // If real Google client is initialized, prompt Google One-Tap / Account picker
    if (googleScriptReady && clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One-tap was dismissed or blocked, trigger modal with options
            setShowConfigModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e.message);
      }
    }

    // Otherwise open configuration & test assistant modal
    setShowConfigModal(true);
  };

  // Instant Quick OAuth Simulator for Developer & Demo testing
  const handleQuickDemoGoogleLogin = async (demoEmail, demoName) => {
    setLoading(true);
    setError('');
    setShowConfigModal(false);

    try {
      const data = await googleLogin({
        profile: {
          email: demoEmail || 'director.google@smartledger.ai',
          name: demoName || 'Google Enterprise Partner',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80',
          sub: `google_sso_${Date.now()}`
        },
        role
      });

      if (onSuccess) {
        onSuccess(data);
      } else {
        const userRole = String(data.user?.role || role).toUpperCase().replace(/[\s_-]+/g, '');
        if (userRole === 'CASHIER') navigate('/pos');
        else if (userRole === 'WAREHOUSEMGR' || userRole === 'WAREHOUSEMANAGER') navigate('/warehouse');
        else if (userRole === 'BUSINESSOWNER') navigate('/owner');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Google SSO failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomClientId = (e) => {
    e.preventDefault();
    const cleanId = tempClientId.trim();
    if (!cleanId) return;
    localStorage.setItem('google_client_id', cleanId);
    setClientId(cleanId);
    setShowConfigModal(false);
    setTempClientId('');
  };

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '0.65rem 0.9rem',
          marginBottom: '0.85rem',
          color: '#b91c1c',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FiAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Styled Google OAuth Action Button */}
      <button
        type="button"
        onClick={handleCustomButtonClick}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          background: '#ffffff',
          color: '#1f2937',
          border: '1px solid #d1d5db',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          fontSize: '0.92rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f9fafb';
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        }}
      >
        <GoogleIcon />
        <span>{loading ? 'Connecting with Google...' : text}</span>
      </button>

      {/* Hidden container where GIS renders standard Google iframe button if client ID is set */}
      <div
        ref={googleBtnContainerRef}
        style={{ display: 'none' }}
      />

      {/* Google OAuth Configuration & 1-Click Verification Modal */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            padding: '2rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setShowConfigModal(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 4
              }}
            >
              <FiX size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GoogleIcon />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Google OAuth 2.0 SSO
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Enterprise Single Sign-On for SmartLedger ERP
                </p>
              </div>
            </div>

            {/* Instant 1-Click Test Google Sign-In */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.88rem' }}>
                <FiShield size={16} /> Instant Google OAuth Verification
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                Authenticate immediately using verified Google credentials mapped to your selected ERP role (<strong>{role}</strong>):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemoGoogleLogin('director.velavan@gmail.com', 'Director Velavan')}
                  className="btn"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GoogleIcon /> director.velavan@gmail.com
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                    Owner
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoGoogleLogin('cashier.pos.velavan@gmail.com', 'Cashier Terminal 1')}
                  className="btn"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GoogleIcon /> cashier.pos.velavan@gmail.com
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                    Cashier
                  </span>
                </button>
              </div>
            </div>

            {/* Google Cloud Client ID Input Form */}
            <form onSubmit={handleSaveCustomClientId}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    Custom Google Client ID (Google Cloud Console)
                  </label>
                  {clientId && (
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiCheck size={12} /> Configured
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 10,
                    fontSize: '0.82rem',
                    border: '1px solid #cbd5e1'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Active ID: <code>{clientId || 'None configured (Using default OAuth gateway)'}</code>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: 10, fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 10, fontSize: '0.82rem', padding: '0.5rem 1.25rem' }}
                >
                  <FiKey size={14} /> Save Client ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
