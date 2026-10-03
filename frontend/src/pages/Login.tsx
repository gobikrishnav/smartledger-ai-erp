import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const user = await login(params);
      
      // Route based on role
      // @ts-ignore
      const role = useAuthStore.getState().user?.role;
      if (role === 'Cashier') navigate('/pos');
      else if (role === 'Warehouse_Manager') navigate('/warehouse');
      else navigate('/owner');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    }
  };

  const demoLogin = (role: string) => {
    setEmail(`demo_${role.toLowerCase()}@smartledger.ai`);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div className="bg-white border border-black max-w-md w-full p-8 rounded shadow-lg">
        <h1 className="text-3xl font-bold text-black mb-2 text-center">Smart Ledger AI</h1>
        <p className="text-gray-500 text-center mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-3 border border-gray-400 bg-gray-100 text-black text-sm font-medium rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-black font-semibold mb-1">Email / Username</label>
            <input 
              type="text" 
              className="w-full border border-gray-400 p-2 text-black bg-white focus:outline-none focus:border-black"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-black font-semibold mb-1">Password</label>
            <input 
              type="password" 
              className="w-full border border-gray-400 p-2 text-black bg-white focus:outline-none focus:border-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-3 hover:bg-gray-800 transition disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-300 pt-6">
          <p className="text-sm font-semibold text-black mb-3 text-center">Quick Demo Roles</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => demoLogin('Owner')} className="border border-black text-black text-xs py-2 hover:bg-gray-100 font-medium">Business Owner</button>
            <button onClick={() => demoLogin('Manager')} className="border border-black text-black text-xs py-2 hover:bg-gray-100 font-medium">Warehouse Mgr</button>
            <button onClick={() => demoLogin('Cashier')} className="border border-black text-black text-xs py-2 hover:bg-gray-100 font-medium">Cashier</button>
          </div>
        </div>
      </div>
    </div>
  );
}
