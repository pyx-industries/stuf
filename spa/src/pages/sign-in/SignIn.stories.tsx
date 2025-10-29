import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignIn } from "./SignIn";
import { AuthProvider } from "react-oidc-context";
import { MemoryRouter } from "react-router-dom";

const meta = {
  title: "Pages/SignIn/SignIn",
  component: SignIn,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=6-2&m=dev",
    },
  },
  decorators: [
    (Story) => {
      const oidcConfig = {
        authority: "http://localhost:8080/realms/stuf",
        client_id: "stuf-spa",
        redirect_uri: window.location.origin,
        onSigninCallback: () => {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        },
      };

      return (
        <MemoryRouter>
          <AuthProvider {...oidcConfig}>
            <Story />
          </AuthProvider>
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof SignIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
