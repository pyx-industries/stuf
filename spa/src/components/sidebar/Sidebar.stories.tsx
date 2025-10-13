import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { Sidebar } from "./Sidebar";
import { UserRole } from "@/types";
import { useState } from "react";

const meta = {
  title: "Components/Sidebar/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-4002&m=dev",
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
  },
} satisfies Meta<typeof Sidebar>;

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
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
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
      name: "John Doe",
      email: "john.doe@example.com",
      roles: [UserRole.User],
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
};

export const WithSelectedHome: Story = {
  args: {
    ...AdminUser.args,
    isHomeSelected: true,
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
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
      avatarUrl: faker.image.avatar(),
    },
  },
};

export const EmptyCollections: Story = {
  args: {
    collections: [],
    user: {
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
};

export const ManyCollections: Story = {
  args: {
    collections: [],
    user: {
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.Admin],
    },
    onCollectionSelect: () => console.log("Collection selected"),
    onHomeClick: () => console.log("Home clicked"),
    onConfigClick: () => console.log("Config clicked"),
    onLogout: () => console.log("Logout clicked"),
  },
  render: () => {
    const ManyCollectionsSidebar = () => {
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
        <Sidebar
          collections={manyCollections}
          selectedCollectionId={selectedCollectionId}
          onCollectionSelect={handleCollectionSelect}
          onHomeClick={handleHomeClick}
          isHomeSelected={isHomeSelected}
          onConfigClick={handleConfigClick}
          onLogout={handleLogout}
          user={{
            name: "Cindy Reardon",
            email: "c.reardon@emailadress.com",
            roles: [UserRole.Admin],
          }}
        />
      );
    };

    return <ManyCollectionsSidebar />;
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive story with 20 collections.",
      },
    },
  },
};

export const LongUserInfo: Story = {
  args: {
    ...AdminUser.args,
    user: {
      name: "Christina Marie Reardon-Smith",
      email: "christina.marie.reardon-smith@verylongemailaddress.com",
      roles: [UserRole.Admin],
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
          "Loading state with skeleton placeholders. This is shown while user data or collections are being fetched.",
      },
    },
  },
};
