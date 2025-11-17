import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { SidebarFooter } from "./SidebarFooter";
import { UserRole } from "@/types";

const meta = {
  title: "Components/Sidebar/SidebarFooter",
  component: SidebarFooter,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=96-3706&m=dev",
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
} satisfies Meta<typeof SidebarFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.ProjectParticipant],
      collections: {},
    },
    onLogout: () => console.log("Logout clicked"),
  },
};

export const WithAvatar: Story = {
  args: {
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.ProjectParticipant],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
    onLogout: () => console.log("Logout clicked"),
  },
};

export const LongUserInfo: Story = {
  args: {
    user: {
      username: "christina.marie.reardon-smith",
      name: "Christina Marie Reardon-Smith",
      email: "christina.marie.reardon-smith@verylongemailaddress.com",
      roles: [UserRole.ProjectParticipant],
      collections: {},
    },
    onLogout: () => console.log("Logout clicked"),
  },
};
