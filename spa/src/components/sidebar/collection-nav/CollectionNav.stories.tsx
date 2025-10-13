import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollectionNav } from "./CollectionNav";
import { useState } from "react";

const meta = {
  title: "Components/Sidebar/CollectionNav",
  component: CollectionNav,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-5345&t=pBWs4FaXzwlVPbHX-4",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="w-[280px] bg-background p-4">
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  argTypes: {
    collections: {
      control: "object",
      description: "List of collections to display",
    },
    selectedCollectionId: {
      control: "text",
      description: "ID of the currently selected collection",
    },
    isHomeSelected: {
      control: "boolean",
      description: "Whether the home/files home is selected",
    },
    isExpanded: {
      control: "boolean",
      description: "Whether the collections list is expanded (controlled)",
    },
  },
} satisfies Meta<typeof CollectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCollections = [
  { id: "collection-a", name: "Collections A" },
  { id: "collection-b", name: "Collections B" },
  { id: "collection-c", name: "Collections C" },
  { id: "collection-d", name: "Collections D" },
];

export const Default: Story = {
  args: {
    collections: mockCollections,
  },
};

export const HomeSelected: Story = {
  args: {
    collections: mockCollections,
    isHomeSelected: true,
  },
};

export const CollectionSelected: Story = {
  args: {
    collections: mockCollections,
    selectedCollectionId: "collection-a",
  },
};

export const Interactive: Story = {
  args: {
    collections: mockCollections,
  },
  render: () => {
    const InteractiveNav = () => {
      const [selectedId, setSelectedId] = useState<string | null>(null);
      const [homeSelected, setHomeSelected] = useState(false);

      const handleCollectionSelect = (id: string) => {
        setSelectedId(id);
        setHomeSelected(false);
      };

      const handleHomeClick = () => {
        setSelectedId(null);
        setHomeSelected(true);
      };

      return (
        <CollectionNav
          collections={mockCollections}
          selectedCollectionId={selectedId}
          onCollectionSelect={handleCollectionSelect}
          onHomeClick={handleHomeClick}
          isHomeSelected={homeSelected}
        />
      );
    };

    return <InteractiveNav />;
  },
};

export const EmptyCollections: Story = {
  args: {
    collections: [],
  },
};

export const ManyCollections: Story = {
  args: {
    collections: [
      { id: "collection-1", name: "Personal Documents" },
      { id: "collection-2", name: "Work Files" },
      { id: "collection-3", name: "Projects 2024" },
      { id: "collection-4", name: "Archive" },
      { id: "collection-5", name: "Shared Resources" },
      { id: "collection-6", name: "Templates" },
      { id: "collection-7", name: "Reports Q1" },
      { id: "collection-8", name: "Reports Q2" },
    ],
    selectedCollectionId: "collection-3",
  },
};

export const LongCollectionNames: Story = {
  args: {
    collections: [
      {
        id: "collection-1",
        name: "Very Long Collection Name That Should Truncate Properly",
      },
      {
        id: "collection-2",
        name: "Another Extremely Long Collection Name For Testing",
      },
      { id: "collection-3", name: "Short" },
    ],
    selectedCollectionId: "collection-1",
  },
};

export const Collapsed: Story = {
  args: {
    collections: mockCollections,
    isExpanded: false,
  },
};

export const Expanded: Story = {
  args: {
    collections: mockCollections,
    isExpanded: true,
    selectedCollectionId: "collection-b",
  },
};
