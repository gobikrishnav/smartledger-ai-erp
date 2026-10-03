import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('smartledger_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUser({
          userId: decoded.userId,
          username: decoded.username,
          full_name: decoded.full_name || decoded.name || 'Authorized Staff',
          name: decoded.full_name || decoded.name || 'Authorized Staff',
          role: decoded.role || 'CASHIER',
          branch_id: decoded.branch_id || 'BR-CENTRAL-01'
        });
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem('smartledger_token');
        localStorage.removeItem('token');
        localStorage.removeItem('jwt');
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const response = await client.post('/auth/login', {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('smartledger_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('jwt', newToken);
    setToken(newToken);
    setUser({
      ...userData,
      userId: userData._id || userData.userId,
      name: userData.full_name || userData.name,
      full_name: userData.full_name || userData.name
    });
    return response.data;
  };

  const register = async (name, email, password, role) => {
    const response = await client.post('/auth/register', {
      full_name: name,
      name,
      email,
      password,
      role: role || 'BUSINESS_OWNER'
    });
    const { token: newToken, user: userData } = response.data;
    if (newToken) {
      localStorage.setItem('smartledger_token', newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('jwt', newToken);
      setToken(newToken);
      setUser({
        ...userData,
        userId: userData._id || userData.userId,
        name: userData.full_name || userData.name,
        full_name: userData.full_name || userData.name
      });
    }
    return response.data;
  };

  const switchDemoRole = async (targetRole) => {
    const roleCredentials = {
      CASHIER:        { u: 'cashier@smartledger.ai',   p: 'Cashier@123' },
      WAREHOUSE_MGR:  { u: 'warehouse@smartledger.ai', p: 'Warehouse@123' },
      BUSINESS_OWNER: { u: 'owner@smartledger.ai',     p: 'Owner@123' },
      ADMIN:          { u: 'admin@smartledger.ai',     p: 'Admin@123' }
    };
    const creds = roleCredentials[targetRole] || roleCredentials.CASHIER;
    try {
      return await login(creds.u, creds.p);
    } catch (err) {
      // Fallback local switch
      const fallbackUser = {
        userId: `demo-${targetRole.toLowerCase()}`,
        username: creds.u,
        full_name: targetRole === 'CASHIER' ? 'Rahul Sharma' : (targetRole === 'WAREHOUSE_MGR' ? 'Suresh Menon' : 'Vikramaditya Singhania'),
        name: targetRole === 'CASHIER' ? 'Rahul Sharma' : (targetRole === 'WAREHOUSE_MGR' ? 'Suresh Menon' : 'Vikramaditya Singhania'),
        role: targetRole,
        branch_id: targetRole === 'WAREHOUSE_MGR' ? 'WH-MAIN-01' : 'BR-CENTRAL-01'
      };
      setUser(fallbackUser);
      return { user: fallbackUser };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartledger_token');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
