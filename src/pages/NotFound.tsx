import { Link } from 'react-router-dom';
import { buttonClass } from '../components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className={`${buttonClass('primary')} mt-6`}>Back to home</Link>
    </div>
  );
}
