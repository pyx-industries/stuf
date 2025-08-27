import React from 'react';
import { useAuth } from 'react-oidc-context';
import AuthButton from './components/AuthButton';
import ProtectedRoute from './components/ProtectedRoute';
import FileUpload from './components/FileUpload';

function App() {
  const auth = useAuth();

  // Show loading while auth is initializing
  if (auth.isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>STUF - Secure Transfer Upload Facility</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Show error if auth failed
  if (auth.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>STUF - Secure Transfer Upload Facility</h1>
        <p>Authentication error: {auth.error.message}</p>
        <button onClick={() => auth.signinRedirect()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        borderBottom: '1px solid #ddd', 
        paddingBottom: '1rem', 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1>STUF - Secure Transfer Upload Facility</h1>
          <p>A secure platform for file uploads and transfers.</p>
        </div>
        <AuthButton />
      </header>
      
      <main>
        <ProtectedRoute>
          <div>
            <h2>File Management</h2>
            <p>You are successfully authenticated and can now upload files.</p>
            <FileUpload />
          </div>
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default App;
