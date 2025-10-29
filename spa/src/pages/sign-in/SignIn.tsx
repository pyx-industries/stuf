import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { Button } from "@/components/ui/button";

export function SignIn() {
  const auth = useAuth();
  const location = useLocation();

  // Get the page they were trying to access, or default to home
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSignIn = () => {
    auth.signinRedirect();
  };

  // If already authenticated, redirect immediately
  if (auth.isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div
      data-testid="sign-in"
      className="flex flex-col md:flex-row min-h-screen w-full bg-background"
    >
      {/* Left Sidebar - Hidden on mobile, shown on md+ screens */}
      <div
        data-testid="sign-in-sidebar"
        className="hidden md:flex md:w-[400px] lg:w-[561px] bg-black text-white px-6 md:px-8 lg:px-10 py-12 md:py-24 lg:py-[150px] flex-col gap-4 lg:gap-[19px]"
      >
        <h1 className="font-roboto text-2xl md:text-3xl lg:text-[32px] font-extrabold leading-tight lg:leading-10">
          STUF
        </h1>
        <div className="font-roboto text-base md:text-lg lg:text-xl leading-relaxed lg:leading-7">
          <p data-testid="sign-in-description" className="mb-5">
            STUF is a comprehensive system for secure file uploads developed by
            Pyx.
          </p>
          <a
            data-testid="sign-in-pyx-link"
            href="https://pyx.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Pyx Website
          </a>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:px-[10px] md:py-[10px]">
        <div className="w-full max-w-[513px] p-6 md:p-[25px] bg-card rounded-md border border-foreground flex flex-col gap-8 md:gap-10">
          {/* Mobile-only logo */}
          <div
            data-testid="sign-in-mobile-logo"
            className="md:hidden text-center mb-4"
          >
            <h2 className="font-roboto text-2xl font-extrabold text-foreground">
              STUF
            </h2>
          </div>

          <h1
            data-testid="sign-in-title"
            className="hidden md:block font-heading text-2xl md:text-[30px] font-semibold leading-tight md:leading-9 text-card-foreground"
          >
            Sign in to STUF
          </h1>

          <Button
            data-testid="sign-in-button"
            onClick={handleSignIn}
            className="w-full px-4 py-2 bg-[#D2BB2D] hover:bg-[#D2BB2D]/90 text-black font-medium"
            size="default"
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
