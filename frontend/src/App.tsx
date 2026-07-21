import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppToaster } from './ui/Toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppShell } from './components/AppShell';
import { RequireRole } from './components/RequireRole';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import PacienteDetailPage from './pages/PacienteDetailPage';
import ControlesPage from './pages/ControlesPage';
import MedicamentosPage from './pages/MedicamentosPage';
import RecetasPage from './pages/RecetasPage';
import RemisionesPage from './pages/RemisionesPage';
import EnfermerasPage from './pages/EnfermerasPage';
import EstadisticasPage from './pages/EstadisticasPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pacientes" element={<PacientesPage />} />
        <Route path="pacientes/:id" element={<PacienteDetailPage />} />
        <Route path="controles" element={<ControlesPage />} />
        <Route path="medicamentos" element={<MedicamentosPage />} />
        <Route path="recetas" element={<RecetasPage />} />
        <Route path="remisiones" element={<RemisionesPage />} />
        <Route
          path="enfermeras"
          element={
            <RequireRole roles={['ADMINISTRADOR']}>
              <EnfermerasPage />
            </RequireRole>
          }
        />
        <Route path="estadisticas" element={<EstadisticasPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <AppToaster />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
