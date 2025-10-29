import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "../Sidebar";
import type { Collection, User } from "@/types";

interface MobileSidebarProps {
  collections: Collection[];
  selectedCollectionId?: string | null;
  onCollectionSelect: (collectionId: string) => void;
  onHomeClick: () => void;
  isHomeSelected?: boolean;
  onConfigClick: () => void;
  user: User;
  onLogout: () => void;
  isLoading?: boolean;
  className?: string;
}

export function MobileSidebar(props: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when resizing to desktop size
  useEffect(() => {
    const handleResize = () => {
      // lg breakpoint is 1024px
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCollectionSelect = (collectionId: string) => {
    props.onCollectionSelect(collectionId);
    setIsOpen(false);
  };

  const handleHomeClick = () => {
    props.onHomeClick();
    setIsOpen(false);
  };

  const handleConfigClick = () => {
    props.onConfigClick();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Navbar */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background border-b border-border",
          props.className,
        )}
        data-testid="mobile-navbar"
      >
        <div className="flex justify-between items-center px-4 py-4">
          {/* STUF Logo */}
          <div
            className="text-foreground text-3xl font-extrabold font-sans leading-10"
            data-testid="mobile-navbar-logo"
          >
            STUF
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            data-testid="mobile-sidebar-toggle"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
              <span
                className={cn(
                  "w-full h-0.5 bg-foreground transition-transform duration-200 origin-center",
                  isOpen && "rotate-45 translate-y-2",
                )}
              />
              <span
                className={cn(
                  "w-full h-0.5 bg-foreground transition-opacity duration-200",
                  isOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "w-full h-0.5 bg-foreground transition-transform duration-200 origin-center",
                  isOpen && "-rotate-45 -translate-y-2",
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          data-testid="mobile-sidebar-overlay"
        />
      )}

      {/* Sidebar - shows skeleton inside when loading */}
      <div
        className={cn(
          "fixed top-16 left-0 z-40 transition-transform duration-300 ease-in-out h-[calc(100vh-4rem)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        data-testid="mobile-sidebar"
      >
        <Sidebar
          {...props}
          hideHeader={true}
          onCollectionSelect={handleCollectionSelect}
          onHomeClick={handleHomeClick}
          onConfigClick={handleConfigClick}
        />
      </div>
    </>
  );
}
