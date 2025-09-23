import React from 'react';
import { useAuth } from 'react-oidc-context';
import AuthButton from './components/AuthButton';
import ProtectedRoute from './components/ProtectedRoute';
import Collections from './components/Collections';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from '@/components/ui/button';

function App() {
  const auth = useAuth();


  if (auth.isLoading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">STUF - Secure Transfer Upload Facility</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error if auth failed
  if (auth.error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">STUF - Secure Transfer Upload Facility</h1>
        <p className="text-destructive mb-4">Authentication error: {auth.error.message}</p>
        <Button onClick={() => auth.signinRedirect()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="border-b pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">STUF - Secure Transfer Upload Facility</h1>
          <p className="text-muted-foreground">A secure platform for file uploads and transfers.</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>

      <main>
        <ProtectedRoute>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">File Management</h2>
              <p className="text-muted-foreground">You are successfully authenticated and can now upload files.</p>
            </div>
            <Collections />
          </div>
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default App;
