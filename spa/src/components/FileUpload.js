import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';

const FileUpload = ({ collection: propCollection }) => {
  const auth = useAuth();
  const apiService = useApi();
  const [file, setFile] = useState(null);
  const [collection, setCollection] = useState(propCollection || 'test');
  const [metadata, setMetadata] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // If collection is provided as prop, don't show the collection input
  const showCollectionInput = !propCollection;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      let metadataObj = {};
      if (metadata.trim()) {
        metadataObj = JSON.parse(metadata);
      }

      const response = await apiService.uploadFile(file, collection, metadataObj);
      setResult({ success: true, data: response });
      setFile(null);
      setMetadata('');
      // Reset file input
      e.target.reset();
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', margin: '1rem 0' }}>
      <h3>Upload File</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            File:
            <input
              type="file"
              onChange={handleFileChange}
              style={{ marginLeft: '0.5rem' }}
              required
            />
          </label>
        </div>
        
        {showCollectionInput && (
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Collection:
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
                required
              />
            </label>
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Metadata (JSON):
            <textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"description": "My file", "category": "documents"}'
              style={{ marginLeft: '0.5rem', padding: '0.25rem', width: '300px', height: '60px' }}
            />
          </label>
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: uploading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      
      {result && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          {result.success ? (
            <div>
              <strong>Upload successful!</strong>
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          ) : (
            <div>
              <strong>Upload failed:</strong> {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
