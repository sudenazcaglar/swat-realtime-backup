import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Construction className="w-16 h-16 text-gray-500 mx-auto" />
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="text-gray-400 max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
};