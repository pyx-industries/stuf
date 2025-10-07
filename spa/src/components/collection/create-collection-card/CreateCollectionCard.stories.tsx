import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreateCollectionCard } from "./CreateCollectionCard";

const meta = {
  title: "Components/Collection/CreateCollectionCard",
  component: CreateCollectionCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/STUF-UI?node-id=9-2448&t=GATxvLyatK4Zt3vr-4",
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
    onClick: {
      action: "clicked",
      description: "Callback when card is clicked",
    },
  },
} satisfies Meta<typeof CreateCollectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
