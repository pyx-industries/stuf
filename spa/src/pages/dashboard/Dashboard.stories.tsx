import { CollectionsProvider } from "@/contexts/collections/CollectionsContext";
import { FilesProvider } from "@/contexts/files/FilesContext";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import React from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";

const meta: Meta<typeof Dashboard> = {
  title: "Pages/Dashboard",
  component: Dashboard,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=9-2279&t=X1ojbU0VMwecFl97-4",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

// Mock user data - Admin
const mockAdminUser = {
  id: "admin-id",
  username: "admin",
  email: "admin@example.com",
  name: "Admin User",
  collections: {
    test: ["read", "write", "delete"],
    restricted: ["read", "write", "delete"],
    shared: ["read", "write", "delete"],
  },
  realm_access: {
    roles: ["admin"],
  },
};

// Mock user data - Trust Architect
const mockTAUser = {
  id: "ta-id",
  username: "trust-architect",
  email: "ta@example.com",
  name: "Trust Architect",
  collections: {
    test: ["read", "write", "delete"],
    restricted: ["read", "write", "delete"],
    shared: ["read", "write", "delete"],
  },
  realm_access: {
    roles: ["trust-architect"],
  },
};

// Mock user data - Participant
const mockParticipantUser = {
  id: "participant-id",
  username: "participant",
  email: "participant@example.com",
  name: "Project Participant",
  collections: {
    test: ["read", "write"],
    shared: ["read", "write"],
  },
  realm_access: {
    roles: ["project-participant"],
  },
};

// Mock Auth Context Provider
function MockAuthProvider({
  children,
  user = mockAdminUser,
}: {
  children: React.ReactNode;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    collections: Record<string, string[]>;
    realm_access: {
      roles: string[];
    };
  };
}) {
  const mockAuthContext = {
    user: {
      profile: user,
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

// Mock files data
const mockFiles = [
  {
    object_name: "test/admin/document-1.pdf",
    original_filename: "document-1.pdf",
    content_type: "application/pdf",
    size: 2456789,
    upload_time: "2025-10-13T14:30:00Z",
    owner: "admin@example.com",
    collection: "test",
    metadata: {
      status: "Completed",
      tags: ["important", "review"],
    },
  },
  {
    object_name: "shared/jane-smith/report-q3.xlsx",
    original_filename: "report-q3.xlsx",
    content_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 1234567,
    upload_time: "2025-10-13T10:15:00Z",
    owner: "jane-smith",
    collection: "shared",
    metadata: {
      status: "In progress",
      tags: ["quarterly", "finance"],
    },
  },
  {
    object_name: "test/participant/my-data.xlsx",
    original_filename: "my-data.xlsx",
    content_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 3456789,
    upload_time: "2025-10-13T09:00:00Z",
    owner: "participant@example.com",
    collection: "test",
    metadata: {
      status: "In progress",
      tags: ["data", "analysis"],
    },
  },
  {
    object_name: "test/john-doe/presentation.pptx",
    original_filename: "presentation.pptx",
    content_type:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 8901234,
    upload_time: "2025-10-12T16:45:00Z",
    owner: "john-doe",
    collection: "test",
    metadata: {
      status: "Completed",
      tags: ["meeting", "slides"],
    },
  },
  {
    object_name: "shared/participant/upload.pdf",
    original_filename: "upload.pdf",
    content_type: "application/pdf",
    size: 1234567,
    upload_time: "2025-10-12T11:20:00Z",
    owner: "participant@example.com",
    collection: "shared",
    metadata: {
      status: "Completed",
      tags: ["submission"],
    },
  },
  {
    object_name: "shared/alice-jones/meeting-notes.docx",
    original_filename: "meeting-notes.docx",
    content_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 345678,
    upload_time: "2025-10-11T11:30:00Z",
    owner: "alice-jones",
    collection: "shared",
    metadata: {
      status: "Completed",
      tags: ["notes", "meeting"],
    },
  },
];

/**
 * Admin user - full permissions
 *
 * Demonstrates admin capabilities:
 * - Shows "Create Collection" button in collections grid
 * - All files show full actions: Download, View History, Archive, Delete
 */
export const AdminUser: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockAdminUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/test", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "test"),
          });
        }),
        http.get("http://localhost:8000/api/files/restricted", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "restricted"),
          });
        }),
        http.get("http://localhost:8000/api/files/shared", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "shared"),
          });
        }),
      ],
    },
  },
};

/**
 * Loading state - shows skeleton components
 */
export const Loading: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockAdminUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/*", async () => {
          await delay("infinite");
          return HttpResponse.json({ files: [] });
        }),
      ],
    },
  },
};

/**
 * Empty state - user has no collections
 */
export const EmptyCollections: Story = {
  decorators: [
    (Story) => {
      const emptyUser = {
        ...mockAdminUser,
        collections: {},
      };

      return (
        <MemoryRouter>
          <MockAuthProvider user={emptyUser}>
            <CollectionsProvider>
              <FilesProvider>
                <div className="min-h-screen bg-background p-8">
                  <Story />
                </div>
              </FilesProvider>
            </CollectionsProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/*", () => {
          return HttpResponse.json({ files: [] });
        }),
      ],
    },
  },
};

/**
 * Empty files state - collections exist but no files uploaded
 */
export const EmptyFiles: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockAdminUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/test", () => {
          return HttpResponse.json({ files: [] });
        }),
        http.get("http://localhost:8000/api/files/restricted", () => {
          return HttpResponse.json({ files: [] });
        }),
        http.get("http://localhost:8000/api/files/shared", () => {
          return HttpResponse.json({ files: [] });
        }),
      ],
    },
  },
};

/**
 * Many collections - tests grid overflow
 */
export const ManyCollections: Story = {
  decorators: [
    (Story) => {
      const manyCollectionsUser = {
        ...mockAdminUser,
        collections: Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [
            `collection-${i + 1}`,
            ["read", "write", "delete"],
          ]),
        ),
      };

      return (
        <MemoryRouter>
          <MockAuthProvider user={manyCollectionsUser}>
            <CollectionsProvider>
              <FilesProvider>
                <div className="min-h-screen bg-background p-8">
                  <Story />
                </div>
              </FilesProvider>
            </CollectionsProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/*", () => {
          return HttpResponse.json({ files: mockFiles.slice(0, 2) });
        }),
      ],
    },
  },
};

/**
 * Slow loading - simulates slow network
 */
export const SlowLoading: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockAdminUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/*", async () => {
          await delay(2000);
          return HttpResponse.json({ files: mockFiles });
        }),
      ],
    },
  },
};

/**
 * Trust Architect user - full file permissions, but cannot create collections
 *
 * Demonstrates Trust Architect capabilities:
 * - TODO: NO "Create Collection" button (only admins can create collections)
 * - All files show full actions: Download, View History, Archive, Delete
 */
export const TrustArchitectUser: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockTAUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/test", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "test"),
          });
        }),
        http.get("http://localhost:8000/api/files/restricted", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "restricted"),
          });
        }),
        http.get("http://localhost:8000/api/files/shared", () => {
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "shared"),
          });
        }),
      ],
    },
  },
};

/**
 * Participant user - limited file actions, no Create Collection button
 *
 * Demonstrates permission differences:
 * - TODO: NO "Create Collection" button
 * - Files owned by participant (my-data.xlsx, upload.pdf): Show "Download" action
 * - Files owned by others (document-1.pdf, report-q3.xlsx, etc.): Show "No actions available" (disabled)
 */
export const ParticipantUser: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider user={mockParticipantUser}>
          <CollectionsProvider>
            <FilesProvider>
              <div className="min-h-screen bg-background p-8">
                <Story />
              </div>
            </FilesProvider>
          </CollectionsProvider>
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/test", () => {
          // Show all files in test collection to demonstrate permission differences
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "test"),
          });
        }),
        http.get("http://localhost:8000/api/files/shared", () => {
          // Show all files in shared collection to demonstrate permission differences
          return HttpResponse.json({
            files: mockFiles.filter((f) => f.collection === "shared"),
          });
        }),
      ],
    },
  },
};
