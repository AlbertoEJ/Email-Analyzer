import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEmail } from '../hooks/useEmails';
import { EmailDetailView } from '../components/emails/EmailDetail';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: email, isLoading, error } = useEmail(id || '');

  if (isLoading) return <LoadingSpinner />;

  if (error || !email) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Email not found.</p>
        <button
          onClick={() => navigate('/emails')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to emails
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/emails')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to emails
      </button>

      <EmailDetailView email={email} />
    </div>
  );
}
