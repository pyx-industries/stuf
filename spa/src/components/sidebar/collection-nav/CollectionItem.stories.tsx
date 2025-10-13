import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollectionItem } from "./CollectionItem";

const meta = {
  title: "Components/Sidebar/CollectionItem",
  component: CollectionItem,
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
    id: {
      control: "text",
      description: "Unique identifier for the collection",
    },
    name: {
      control: "text",
      description: "Display name of the collection",
    },
    isSelected: {
      control: "boolean",
      description: "Whether the collection is currently selected",
    },
  },
} satisfies Meta<typeof CollectionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "collection-a",
    name: "Collections A",
  },
};

export const Selected: Story = {
  args: {
    id: "collection-a",
    name: "Collections A",
    isSelected: true,
  },
};

export const LongName: Story = {
  args: {
    id: "collection-long",
    name: "Very Long Collection Name That Should Truncate Properly When It Exceeds The Container Width",
    isSelected: false,
  },
};

export const LongNameSelected: Story = {
  args: {
    id: "collection-long",
    name: "Very Long Collection Name That Should Truncate Properly When It Exceeds The Container Width",
    isSelected: true,
  },
};
