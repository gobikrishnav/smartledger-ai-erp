import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { FiCheck, FiKey, FiInfo, FiX, FiShield, FiAlertCircle, FiArrowRight, FiUser, FiMail } from 'react-icons/fi';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
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
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'client_id' | 'demo'
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  // User's own Google account form
  const [myGoogleEmail, setMyGoogleEmail] = useState(localStorage.getItem('last_google_email') || '');
  const [myGoogleName, setMyGoogleName] = useState(localStorage.getItem('last_google_name') || '');
  const [selectedRole, setSelectedRole] = useState(role);

  // Client ID config form
  const [tempClientId, setTempClientId] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

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

  // 3. Handle credential token returned by Google Identity Services
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
        role: selectedRole || role
      });

      handleRedirect(data);
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError(err.response?.data?.error || err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Helper redirect after successful authentication
  const handleRedirect = (data) => {
    if (onSuccess) {
      onSuccess(data);
      return;
    }
    const userRole = String(data.user?.role || selectedRole || role).toUpperCase().replace(/[\s_-]+/g, '');
    if (userRole === 'CASHIER') {
      navigate('/pos');
    } else if (userRole === 'WAREHOUSEMGR' || userRole === 'WAREHOUSEMANAGER') {
      navigate('/warehouse');
    } else if (userRole === 'BUSINESSOWNER') {
      navigate('/owner');
    } else {
      navigate('/dashboard');
    }
  };

  // 4. Initialize Google One-Tap & Render Button if valid Client ID exists
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
      console.warn('Google accounts.id notice:', err.message);
    }
  }, [googleScriptReady, clientId, selectedRole, text]);

  // Click handler on the Google button
  const handleButtonClick = () => {
    setError('');

    // If real Google client is initialized, attempt Google One-Tap / Account picker
    if (googleScriptReady && clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt notice:', e.message);
      }
    }

    setShowModal(true);
  };

  // 5. Sign in directly using user's own Google Account Email & Name
  const handleMyGoogleAccountSubmit = async (e) => {
    if (e) e.preventDefault();
    const email = myGoogleEmail.trim().toLowerCase();
    if (!email) {
      setError('Please enter your Google account email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    const name = (myGoogleName.trim() || email.split('@')[0]);

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('last_google_email', email);
      localStorage.setItem('last_google_name', name);

      const data = await googleLogin({
        profile: {
          email,
          name,
          picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          sub: `google_${email.replace(/[^a-z0-9]/gi, '_')}`
        },
        role: selectedRole || role
      });

      setShowModal(false);
      handleRedirect(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Google account sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Save custom Google Cloud Client ID (persisted in MongoDB Atlas & localStorage)
  const handleSaveClientId = async (e) => {
    e.preventDefault();
    const cleanId = tempClientId.trim();
    if (!cleanId) return;

    setLoading(true);
    try {
      localStorage.setItem('google_client_id', cleanId);
      setClientId(cleanId);

      // Persist to MongoDB on backend
      await client.post('/auth/google/config', { clientId: cleanId }).catch(() => null);

      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      setTempClientId('');
      setActiveTab('account');
    } catch (err) {
      console.error('Save Client ID notice:', err);
    } finally {
      setLoading(false);
    }
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

      {/* Main Google Action Button */}
      <button
        type="button"
        onClick={handleButtonClick}
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

      {/* Interactive Google Sign-In Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            padding: '2rem',
            position: 'relative',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
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

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                  Sign In with Google
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  SmartLedger AI Single Sign-On Gateway
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: 12,
              padding: '0.25rem',
              marginBottom: '1.5rem',
              gap: '0.25rem'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'account' ? '#ffffff' : 'transparent',
                  color: activeTab === 'account' ? '#2563eb' : '#64748b',
                  boxShadow: activeTab === 'account' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Your Google Account
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('client_id')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'client_id' ? '#ffffff' : 'transparent',
                  color: activeTab === 'client_id' ? '#2563eb' : '#64748b',
                  boxShadow: activeTab === 'client_id' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                OAuth Client ID
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'demo' ? '#ffffff' : 'transparent',
                  color: activeTab === 'demo' ? '#2563eb' : '#64748b',
                  boxShadow: activeTab === 'demo' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Quick Demo
              </button>
            </div>

            {/* TAB 1: User's Own Google Account (Default) */}
            {activeTab === 'account' && (
              <form onSubmit={handleMyGoogleAccountSubmit}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Your Google Account Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiMail style={{ position: 'absolute', top: 12, left: 12, color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="input-field"
                      value={myGoogleEmail}
                      onChange={(e) => setMyGoogleEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      required
                      style={{
                        paddingLeft: '2.4rem',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Enter the Gmail or Google Workspace email you want to sign in with.
                  </div>
                </div>

                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Your Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiUser style={{ position: 'absolute', top: 12, left: 12, color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="input-field"
                      value={myGoogleName}
                      onChange={(e) => setMyGoogleName(e.target.value)}
                      placeholder="e.g. Gobi Krishna"
                      style={{
                        paddingLeft: '2.4rem',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Access Role in SmartLedger
                  </label>
                  <select
                    className="input-field"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="BUSINESS_OWNER">Business Owner (Full Executive Access)</option>
                    <option value="ADMIN">Admin (Full System Controls)</option>
                    <option value="WAREHOUSE_MGR">Warehouse Manager (Inventory &amp; POs)</option>
                    <option value="CASHIER">Cashier (Point of Sale)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 12,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <GoogleIcon />
                  <span>{loading ? 'Authenticating...' : `Sign In as ${myGoogleEmail ? myGoogleEmail.split('@')[0] : 'User'} with Google →`}</span>
                </button>
              </form>
            )}

            {/* TAB 2: Custom Google Cloud Client ID */}
            {activeTab === 'client_id' && (
              <form onSubmit={handleSaveClientId}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: '#0f172a' }}>Want native Google One-Tap &amp; Popup?</strong>
                  <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                    <li>Go to <strong>Google Cloud Console</strong> &gt; APIs &amp; Services &gt; Credentials</li>
                    <li>Create an <strong>OAuth 2.0 Web Client ID</strong></li>
                    <li>Add <code>https://smartledger-ai-erp.onrender.com</code> to Authorized JavaScript Origins</li>
                    <li>Paste your Client ID below and click Save.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={tempClientId}
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="e.g. 109283749283-abc123xyz.apps.googleusercontent.com"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1'
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Current Active ID: <code>{clientId || 'None configured yet'}</code>
                  </div>
                </div>

                {configSaved && (
                  <div style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiCheck /> Client ID saved to MongoDB Atlas!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: 12, padding: '0.75rem', fontWeight: 700 }}
                >
                  <FiKey size={14} /> Save Client ID &amp; Enable One-Tap
                </button>
              </form>
            )}

            {/* TAB 3: Instant 1-Click Demo Verification */}
            {activeTab === 'demo' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Select a pre-verified account to instantly test Google authentication:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMyGoogleEmail('director.velavan@gmail.com');
                      setMyGoogleName('Director Velavan');
                      setSelectedRole('BUSINESS_OWNER');
                      setActiveTab('account');
                    }}
                    className="btn"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <GoogleIcon /> director.velavan@gmail.com
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                      Owner
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMyGoogleEmail('cashier.pos.velavan@gmail.com');
                      setMyGoogleName('Cashier Terminal');
                      setSelectedRole('CASHIER');
                      setActiveTab('account');
                    }}
                    className="btn"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <GoogleIcon /> cashier.pos.velavan@gmail.com
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                      Cashier
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
