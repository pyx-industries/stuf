import type { File } from "@/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { FilesTable } from "./FilesTable";

const meta: Meta<typeof FilesTable> = {
  title: "Components/Table/FilesTable",
  component: FilesTable,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="bg-background">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    files: {
      control: "object",
      description: "Array of file objects to display in the table",
    },
    isLoading: {
      control: "boolean",
      description: "Whether the table is in a loading state",
    },
    currentPage: {
      control: "number",
      description: "Current page number (1-indexed)",
    },
    totalPages: {
      control: "number",
      description: "Total number of pages",
    },
    totalResults: {
      control: "number",
      description: "Total number of results across all pages",
    },
    pageSize: {
      control: "number",
      description: "Number of items per page",
    },
    onPageChange: {
      action: "page changed",
      description: "Callback when page changes",
    },
    onPageSizeChange: {
      action: "page size changed",
      description: "Callback when page size changes",
    },
    onDownload: {
      action: "download clicked",
      description: "Callback when download action is clicked",
    },
    onDelete: {
      action: "delete clicked",
      description: "Callback when delete action is clicked",
    },
    onViewHistory: {
      action: "view history clicked",
      description: "Callback when view history action is clicked",
    },
    onArchive: {
      action: "archive clicked",
      description: "Callback when archive action is clicked",
    },
    showCheckboxes: {
      control: "boolean",
      description: "Whether to show selection checkboxes",
    },
    selectedFiles: {
      control: "object",
      description: "Set of selected file IDs (for controlled mode)",
    },
    onSelectionChange: {
      action: "selection changed",
      description: "Callback when selection changes (for controlled mode)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilesTable>;

// Mock Auth Context Provider
function MockAuthProvider({
  children,
  username = "user1",
  collections = {},
}: {
  children: React.ReactNode;
  username?: string;
  collections?: Record<string, string[]>;
}) {
  const mockAuthContext = {
    user: {
      profile: {
        preferred_username: username,
        email: `${username}@example.com`,
        given_name: username.charAt(0).toUpperCase() + username.slice(1),
        family_name: "User",
        collections,
      },
      access_token: "mock-token",
      token_type: "Bearer",
      expires_at: Date.now() + 3600000,
    },
    isAuthenticated: true,
    isLoading: false,
    error: undefined,
    settings: {},
    signinRedirect: async () => {},
    signoutRedirect: async () => {},
    signinSilent: async () => {},
    removeUser: async () => {},
    clearStaleState: async () => {},
    querySessionStatus: async () => {},
    revokeTokens: async () => {},
    startSilentRenew: () => {},
    stopSilentRenew: () => {},
  };

  return (
    <AuthContext.Provider
      value={mockAuthContext as unknown as AuthContextProps}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Generate mock files
function generateMockFiles(count: number): File[] {
  const statuses = ["Completed", "Processing", "Failed", "In progress"];
  const users = [
    "john.doe@example.com",
    "jane.smith@example.com",
    "bob@example.com",
  ];

  return Array.from({ length: count }, (_, i) => ({
    object_name: `file-${i + 1}.txt`,
    collection: "test-collection",
    owner: users[i % users.length],
    original_filename: `document-${i + 1}.txt`,
    upload_time: new Date(Date.now() - i * 86400000).toISOString(),
    content_type: "text/plain",
    size: Math.floor(Math.random() * 10000000) + 1000000, // 1MB - 10MB
    metadata: { status: statuses[i % statuses.length] },
  }));
}

const mockFiles = generateMockFiles(10);

export const Default: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    return (
      <FilesTable
        files={mockFiles}
        currentPage={currentPage}
        totalPages={5}
        totalResults={50}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onDownload={(file) => console.log("Download", file)}
        onDelete={(file) => console.log("Delete", file)}
        onViewHistory={(file) => console.log("View History", file)}
        onArchive={(file) => console.log("Archive", file)}
      />
    );
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};

export const WithoutCheckboxes: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: mockFiles.slice(0, 5),
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalResults: 5,
    pageSize: 10,
    showCheckboxes: false,
    onPageChange: () => {},
    onPageSizeChange: () => {},
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};

export const WithSelection: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
      new Set(["file-1.txt", "file-3.txt"]),
    );

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Selected: {selectedFiles.size} file(s)
        </div>
        <FilesTable
          files={mockFiles.slice(0, 5)}
          currentPage={currentPage}
          totalPages={1}
          totalResults={5}
          pageSize={pageSize}
          selectedFiles={selectedFiles}
          onSelectionChange={setSelectedFiles}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onDownload={(file) => console.log("Download", file)}
          onDelete={(file) => console.log("Delete", file)}
          onViewHistory={(file) => console.log("View History", file)}
          onArchive={(file) => console.log("Archive", file)}
        />
      </div>
    );
  },
};

export const SinglePage: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: mockFiles.slice(0, 5),
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalResults: 5,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};
