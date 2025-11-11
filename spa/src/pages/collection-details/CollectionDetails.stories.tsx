import { CollectionsProvider } from "@/contexts/collections/CollectionsContext";
import { FilesProvider } from "@/contexts/files/FilesContext";
import apiClient from "@/services/api";
import type { File } from "@/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useEffect } from "react";
import { AuthContext } from "react-oidc-context";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CollectionDetails } from "./CollectionDetails";

const mockFiles: File[] = [
  {
    object_name:
      "Collection A/admin@example.com/20250123-205800-annual-report.pdf",
    collection: "Collection A",
    owner: "admin@example.com",
    original_filename: "Annual reporting of the lorem ipsum dolar sit amet",
    upload_time: "2025-01-23T20:58:00Z",
    content_type: "application/pdf",
    size: 25165824, // 24 MB
    metadata: { status: "In progress" },
  },
  {
    object_name:
      "Collection A/testuser@example.com/20250208-090100-change-log.pdf",
    collection: "Collection A",
    owner: "testuser@example.com",
    original_filename: "Change log of the lorem ipsum dolar sit amet",
    upload_time: "2025-02-08T09:01:00Z",
    content_type: "application/pdf",
    size: 25165824,
    metadata: { status: "In progress" },
  },
  {
    object_name:
      "Collection A/e.tombs@email.com/20250311-121500-board-meeting.pdf",
    collection: "Collection A",
    owner: "e.tombs@longeremailaddress",
    original_filename: "Board Meeting Q3 2025",
    upload_time: "2025-03-11T12:15:00Z",
    content_type: "application/pdf",
    size: 39845888, // 38 MB
    metadata: { status: "In progress" },
  },
  {
    object_name:
      "Collection A/c.spender@example.com/20250420-105900-annual-report-2.pdf",
    collection: "Collection A",
    owner: "Cassandra Spender",
    original_filename: "Annual reporting of the lorem ipsum dolar sit amet",
    upload_time: "2025-04-20T10:59:00Z",
    content_type: "application/pdf",
    size: 39845888,
    metadata: { status: "Review" },
  },
  {
    object_name:
      "Collection A/l.boggs@example.com/20250510-122800-mandatory-report.pdf",
    collection: "Collection A",
    owner: "Luther Lee Boggs",
    original_filename: "Mandatory reporting Q1 2024 to Q4 2025",
    upload_time: "2025-05-10T12:28:00Z",
    content_type: "application/pdf",
    size: 1468006, // 1.4 MB
    metadata: { status: "In progress" },
  },
  {
    object_name:
      "Collection A/j.byers@email.com/20250606-060000-change-log.pdf",
    collection: "Collection A",
    owner: "j.byers@email.com",
    original_filename: "Change log of the lorem ipsum dolar sit amet",
    upload_time: "2025-06-06T06:00:00Z",
    content_type: "application/pdf",
    size: 1468006,
    metadata: { status: "Review" },
  },
  {
    object_name:
      "Collection A/e.buente@email.com/20250821-123900-board-meeting.pdf",
    collection: "Collection A",
    owner: "e.buente@email.com",
    original_filename: "Board Meeting Q3 2025",
    upload_time: "2025-08-21T12:39:00Z",
    content_type: "application/pdf",
    size: 1468006,
    metadata: { status: "Done" },
  },
  {
    object_name:
      "Collection A/frank@example.com/20251009-115600-frank-report.pdf",
    collection: "Collection A",
    owner: "Frank Black",
    original_filename: "Frank Black report v2",
    upload_time: "2025-10-09T11:56:00Z",
    content_type: "application/pdf",
    size: 1468006,
    metadata: { status: "Review" },
  },
  {
    object_name:
      "Collection A/j.smith@example.com/20251123-073700-annual-report-3.pdf",
    collection: "Collection A",
    owner: "Jeremiah Smith",
    original_filename: "Annual reporting of the lorem ipsum dolar sit amet",
    upload_time: "2025-11-23T07:37:00Z",
    content_type: "application/pdf",
    size: 1468006,
    metadata: { status: "Done" },
  },
  {
    object_name:
      "Collection A/m.covarrubius@email.com/20251209-155700-annual-report-4.pdf",
    collection: "Collection A",
    owner: "m.covarrubius@email.com",
    original_filename: "Annual reporting of the lorem ipsum dolar sit amet",
    upload_time: "2025-12-09T15:57:00Z",
    content_type: "application/pdf",
    size: 1468006,
    metadata: { status: "Done" },
  },
];

// Mock auth context
const mockAuthContextValue = {
  user: {
    access_token: "mock-token",
    token_type: "Bearer",
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    expired: false,
    scopes: [],
    session_state: "mock-session",
    state: "mock-state",
    profile: {
      given_name: "Admin",
      family_name: "User",
      email: "admin@example.com",
      preferred_username: "admin",
      realm_access: {
        roles: ["admin"],
      },
      collections: {
        "Collection A": ["read", "write", "delete"],
        restricted: ["read", "write", "delete"],
        shared: ["read", "write", "delete"],
      },
    },
  },
  isAuthenticated: true,
  isLoading: false,
  activeNavigator: undefined,
  events: {} as any,
  settings: {} as any,
  signinRedirect: () => Promise.resolve(),
  signoutRedirect: () => Promise.resolve(),
  signinPopup: () => Promise.resolve(null as any),
  signinResourceOwnerCredentials: () => Promise.resolve(null as any),
  signoutPopup: () => Promise.resolve(),
  signinSilent: () => Promise.resolve(null as any),
  signoutSilent: () => Promise.resolve(),
  removeUser: () => Promise.resolve(),
  revokeTokens: () => Promise.resolve(),
  startSilentRenew: () => {},
  stopSilentRenew: () => {},
  clearStaleState: () => Promise.resolve(),
  querySessionStatus: () => Promise.resolve(null as any),
};

// Wrapper component to set auth on apiClient
function AuthWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    apiClient.setAuth({
      user: {
        access_token: mockAuthContextValue.user.access_token,
      },
    });
  }, []);

  return <>{children}</>;
}

// Create a mutable copy of mockFiles for interactive stories
let currentFiles = [...mockFiles];

const meta = {
  title: "Pages/CollectionDetails",
  component: CollectionDetails,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=10-323&t=X1ojbU0VMwecFl97-4",
    },
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/:collection", () => {
          return HttpResponse.json({
            files: currentFiles,
          });
        }),
        http.delete(
          "http://localhost:8000/api/files/:collection/*",
          ({ request }) => {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            // Path is /api/files/:collection/:objectName where objectName can have slashes
            const objectName = pathParts.slice(4).join("/"); // Skip /api/files/collection
            console.log("DELETE request for:", objectName);
            console.log("Before delete, files count:", currentFiles.length);
            currentFiles = currentFiles.filter(
              (file) => file.object_name !== objectName,
            );
            console.log("After delete, files count:", currentFiles.length);
            return HttpResponse.json({
              status: "success",
              message: "File deleted successfully",
            });
          },
        ),
        http.patch(
          "http://localhost:8000/api/files/:collection/*",
          ({ request }) => {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            const objectName = pathParts.slice(4).join("/");
            console.log("PATCH request for:", objectName);
            currentFiles = currentFiles.map((file) =>
              file.object_name === objectName
                ? { ...file, metadata: { ...file.metadata, archived: true } }
                : file,
            );
            return HttpResponse.json({
              status: "success",
              message: "File archived successfully",
            });
          },
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <AuthWrapper>
        <AuthContext.Provider value={mockAuthContextValue as any}>
          <CollectionsProvider>
            <FilesProvider>
              <MemoryRouter initialEntries={["/collections/Collection A"]}>
                <div className="min-h-screen bg-background p-8">
                  <Routes>
                    <Route
                      path="/collections/:collectionId"
                      element={<Story />}
                    />
                  </Routes>
                </div>
              </MemoryRouter>
            </FilesProvider>
          </CollectionsProvider>
        </AuthContext.Provider>
      </AuthWrapper>
    ),
  ],
} satisfies Meta<typeof CollectionDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async () => {
    // Reset files when story loads
    currentFiles = [...mockFiles];
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/:collection", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return HttpResponse.json({
            files: mockFiles,
          });
        }),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/:collection", () => {
          return HttpResponse.json({
            files: [],
          });
        }),
      ],
    },
  },
};

export const WithManyFiles: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("http://localhost:8000/api/files/:collection", () => {
          return HttpResponse.json({
            files: currentFiles,
          });
        }),
        http.delete(
          "http://localhost:8000/api/files/:collection/*",
          ({ request }) => {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            // Path is /api/files/:collection/:objectName where objectName can have slashes
            const objectName = pathParts.slice(4).join("/"); // Skip /api/files/collection
            console.log("DELETE request for:", objectName);
            console.log("Before delete, files count:", currentFiles.length);
            currentFiles = currentFiles.filter(
              (file) => file.object_name !== objectName,
            );
            console.log("After delete, files count:", currentFiles.length);
            return HttpResponse.json({
              status: "success",
              message: "File deleted successfully",
            });
          },
        ),
        http.patch(
          "http://localhost:8000/api/files/:collection/*",
          ({ request }) => {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            const objectName = pathParts.slice(4).join("/");
            console.log("PATCH request for:", objectName);
            currentFiles = currentFiles.map((file) =>
              file.object_name === objectName
                ? { ...file, metadata: { ...file.metadata, archived: true } }
                : file,
            );
            return HttpResponse.json({
              status: "success",
              message: "File archived successfully",
            });
          },
        ),
      ],
    },
  },
  play: async () => {
    // Reset with 25 files for this story
    currentFiles = Array.from({ length: 25 }, (_, i) => ({
      ...mockFiles[i % mockFiles.length],
      object_name: `Collection A/user${i}@example.com/20250101-120000-file-${i}.pdf`,
      original_filename: `File ${i + 1}`,
      collection: "Collection A",
    }));
  },
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Interactive collection details page where you can apply filters, select files, and test all functionality.",
      },
    },
  },
  play: async () => {
    // Reset files when story loads
    currentFiles = [...mockFiles];
  },
};
