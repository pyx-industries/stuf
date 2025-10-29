import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollectionsGrid } from "./CollectionsGrid";

const meta: Meta<typeof CollectionsGrid> = {
  title: "Components/Collection/CollectionsGrid",
  component: CollectionsGrid,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=9-2514&m=dev",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    collections: {
      description: "Array of collection objects to display in the grid",
      control: { type: "object" },
    },
    loading: {
      description: "Whether to show loading skeleton state",
      control: { type: "boolean" },
      table: {
        defaultValue: { summary: "false" },
      },
    },
    onCollectionClick: {
      description: "Callback when a collection is clicked",
      action: "collection clicked",
    },
    onCollectionSettings: {
      description: "Callback when collection settings button is clicked",
      action: "settings clicked",
    },
    onCreateCollection: {
      description: "Callback when create collection card is clicked",
      action: "create collection clicked",
    },
    showCreateCollection: {
      description: "Whether to show the create collection card",
      control: { type: "boolean" },
      table: {
        defaultValue: { summary: "true" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollectionsGrid>;

const mockCollections = [
  { id: "collection-a", name: "Collection A", fileCount: 122 },
  { id: "collection-b", name: "Collection B", fileCount: 45 },
  { id: "collection-c", name: "Collection C", fileCount: 78 },
  { id: "collection-d", name: "Collection D", fileCount: 234 },
];

export const Default: Story = {
  args: {
    collections: mockCollections.slice(0, 3),
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
  },
};

export const Loading: Story = {
  args: {
    collections: mockCollections,
    loading: true,
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
  },
};

export const Empty: Story = {
  args: {
    collections: [],
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
  },
};

export const WithoutCreateButton: Story = {
  args: {
    collections: mockCollections.slice(0, 3),
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
    showCreateCollection: false,
  },
};

export const SingleCollection: Story = {
  args: {
    collections: [mockCollections[0]],
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
  },
};

export const WithManyCollections: Story = {
  args: {
    collections: mockCollections,
    onCollectionClick: (id) => console.log("Collection clicked:", id),
    onCollectionSettings: (id) => console.log("Settings clicked:", id),
    onCreateCollection: () => console.log("Create collection clicked"),
  },
};
