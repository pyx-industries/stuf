import type { Meta, StoryObj } from "@storybook/react-vite";
import { UploadButton } from "./UploadButton";

const meta = {
  title: "Components/Collection/UploadButton",
  component: UploadButton,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/STUF-UI?node-id=91-1183&m=dev",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-8">
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  argTypes: {
    onClick: {
      action: "clicked",
      description: "Callback when button is clicked",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof UploadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
