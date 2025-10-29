import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { Sidebar } from "./Sidebar";
import { UserRole } from "@/types";
import { useState } from "react";

const meta = {
  title: "Components/Sidebar/Sidebar",
  component: Sidebar,
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
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
    isLoading: {
      control: "boolean",
      description: "Whether the sidebar is in loading state",
    },
    hideHeader: {
      control: "boolean",
      description: "Whether to hide the sidebar header",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
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
      collections: {},
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
      collections: {},
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
      collections: {},
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
            collections: {},
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
      collections: {},
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

export const HiddenHeader: Story = {
  args: {
    ...AdminUser.args,
    hideHeader: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Sidebar with header hidden. Useful for embedded or mobile views where the header is shown elsewhere.",
      },
    },
  },
};

export const LoadingWithHiddenHeader: Story = {
  args: {
    ...AdminUser.args,
    isLoading: true,
    hideHeader: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Loading state with header hidden. Shows skeleton without the header section.",
      },
    },
  },
};
