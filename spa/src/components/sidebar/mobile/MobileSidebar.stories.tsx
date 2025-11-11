import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { MobileSidebar } from "./MobileSidebar";
import { UserRole } from "@/types";
import { useState } from "react";

const meta = {
  title: "Components/Sidebar/MobileSidebar",
  component: MobileSidebar,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-5297&m=dev",
    },
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    collections: {
      control: "object",
      description: "Array of collections to display",
    },
    selectedCollectionId: {
      control: "text",
      description: "ID of the selected collection",
    },
    onCollectionSelect: {
      action: "collection selected",
      description: "Callback when a collection is selected",
    },
    onHomeClick: {
      action: "home clicked",
      description: "Callback when Files home is clicked",
    },
    isHomeSelected: {
      control: "boolean",
      description: "Whether Files home is selected",
    },
    onConfigClick: {
      action: "config clicked",
      description: "Callback when Configuration is clicked",
    },
    user: {
      control: "object",
      description:
        "User object containing name, email, roles, and optional avatarUrl",
    },
    onLogout: {
      action: "logout clicked",
      description: "Callback when logout is clicked",
    },
    isLoading: {
      control: "boolean",
      description: "Whether the sidebar is in loading state",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the mobile navbar",
    },
  },
} satisfies Meta<typeof MobileSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminUser: Story = {
  args: {
    collections: [
      { id: "collection-a", name: "Collections A" },
      { id: "collection-b", name: "Collections B" },
      { id: "collection-c", name: "Collections C" },
      { id: "collection-d", name: "Collections D" },
    ],
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
      collections: {},
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
};

export const RegularUser: Story = {
  args: {
    collections: [
      { id: "collection-a", name: "Collections A" },
      { id: "collection-b", name: "Collections B" },
      { id: "collection-c", name: "Collections C" },
      { id: "collection-d", name: "Collections D" },
    ],
    user: {
      username: "john.doe",
      name: "John Doe",
      email: "john.doe@example.com",
      roles: [UserRole.ProjectParticipant],
      collections: {},
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
};

export const WithSelectedCollection: Story = {
  args: {
    ...AdminUser.args,
    selectedCollectionId: "collection-a",
  },
};

export const WithAvatar: Story = {
  args: {
    ...AdminUser.args,
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
  },
};

export const ManyCollections: Story = {
  args: {
    collections: [],
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
      collections: {},
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
  render: () => {
    const ManyCollectionsMobileSidebar = () => {
      const [selectedCollectionId, setSelectedCollectionId] = useState<
        string | null
      >(null);
      const [isHomeSelected, setIsHomeSelected] = useState(false);

      const manyCollections = Array.from({ length: 20 }, (_, i) => ({
        id: `collection-${i}`,
        name: `Collection ${i}`,
      }));

      const handleCollectionSelect = (collectionId: string) => {
        setSelectedCollectionId(collectionId);
        setIsHomeSelected(false);
      };

      const handleHomeClick = () => {
        setSelectedCollectionId(null);
        setIsHomeSelected(true);
      };

      const handleConfigClick = () => {
        console.log("Configuration clicked");
      };

      const handleLogout = () => {
        console.log("Logout clicked");
      };

      return (
        <MobileSidebar
          collections={manyCollections}
          selectedCollectionId={selectedCollectionId}
          onCollectionSelect={handleCollectionSelect}
          onHomeClick={handleHomeClick}
          isHomeSelected={isHomeSelected}
          onConfigClick={handleConfigClick}
          onLogout={handleLogout}
          user={{
            username: "c.reardon",
            name: "Cindy Reardon",
            email: "c.reardon@emailadress.com",
            roles: [UserRole.Admin],
            collections: {},
          }}
        />
      );
    };

    return <ManyCollectionsMobileSidebar />;
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive mobile sidebar with 20 collections.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    ...AdminUser.args,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Loading state showing the hamburger button. When opened, the sidebar displays skeleton placeholders while user data or collections are being fetched.",
      },
    },
  },
};
