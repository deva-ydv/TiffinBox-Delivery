import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/toast';
import { Button, Card, Notice, PageHeader, TextArea, TextField } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');

  const save = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() }),
    onSuccess: (updated) => {
      if (user) setUser({ ...user, ...updated });
      toast('Profile saved.');
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  if (!user) return null;

  return (
    <>
      <PageHeader title="Profile" description="Your delivery address is used for every order." />
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          {save.isError && <Notice tone="error">{getErrorMessage(save.error)}</Notice>}
          <TextField label="Email" value={user.email} disabled readOnly hint="Email can't be changed." />
          <TextField label="Full name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextArea label="Delivery address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)}
            hint="Flat or building, street, area and landmark." />
          <Button type="submit" loading={save.isPending}>Save changes</Button>
        </form>
      </Card>
    </>
  );
}
