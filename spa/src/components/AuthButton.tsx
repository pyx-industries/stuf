import React from 'react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';

const AuthButton: React.FC = () => {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          Welcome, {auth.user?.profile?.name || auth.user?.profile?.preferred_username}!
        </span>
        <Button variant="outline" onClick={() => auth.signoutRedirect()}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => auth.signinRedirect()}>
      Login
    </Button>
  );
};

export default AuthButton;
