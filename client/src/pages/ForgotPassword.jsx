import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiShield } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
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
            Account Recovery
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Enter your email to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
              padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem'
            }}>
              <FiCheckCircle size={28} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Recovery Dispatch Sent</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Instructions have been sent to <strong>{email}</strong>.
              </div>
            </div>

            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                color: '#2563eb', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem'
              }}
            >
              <FiArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <FiMail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="name@smartledger.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem', borderRadius: 12 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700',
                marginBottom: '1.25rem'
              }}
            >
              {loading ? 'Validating Directory...' : 'Send Reset Instructions'}
            </button>

            <div style={{ textAlign: 'center' }}>
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

export default ForgotPassword;
