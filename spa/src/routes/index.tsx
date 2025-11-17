import { AppLayout } from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CollectionDetails } from "@/pages/collection-details";
import { Dashboard } from "@/pages/dashboard";
import { SignIn } from "@/pages/sign-in";
import { Upload } from "@/pages/upload";
import { Navigate, RouteObject } from "react-router-dom";

export const routes: RouteObject[] = [
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout isHomeSelected={true} />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "collections/:collectionId",
        element: <CollectionDetails />,
      },
      {
        path: "collections/:collectionId/config",
        element: <div>Collection Config Page (TODO)</div>,
      },
      {
        path: "collections/:collectionId/files/:fileId",
        element: <div>File Detail Page (TODO - will show file history)</div>,
      },
      {
        path: "upload",
        element: <Upload />,
      },
      {
        path: "config",
        element: <div>Configuration Page (TODO)</div>,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
