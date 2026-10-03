import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiShield, FiArrowLeft } from 'react-icons/fi';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2500);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f6f8fb',
      backgroundImage: `
        linear-gradient(rgba(226, 232, 240, 0.45) 1px, transparent 1px),
        linear-gradient(90deg, rgba(226, 232, 240, 0.45) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px',
      color: '#0f172a', padding: '1.5rem'
    }}>
      <div style={{
        background: '#ffffff', width: '100%', maxWidth: '440px', padding: '2.5rem',
        borderRadius: '24px', border: '1px solid #eef2f6',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
            margin: '0 auto 1rem auto'
          }}>
            <FiShield size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Set New Password
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Create a secure passphrase for your account.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
              padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem'
            }}>
              <FiCheckCircle size={28} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Password Updated</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Redirecting you to the secure sign-in console...
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem', borderRadius: 12 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem', borderRadius: 12 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700'
              }}
            >
              Update Credentials
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600'
                }}
              >
                <FiArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
