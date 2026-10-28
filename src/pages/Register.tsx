import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Notice, TextArea, TextField } from '../components/ui';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { homeFor } from '../lib/format';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFields({});
    setSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        // Optional fields are omitted when empty so the API's validation accepts them.
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.address.trim() && { address: form.address.trim() }),
      });
      navigate(from ?? homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setFields(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted">It takes a minute. You can change these details later.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <TextField label="Full name" autoComplete="name" required value={form.name} onChange={set('name')} error={fields.name} />
          <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={fields.email} />
          <TextField label="Password" type="password" autoComplete="new-password" required value={form.password}
            onChange={set('password')} error={fields.password} hint="At least 4 characters." />
          <TextField label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={fields.phone} />
          <TextArea label="Delivery address (optional)" autoComplete="street-address" value={form.address} onChange={set('address')}
            error={fields.address} hint="Needed before you can subscribe. You can add it later in your profile." />
          <Button type="submit" loading={submitting} className="w-full">Create account</Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account? <Link to="/login" state={{ from }} className="font-medium text-brand hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
