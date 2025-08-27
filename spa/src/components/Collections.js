import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import FileUpload from './FileUpload';

const Collections = () => {
  const auth = useAuth();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [userCollections, setUserCollections] = useState([]);

  useEffect(() => {
    if (auth.user?.profile) {
      // Extract collection roles from the user's roles
      const roles = auth.user.profile.realm_access?.roles || [];
      const collections = roles
        .filter(role => role.startsWith('collection-'))
        .map(role => role.replace('collection-', ''));
      
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
