import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.get('/v1/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/v1/auth/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    await loadUser();
    return response.data;
  };

  const register = async (email, password, fullName) => {
    // 1. Регистрируем пользователя
    await api.post('/v1/auth/register', {
      email,
      password,
      fullName,
    });

    // 2. Автоматически логинимся, чтобы получить токен
    const loginResponse = await api.post('/v1/auth/login', { email, password });
    const { token } = loginResponse.data;
    localStorage.setItem('token', token);

    // 3. Загружаем профиль
    await loadUser();
    return loginResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};