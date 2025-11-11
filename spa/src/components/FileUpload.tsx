import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCollections } from "@/contexts/collections/CollectionsContext";
import { useFiles } from "@/contexts/files/FilesContext";
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";

interface FileUploadProps {
  collection?: string;
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  collection: propCollection,
  onUploadSuccess,
}) => {
  const auth = useAuth();
  const { uploadFile } = useFiles();
  const { collections } = useCollections();
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState(propCollection || "");
  const [metadata, setMetadata] = useState("");
  const [uploading, setUploading] = useState(false);

  const showCollectionInput = !propCollection;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Store form reference before async operations
    const form = e.currentTarget;

    if (!file) {
      alert("Please select a file");
      return;
    }

    if (!collection) {
      alert("Please select a collection");
      return;
    }

    setUploading(true);

    try {
      let metadataObj = {};
      if (metadata.trim()) {
        metadataObj = JSON.parse(metadata);
      }

      await uploadFile(file, collection, metadataObj);

      setFile(null);
      setMetadata("");
      form.reset();

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      // Error is already handled by the context with toast
      console.error("Upload failed:", error);
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
            <Input type="file" onChange={handleFileChange} required />
          </div>

          {showCollectionInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                required
              >
                <option value="">Select a collection</option>
                {collections.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
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
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
