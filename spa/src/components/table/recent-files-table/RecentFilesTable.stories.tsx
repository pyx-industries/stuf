import type { File } from "@/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { RecentFilesTable } from "./RecentFilesTable";

const meta: Meta<typeof RecentFilesTable> = {
  title: "Components/Table/RecentFilesTable",
  component: RecentFilesTable,
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
    loading: {
      control: "boolean",
      description: "Whether the table is in a loading state",
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
      description: "Optional callback when view history action is clicked",
    },
    onArchive: {
      action: "archive clicked",
      description: "Optional callback when archive action is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecentFilesTable>;

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

const mockFiles: File[] = [
  {
    object_name: "collection-a/user1/annual-report.pdf",
    collection: "collection-a",
    owner: "Cindy Reardon",
    original_filename: "Annual reporting of the lorem ipsum dolar sit amet",
    upload_time: "2025-01-23T20:58:00Z",
    content_type: "application/pdf",
    size: 24 * 1024 * 1024,
    metadata: { status: "In progress" },
  },
  {
    object_name: "collection-b/user2/changelog.pdf",
    collection: "collection-b",
    owner: "Melville Frohicky",
    original_filename: "Change log of the lorem ipsum dolar sit amet",
    upload_time: "2025-02-08T09:01:00Z",
    content_type: "application/pdf",
    size: 24 * 1024 * 1024,
    metadata: { status: "In progress" },
  },
  {
    object_name: "collection-c/user3/board-meeting.pdf",
    collection: "collection-c",
    owner: "e.tombs@longeremailaddress",
    original_filename: "Board Meeting Q3 2025",
    upload_time: "2025-03-11T12:15:00Z",
    content_type: "application/pdf",
    size: 38 * 1024 * 1024,
    metadata: { status: "Review" },
  },
  {
    object_name: "collection-a/user4/report.pdf",
    collection: "collection-a",
    owner: "Cassandra Spender",
    original_filename: "Mandatory reporting Q1 2024 to Q4 2025",
    upload_time: "2025-05-10T12:28:00Z",
    content_type: "application/pdf",
    size: 1.4 * 1024 * 1024,
    metadata: { status: "Done" },
  },
];

export const Default: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="Cindy Reardon"
        collections={{
          "collection-a": ["read", "write", "delete"],
          "collection-b": ["read", "write", "delete"],
          "collection-c": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: mockFiles,
    loading: false,
    onDownload: (file) => console.log("Download:", file.original_filename),
    onDelete: (file) => console.log("Delete:", file.original_filename),
    onViewHistory: (file) =>
      console.log("View history:", file.original_filename),
    onArchive: (file) => console.log("Archive:", file.original_filename),
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: [],
    loading: true,
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: [],
    loading: false,
    onDownload: () => {},
    onDelete: () => {},
    onViewHistory: () => {},
    onArchive: () => {},
  },
};

export const SingleFile: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="Cindy Reardon"
        collections={{
          "collection-a": ["read", "write", "delete"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    files: [mockFiles[0]],
    loading: false,
    onDownload: (file) => console.log("Download:", file.original_filename),
    onDelete: (file) => console.log("Delete:", file.original_filename),
    onViewHistory: (file) =>
      console.log("View history:", file.original_filename),
    onArchive: (file) => console.log("Archive:", file.original_filename),
  },
};
