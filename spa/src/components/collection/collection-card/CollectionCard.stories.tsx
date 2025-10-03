import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollectionCard } from "./CollectionCard";

const meta = {
  title: "Components/Collection/CollectionCard",
  component: CollectionCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/STUF-UI?node-id=9-2369&t=vno3sopgQouaQKmP-4",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: "340px" }}>
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "The name of the collection",
    },
    fileCount: {
      control: "number",
      description: "Number of files in the collection",
    },
    onSettingsClick: {
      action: "settings clicked",
      description: "Callback when settings icon is clicked",
    },
    onViewClick: {
      action: "view clicked",
      description: "Callback when arrow/view button is clicked",
    },
  },
} satisfies Meta<typeof CollectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Collection A",
    fileCount: 122,
  },
};

export const EmptyCollection: Story = {
  args: {
    name: "New Collection",
    fileCount: 0,
  },
};

export const SmallCount: Story = {
  args: {
    name: "Personal Files",
    fileCount: 5,
  },
};

export const LargeCount: Story = {
  args: {
    name: "Archive 2024",
    fileCount: 9999,
  },
};

export const LongName: Story = {
  args: {
    name: "This is a Very Long Collection Name That Might Wrap",
    fileCount: 42,
  },
};
