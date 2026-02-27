import { Shield, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <Shield className="text-blue-600" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email Security Analyzer
        </h1>
        <p className="text-gray-500 mb-8">
          Analyze your Gmail inbox for phishing, malware, and other threats using AI-powered detection.
        </p>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Mail size={20} />
          Sign in with Google
        </button>

        <p className="text-xs text-gray-400 mt-4">
          We only request read-only access to your Gmail. Your emails are analyzed securely and never shared.
        </p>
      </div>
    </div>
  );
}
