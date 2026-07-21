import { Stethoscope } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';

const LoginPage: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usuario, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <CardBody className="p-8">
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-sm bg-accent text-white">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-text">Vitalis</h1>
              <p className="mt-1 text-sm text-muted">Sistema de control de enfermería ocupacional</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-sm border border-crit-soft bg-crit-soft px-3 py-2.5 text-center text-sm text-crit">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" variant="primary" disabled={loading} className="mt-2 justify-center">
              {loading ? 'Ingresando' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
