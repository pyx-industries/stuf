import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileUploadProps {
  collection?: string;
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ collection: propCollection, onUploadSuccess }) => {
  const auth = useAuth();
  const apiService = useApi();
  const [file, setFile] = useState(null);
  const [collection, setCollection] = useState(propCollection || 'test');
  const [metadata, setMetadata] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // If collection is provided as prop, don't show the collection input
  const showCollectionInput = !propCollection;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (onUploadSuccess) {
        onUploadSuccess();
      }
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
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <Input
              type="file"
              onChange={handleFileChange}
              required
            />
          </div>

          {showCollectionInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection</label>
              <Input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Metadata (JSON)</label>
            <Textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"description": "My file", "category": "documents"}'
              rows={3}
            />
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-md border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {result.success ? (
              <div>
                <div className="font-medium">Upload successful!</div>
                <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            ) : (
              <div>
                <span className="font-medium">Upload failed:</span> {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
