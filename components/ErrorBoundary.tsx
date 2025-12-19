import React from 'react';

// Neutralized component as requested to prevent logic errors while maintaining import compatibility
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};