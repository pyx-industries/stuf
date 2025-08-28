import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import FileUpload from './FileUpload';
import { useApi } from '../hooks/useApi';

const Collections = () => {
  const auth = useAuth();
  const api = useApi();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [userCollections, setUserCollections] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Effects ---

  useEffect(() => {
    if (auth.user?.access_token) {
      try {
        const payload = JSON.parse(atob(auth.user.access_token.split('.')[1]));
        const collectionsClaim = payload.collections || {};
        
        const collections = Object.entries(collectionsClaim).map(([name, permissions]) => ({
          name,
          permissions,
        }));
        
        setUserCollections(collections);
      } catch (e) {
        console.error('Failed to parse collections from access token:', e);
        setError('Could not determine your collection permissions.');
      } finally {
        setLoading(false);
      }
    } else if (auth.user) {
      // User is loaded but no access token, probably means no collections
      setLoading(false);
    }
  }, [auth.user]);

  const fetchFiles = useCallback(async () => {
    if (!selectedCollection || !selectedCollection.permissions.includes('read')) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.listFiles(selectedCollection.name);
      setFiles(response.files || []);
    } catch (err) {
      console.error('Failed to list files:', err);
      setError(`Failed to load files from collection: ${selectedCollection.name}.`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [api, selectedCollection]);

  useEffect(() => {
    if (selectedCollection) {
      fetchFiles();
    }
  }, [selectedCollection, fetchFiles]);
  
  // --- Handlers ---

  const handleDownload = async (objectName) => {
    setError(null);
    try {
      const relativeObjectName = objectName.startsWith(`${selectedCollection.name}/`)
        ? objectName.substring(selectedCollection.name.length + 1)
        : objectName;
        
      const response = await api.downloadFile(selectedCollection.name, relativeObjectName);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = objectName.split('/').pop();
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('File download failed. You may not have permission.');
    }
  };

  const handleDelete = async (objectName) => {
    if (window.confirm(`Are you sure you want to delete ${objectName}? This action cannot be undone.`)) {
      setError(null);
      try {
        const relativeObjectName = objectName.startsWith(`${selectedCollection.name}/`)
        ? objectName.substring(selectedCollection.name.length + 1)
        : objectName;

        await api.deleteFile(selectedCollection.name, relativeObjectName);
        fetchFiles(); // Refresh file list
      } catch (err) {
        console.error('Delete failed:', err);
        setError(`Failed to delete file. You may not have permission. Error: ${err.message}`);
      }
    }
  };

  // --- Render Logic ---

  if (loading && !selectedCollection) {
    return <p>Loading collections...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }
  
  if (selectedCollection) {
    const canRead = selectedCollection.permissions.includes('read');
    const canWrite = selectedCollection.permissions.includes('write');
    const canDelete = selectedCollection.permissions.includes('delete');
    
    return (
      <div>
        <button 
          onClick={() => setSelectedCollection(null)}
          style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
        >
          ← Back to Collections
        </button>
        
        <h2>Collection: {selectedCollection.name}</h2>
        
        {canWrite && <FileUpload collection={selectedCollection.name} onUploadSuccess={fetchFiles} />}
        
        {canRead ? (
          <div>
            <h3>Files in collection</h3>
            {loading && <p>Loading files...</p>}
            {files.length === 0 && !loading && <p>No files in this collection.</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map(file => (
                <li key={file.name} style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{file.name.split('/').pop()}</strong><br/>
                    <small>Size: {(file.size / 1024).toFixed(2)} KB | Last Modified: {new Date(file.last_modified).toLocaleString()}</small>
                  </div>
                  <div>
                    <button onClick={() => handleDownload(file.name)} style={{ marginRight: '0.5rem' }}>Download</button>
                    {canDelete && (
                      <button onClick={() => handleDelete(file.name)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}>Delete</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>You do not have permission to read files in this collection.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Your Collections</h2>
      
      {userCollections.length === 0 ? (
        <p>You don't have access to any collections.</p>
      ) : (
        <>
          <p>Select a collection to view files or upload:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {userCollections.map(collection => (
              <button
                key={collection.name}
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
                <strong>Collection: {collection.name}</strong>
                <br />
                <small>Permissions: {collection.permissions.join(', ')}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Collections;
