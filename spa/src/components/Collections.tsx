import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import FileUpload from "./FileUpload";
import { useApi } from "../hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TODO: Cleanup any type assertions

// TODO: Cleanup any type assertions

const Collections = () => {
  const auth = useAuth();
  const api = useApi();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [userCollections, setUserCollections] = useState<any>([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---

  useEffect(() => {
    if (auth.user?.access_token) {
      try {
        const payload = JSON.parse(atob(auth.user.access_token.split(".")[1]));
        const collectionsClaim = payload.collections || {};

        const collections = Object.entries(collectionsClaim).map(
          ([name, permissions]) => ({
            name,
            permissions,
          }),
        );

        setUserCollections(collections);
      } catch (e) {
        console.error("Failed to parse collections from access token:", e);
        setError("Could not determine your collection permissions.");
      } finally {
        setLoading(false);
      }
    } else if (auth.user) {
      // User is loaded but no access token, probably means no collections
      setLoading(false);
    }
  }, [auth.user]);

  const fetchFiles = useCallback(async () => {
    if (
      !selectedCollection ||
      !selectedCollection.permissions.includes("read")
    ) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.listFiles(selectedCollection.name);
      setFiles(response.files || []);
    } catch (err) {
      console.error("Failed to list files:", err);
      setError(
        `Failed to load files from collection: ${selectedCollection.name}.`,
      );
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

  // --- Helper Functions ---

  const formatUploadDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    try {
      // Handle ISO strings with microseconds by truncating to milliseconds
      let cleanedDateString = dateString;
      if (
        dateString.includes(".") &&
        (dateString.includes("+") || dateString.includes("Z"))
      ) {
        // Split on the decimal point
        const parts = dateString.split(".");
        const beforeDot = parts[0];
        const afterDot = parts[1];

        // Extract milliseconds (first 3 digits) and timezone
        const milliseconds = afterDot.substring(0, 3);
        const timezoneMatch = afterDot.match(/([+-]\d{2}:\d{2}|Z)$/);
        const timezone = timezoneMatch ? timezoneMatch[1] : "+00:00";

        cleanedDateString = `${beforeDot}.${milliseconds}${timezone}`;
      }
      const date = new Date(cleanedDateString);
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  // --- Handlers ---

  const handleDownload = async (objectName: string) => {
    setError(null);
    try {
      const relativeObjectName = objectName.startsWith(
        `${selectedCollection.name}/`,
      )
        ? objectName.substring(selectedCollection.name.length + 1)
        : objectName;

      const response = await api.downloadFile(
        selectedCollection.name,
        relativeObjectName,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = objectName.split("/").pop() ?? "download";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("File download failed. You may not have permission.");
    }
  };

  const handleDelete = async (objectName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${objectName}? This action cannot be undone.`,
      )
    ) {
      setError(null);
      try {
        const relativeObjectName = objectName.startsWith(
          `${selectedCollection.name}/`,
        )
          ? objectName.substring(selectedCollection.name.length + 1)
          : objectName;

        await api.deleteFile(selectedCollection.name, relativeObjectName);
        fetchFiles(); // Refresh file list
      } catch (err: any) {
        console.error("Delete failed:", err);
        setError(
          `Failed to delete file. You may not have permission. Error: ${err.message}`,
        );
      }
    }
  };

  // --- Render Logic ---

  if (loading && !selectedCollection) {
    return <p>Loading collections...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (selectedCollection) {
    const canRead = selectedCollection.permissions.includes("read");
    const canWrite = selectedCollection.permissions.includes("write");
    const canDelete = selectedCollection.permissions.includes("delete");

    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedCollection(null)}>
          ← Back to Collections
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Collection: {selectedCollection.name}</CardTitle>
            <CardDescription>
              Permissions: {selectedCollection.permissions.join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canWrite && (
              <FileUpload
                collection={selectedCollection.name}
                onUploadSuccess={fetchFiles}
              />
            )}

            {canRead ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Files in collection</h3>
                {loading && (
                  <p className="text-muted-foreground">Loading files...</p>
                )}
                {files.length === 0 && !loading && (
                  <p className="text-muted-foreground">
                    No files in this collection.
                  </p>
                )}
                <div className="space-y-2">
                  {(files as any[]).map((file, index) => (
                    <Card key={file.object_name || `file-${index}`}>
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <div className="font-medium">
                            {file.original_filename || "Unknown file"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Size: {(file.size / 1024).toFixed(2)} KB | Uploaded:{" "}
                            {formatUploadDate(file.metadata?.last_modified)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(file.object_name)}
                            disabled={!file.object_name}
                          >
                            Download
                          </Button>
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(file.object_name)}
                              disabled={!file.object_name}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                You do not have permission to read files in this collection.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Collections</h2>
        <p className="text-muted-foreground">
          Select a collection to view files or upload.
        </p>
      </div>

      {userCollections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              You don&apos;t have access to any collections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(userCollections as any[]).map((collection) => (
            <Card
              key={collection.name}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedCollection(collection)}
            >
              <CardContent className="p-6">
                <div>
                  <div className="font-semibold">
                    Collection: {collection.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Permissions: {collection.permissions.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
