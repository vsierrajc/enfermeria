import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/pacientes', label: 'Pacientes', icon: '👥' },
    { path: '/controles', label: 'Controles', icon: '🩺' },
    { path: '/recetas', label: 'Recetas', icon: '💊' },
    { path: '/remisiones', label: 'Remisiones', icon: '📋' },
    { path: '/medicamentos', label: 'Medicamentos', icon: '💉' },
    ...(isAdmin ? [{ path: '/enfermeras', label: 'Enfermeras', icon: '👩‍⚕️' }] : []),
    { path: '/estadisticas', label: 'Estadísticas', icon: '📈' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 260,
          background: '#1a202c',
          color: 'white',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #2d3748' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🏥 Enfermería</h2>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#a0aec0' }}>
            Sistema de Control
          </p>
        </div>

        <nav style={{ flex: 1, padding: '10px 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: location.pathname === item.path ? '#2b6cb0' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #2d3748' }}>
          <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
            <strong>{user?.nombre} {user?.apellido}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 12 }}>
            {user?.role}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e53e3e',
              background: 'transparent',
              color: '#e53e3e',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: '#f7fafc', padding: 30, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
