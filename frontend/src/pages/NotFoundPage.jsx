import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HumanNeedIcon } from '../assets/HumanNeedLogo';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
      <HumanNeedIcon className="w-16 h-16 mb-2" />
      <h1 className="text-4xl font-extrabold text-brand-navy">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-brand-muted max-w-md">
        The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary text-xs py-3 px-6 font-bold mt-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
