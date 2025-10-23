import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { SidebarProfile } from "./SidebarProfile";
import { UserRole } from "@/types";

const meta = {
  title: "Components/Sidebar/SidebarProfile",
  component: SidebarProfile,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/STUF-UI?node-id=9-2254&m=dev",
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
  },
} satisfies Meta<typeof SidebarProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    user: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      roles: [UserRole.User],
      avatarUrl: faker.image.avatar(),
    },
  },
};

export const WithPlaceholder: Story = {
  args: {
    user: {
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [UserRole.User],
    },
  },
};

export const TruncatedName: Story = {
  args: {
    user: {
      name: "Dr. Christopher Alexander Montgomery Wellington III",
      email: "c.montgomery@example.com",
      roles: [UserRole.User],
      avatarUrl: faker.image.avatar(),
    },
  },
};

export const TruncatedEmail: Story = {
  args: {
    user: {
      name: "Jane Doe",
      email:
        "jane.doe.with.a.very.long.email.address@corporate-company-domain.com",
      roles: [UserRole.User],
      avatarUrl: faker.image.avatar(),
    },
  },
};

export const BothTruncated: Story = {
  args: {
    user: {
      name: "Dr. Alexander Christopher Montgomery Wellington",
      email: "alexander.christopher.montgomery@very-long-corporate-domain.com",
      roles: [UserRole.User],
      avatarUrl: faker.image.avatar(),
    },
  },
};
