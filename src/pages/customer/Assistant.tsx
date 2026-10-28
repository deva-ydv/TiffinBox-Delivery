import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import { PlanCard } from '../../components/PlanCard';
import { Button, Card, FilterTabs, Notice, PageHeader, SelectField, Spinner, TextField, buttonClass } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import type { ChatTurn } from '../../lib/types';

type Tab = 'chat' | 'plan';
interface Message { role: 'user' | 'model'; text: string }

const STARTERS = ["Where's my order today?", 'Which plans are available?', 'What subscriptions do I have?'];

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatTurn[] }) => aiApi.chat(message, history),
    onSuccess: ({ reply }) => setMessages((prev) => [...prev, { role: 'model', text: reply }]),
  });

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages, send.isPending]);

  const submit = (text: string) => {
    const message = text.trim();
    if (!message || send.isPending) return;
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setDraft('');
    send.mutate({ message, history });
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit(draft); };

  return (
    <Card className="flex h-[32rem] flex-col p-0">
      <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <p className="font-medium">Ask about your orders, subscriptions or plans</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => submit(s)}
                  className="rounded-full border border-line px-3.5 py-2 text-sm hover:bg-paper">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user' ? 'bg-brand text-white' : 'bg-paper text-ink'
            }`}>{m.text}</p>
          </div>
        ))}
        {send.isPending && <div className="flex items-center gap-2 text-sm text-muted"><Spinner className="size-4" /> Thinking</div>}
        {send.isError && <Notice tone="error">{getErrorMessage(send.error)}</Notice>}
        <div ref={bottom} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
        <input aria-label="Your message" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your question"
          className="h-11 flex-1 rounded-lg border border-line bg-surface px-3 text-sm" />
        <Button type="submit" disabled={!draft.trim() || send.isPending}>Send</Button>
      </form>
    </Card>
  );
}

const PREFERENCES = ['Vegetarian', 'Non-vegetarian', 'Low calorie / diet', 'No preference'];

function PlanFinder() {
  const [preference, setPreference] = useState(PREFERENCES[0]);
  const [budget, setBudget] = useState('100');
  const [daysPerWeek, setDaysPerWeek] = useState('5');

  const suggest = useMutation({
    mutationFn: () => aiApi.suggestPlan({ preference, budget: Number(budget), daysPerWeek: Number(daysPerWeek) }),
  });

  const onSubmit = (e: FormEvent) => { e.preventDefault(); suggest.mutate(); };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-fit">
        <form onSubmit={onSubmit} className="space-y-4">
          <SelectField label="Diet" value={preference} onChange={(e) => setPreference(e.target.value)}>
            {PREFERENCES.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          <TextField label="Budget per day (₹)" type="number" min={1} required value={budget} onChange={(e) => setBudget(e.target.value)} />
          <SelectField label="Days per week" value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
          <Button type="submit" loading={suggest.isPending} disabled={!Number(budget)}>Find my plan</Button>
        </form>
      </Card>

      <div>
        {suggest.isError && <Notice tone="error">{getErrorMessage(suggest.error)}</Notice>}
        {suggest.data && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{suggest.data.explanation}</p>
            <PlanCard plan={suggest.data.mealPlan}>
              <Link to={`/app/subscribe/${suggest.data.mealPlan.id}`} className={buttonClass('primary', 'sm', 'w-full')}>Subscribe to this plan</Link>
            </PlanCard>
          </div>
        )}
        {!suggest.data && !suggest.isError && (
          <p className="text-sm text-muted">Tell us what you like and your budget, and we'll suggest the best-fitting plan.</p>
        )}
      </div>
    </div>
  );
}

export default function Assistant() {
  const [tab, setTab] = useState<Tab>('chat');
  return (
    <>
      <PageHeader title="Assistant" description="Get quick answers, or let us find the right plan for you." />
      <FilterTabs label="Assistant mode" value={tab} onChange={setTab}
        options={[{ value: 'chat', label: 'Ask support' }, { value: 'plan', label: 'Find a plan' }]} />
      <div className="mt-4">{tab === 'chat' ? <Chat /> : <PlanFinder />}</div>
    </>
  );
}
