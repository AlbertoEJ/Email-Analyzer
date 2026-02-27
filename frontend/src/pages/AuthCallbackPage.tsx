import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { setUserId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setUserId(userId);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, setUserId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
}
