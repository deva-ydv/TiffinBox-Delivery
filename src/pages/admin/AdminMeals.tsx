import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealsApi, type MealInput } from '../../api';
import { useToast } from '../../components/toast';
import { TierMark } from '../../components/TiffinStack';
import { Button, EmptyState, ErrorState, LoadingBlock, Modal, Notice, PageHeader, TextArea, TextField } from '../../components/ui';
import { getErrorMessage, getFieldErrors } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import type { MealPlan } from '../../lib/types';

function MealForm({ meal, onDone, onCancel }: { meal: MealPlan | null; onDone: () => void; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(meal?.name ?? '');
  const [description, setDescription] = useState(meal?.description ?? '');
  const [price, setPrice] = useState(meal ? String(meal.pricePerDay) : '');
  const [imageUrl, setImageUrl] = useState(meal?.imageUrl ?? '');
  const [local, setLocal] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (body: MealInput) => (meal ? mealsApi.update(meal.id, body) : mealsApi.create(body)),
    onSuccess: () => {
      toast(meal ? 'Meal plan updated.' : 'Meal plan created.');
      void queryClient.invalidateQueries({ queryKey: ['meals'] });
      onDone();
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
    if (!(Number(price) > 0)) errors.pricePerDay = 'Enter a price greater than 0.';
    setLocal(errors);
    if (Object.keys(errors).length) return;

    save.mutate({
      name: name.trim(),
      description: description.trim(),
      pricePerDay: Number(price),
      ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }),
    });
  };

  const server = getFieldErrors(save.error);
  const err = (key: string) => local[key] ?? server[key];

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {save.isError && Object.keys(server).length === 0 && <Notice tone="error">{getErrorMessage(save.error)}</Notice>}
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={err('name')} />
      <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={err('description')}
        hint="What's in the tiffin. At least 10 characters." />
      <TextField label="Price per day (₹)" type="number" min={1} step="any" value={price} onChange={(e) => setPrice(e.target.value)} error={err('pricePerDay')} />
      <TextField label="Image URL (optional)" type="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} error={err('imageUrl')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={save.isPending}>{meal ? 'Save changes' : 'Create plan'}</Button>
      </div>
    </form>
  );
}

export default function AdminMeals() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const meals = useQuery({ queryKey: ['meals'], queryFn: mealsApi.list });
  const [editing, setEditing] = useState<MealPlan | 'new' | null>(null);
  const [removing, setRemoving] = useState<MealPlan | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => mealsApi.remove(id),
    onSuccess: () => {
      toast('Meal plan removed.');
      setRemoving(null);
      void queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
    onError: (err) => { toast(getErrorMessage(err), 'error'); setRemoving(null); },
  });

  return (
    <>
      <PageHeader title="Meal plans" description="Plans customers can subscribe to."
        action={<Button size="sm" onClick={() => setEditing('new')}>New plan</Button>} />

      {meals.isLoading && <LoadingBlock />}
      {meals.isError && <ErrorState message={getErrorMessage(meals.error)} onRetry={() => void meals.refetch()} />}
      {meals.data?.length === 0 && (
        <EmptyState title="No meal plans yet" description="Create your first plan so customers can subscribe."
          action={<Button size="sm" onClick={() => setEditing('new')}>New plan</Button>} />
      )}

      {meals.data && meals.data.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {meals.data.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              {m.imageUrl
                ? <img src={m.imageUrl} alt="" className="size-14 rounded-lg object-cover" />
                : <span className="grid size-14 place-items-center rounded-lg bg-brand-soft text-brand"><TierMark className="size-9" /></span>}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.name}</p>
                <p className="line-clamp-2 text-sm text-muted">{m.description}</p>
              </div>
              <p className="text-sm font-medium">{formatPrice(m.pricePerDay)}<span className="font-normal text-muted"> / day</span></p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-chilli hover:bg-chilli-soft" onClick={() => setRemoving(m)}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New meal plan' : 'Edit meal plan'}>
        <MealForm meal={editing === 'new' ? null : editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
      </Modal>

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Remove this meal plan?">
        <p className="text-sm text-muted">
          {removing?.name} will no longer be offered to new customers. Existing subscriptions keep working.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>Keep it</Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => removing && remove.mutate(removing.id)}>Remove plan</Button>
        </div>
      </Modal>
    </>
  );
}
