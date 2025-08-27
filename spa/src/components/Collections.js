import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import FileUpload from './FileUpload';

const Collections = () => {
  const auth = useAuth();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [userCollections, setUserCollections] = useState([]);

  useEffect(() => {
    if (auth.user) {
      // Try to get roles from multiple possible locations
      let roles = [];
      
      console.log('Full auth.user object:', auth.user);
      
      // First try the access token (decoded)
      if (auth.user.access_token) {
        try {
          const payload = JSON.parse(atob(auth.user.access_token.split('.')[1]));
          console.log('Decoded access token payload:', payload);
          roles = payload.realm_access?.roles || [];
          console.log('Roles from access token:', roles);
        } catch (e) {
          console.warn('Could not decode access token:', e);
        }
      }
      
      // Also try the ID token (profile)
      if (auth.user.profile) {
        console.log('Profile object:', auth.user.profile);
        if (auth.user.profile.realm_access?.roles) {
          console.log('Roles from profile:', auth.user.profile.realm_access.roles);
          // Merge roles from profile if they exist
          const profileRoles = auth.user.profile.realm_access.roles;
          roles = [...new Set([...roles, ...profileRoles])]; // Remove duplicates
        }
      }
      
      // Also check if roles are directly in the profile
      if (auth.user.profile?.roles) {
        console.log('Direct roles in profile:', auth.user.profile.roles);
        roles = [...new Set([...roles, ...auth.user.profile.roles])];
      }
      
      console.log('All user roles found:', roles);
      
      const collections = roles
        .filter(role => role.startsWith('collection-'))
        .map(role => role.replace('collection-', ''));
      
      console.log('Collections extracted:', collections);
      setUserCollections(collections);
    }
  }, [auth.user]);

  if (selectedCollection) {
    return (
      <div>
        <button 
          onClick={() => setSelectedCollection(null)}
          style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
        >
          ← Back to Collections
        </button>
        <h3>Upload to Collection: {selectedCollection}</h3>
        <FileUpload collection={selectedCollection} />
      </div>
    );
  }

  return (
    <div>
      <h2>Your Collections</h2>
      <p>Select a collection to upload files:</p>
      
      {userCollections.length === 0 ? (
        <p>You don't have access to any collections.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {userCollections.map(collection => (
            <button
              key={collection}
              onClick={() => setSelectedCollection(collection)}
              style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem'
              }}
            >
              <strong>Collection: {collection}</strong>
              <br />
              <small>Click to upload files to this collection</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
