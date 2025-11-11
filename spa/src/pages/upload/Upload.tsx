import FileUpload from "@/components/FileUpload";

export function Upload() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Upload Files</h1>
      <FileUpload />
    </div>
  );
}
