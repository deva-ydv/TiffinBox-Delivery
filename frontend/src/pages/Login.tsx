import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Notice, TextField } from '../components/ui';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { homeFor } from '../lib/format';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFields({});
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      navigate(from ?? homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setFields(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back. Your next tiffin is waiting.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <TextField label="Email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} error={fields.email} />
          <TextField label="Password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} error={fields.password} />
          <Button type="submit" loading={submitting} className="w-full">Sign in</Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-muted">
        New here? <Link to="/register" state={{ from }} className="font-medium text-brand hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
