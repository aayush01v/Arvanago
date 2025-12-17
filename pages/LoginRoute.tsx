import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoginPage from '@/components/LoginPage.tsx';
import { User } from '@/types';

interface LoginRouteProps {
  user: User | null;
  authError?: string | null;
}

const LoginRoute: React.FC<LoginRouteProps> = ({ user, authError }) => {
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {authError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
          <p className="font-bold">Login Error: {authError}</p>
        </div>
      )}
      <LoginPage onNavigateHome={() => navigate('/')} />
    </>
  );
};

export default LoginRoute;
