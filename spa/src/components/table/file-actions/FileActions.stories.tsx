import type { File } from "@/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { FileActions } from "./FileActions";

// Mock Auth Context Provider
function MockAuthProvider({
  children,
  username = "john.doe@example.com",
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
        email: username,
        given_name: "John",
        family_name: "Doe",
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

// Helper to create a mock file
const createMockFile = (overrides?: Partial<File>): File => ({
  object_name: "example-document.pdf",
  collection: "test-collection",
  owner: "john.doe@example.com",
  original_filename: "Example Document.pdf",
  upload_time: "2024-01-15T10:30:00Z",
  content_type: "application/pdf",
  size: 2048576, // 2MB
  ...overrides,
});

const meta: Meta<typeof FileActions> = {
  title: "Components/Table/FileActions",
  component: FileActions,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dropdown menu component for file actions. Displays different action options based on user permissions.",
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-8">
          <div className="flex justify-center items-center">
            <Story />
          </div>
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  args: {
    file: createMockFile(),
  },
  argTypes: {
    file: {
      description: "The file object containing metadata",
      control: "object",
    },
    onDownload: {
      description: "Callback fired when Download is clicked",
      action: "download",
    },
    onDelete: {
      description: "Callback fired when Delete is clicked",
      action: "delete",
    },
    onViewHistory: {
      description: "Optional callback fired when View History is clicked",
      action: "viewHistory",
    },
    onArchive: {
      description: "Optional callback fired when Archive is clicked",
      action: "archive",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Full permissions - all actions available
export const FullPermissions: Story = {
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
    onDownload: (file) =>
      console.log("Download clicked:", file.original_filename),
    onDelete: (file) => console.log("Delete clicked:", file.original_filename),
    onViewHistory: (file) =>
      console.log("View History clicked:", file.original_filename),
    onArchive: (file) =>
      console.log("Archive clicked:", file.original_filename),
  },
  parameters: {
    docs: {
      description: {
        story:
          "User has full permissions (canDelete). Shows Download, View History, Archive, and Delete options.",
      },
    },
  },
};

// Download only permissions
export const DownloadOnly: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider
        username="john.doe@example.com"
        collections={{
          "test-collection": ["read"],
        }}
      >
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    onDownload: (file) =>
      console.log("Download clicked:", file.original_filename),
    onDelete: (file) => console.log("Delete clicked:", file.original_filename),
    onViewHistory: (file) =>
      console.log("View History clicked:", file.original_filename),
    onArchive: (file) =>
      console.log("Archive clicked:", file.original_filename),
  },
  parameters: {
    docs: {
      description: {
        story:
          "User has download-only permissions (read permission). Shows only Download option.",
      },
    },
  },
};

// No permissions
export const NoPermissions: Story = {
  decorators: [
    (Story) => (
      <MockAuthProvider username="john.doe@example.com" collections={{}}>
        <Story />
      </MockAuthProvider>
    ),
  ],
  args: {
    onDownload: (file) =>
      console.log("Download clicked:", file.original_filename),
    onDelete: (file) => console.log("Delete clicked:", file.original_filename),
    onViewHistory: (file) =>
      console.log("View History clicked:", file.original_filename),
    onArchive: (file) =>
      console.log("Archive clicked:", file.original_filename),
  },
  parameters: {
    docs: {
      description: {
        story:
          'User has no permissions. Shows disabled "No actions available" option.',
      },
    },
  },
};
