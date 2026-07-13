import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../api/auth.service';

interface AuthContextType {
  user: User | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: string | null;
  isConsulta: boolean;
  canWrite: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (usuario: string, password: string) => {
    const response = await authService.login(usuario, password);
    const userData: User = {
      id: response.user.id,
      usuario: response.user.usuario,
      nombre: response.user.nombre,
      apellido: response.user.apellido,
      role: response.user.role,
    };
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMINISTRADOR',
        role: user?.role ?? null,
        isConsulta: user?.role === 'CONSULTA',
        canWrite: !!user && user.role !== 'CONSULTA',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
