import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile/MobileSidebar";
import { useCollections } from "@/contexts/collections/CollectionsContext";
import { useUser } from "@/hooks/user";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

interface AppLayoutProps {
  isHomeSelected?: boolean;
}

export function AppLayout({ isHomeSelected = false }: AppLayoutProps) {
  const auth = useAuth();
  const user = useUser();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const {
    collections,
    fetchCollections,
    loading: collectionsLoading,
  } = useCollections();

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Determine if we're on home or a specific collection
  const selectedCollectionId = params.collectionId || null;
  const isHome = location.pathname === "/" || isHomeSelected;

  const handleCollectionSelect = (collectionId: string) => {
    navigate(`/collections/${collectionId}`);
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleConfigClick = () => {
    navigate("/config");
  };

  const handleLogout = () => {
    auth.signoutRedirect();
  };

  const sidebarProps = {
    collections,
    selectedCollectionId,
    onCollectionSelect: handleCollectionSelect,
    onHomeClick: handleHomeClick,
    isHomeSelected: isHome,
    onConfigClick: handleConfigClick,
    user: user!,
    onLogout: handleLogout,
    isLoading: collectionsLoading,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile Sidebar - hidden on desktop */}
      <MobileSidebar {...sidebarProps} className="lg:hidden" />

      <main className="flex-1 px-4 py-12 lg:px-8 overflow-auto pt-24 lg:pt-12">
        <Outlet />
      </main>
    </div>
  );
}
