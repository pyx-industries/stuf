import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { SidebarProfile } from "./SidebarProfile";

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
      username: "storyuser",
      name: faker.person.fullName(),
      email: faker.internet.email(),
      roles: [],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
  },
};

export const WithPlaceholder: Story = {
  args: {
    user: {
      username: "c.reardon",
      name: "Cindy Reardon",
      email: "c.reardon@emailadress.com",
      roles: [],
      collections: {},
    },
  },
};

export const TruncatedName: Story = {
  args: {
    user: {
      username: "c.montgomery",
      name: "Dr. Christopher Alexander Montgomery Wellington III",
      email: "c.montgomery@example.com",
      roles: [],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
  },
};

export const TruncatedEmail: Story = {
  args: {
    user: {
      username: "jane.doe",
      name: "Jane Doe",
      email:
        "jane.doe.with.a.very.long.email.address@corporate-company-domain.com",
      roles: [],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
  },
};

export const BothTruncated: Story = {
  args: {
    user: {
      username: "alexander.montgomery",
      name: "Dr. Alexander Christopher Montgomery Wellington",
      email: "alexander.christopher.montgomery@very-long-corporate-domain.com",
      roles: [],
      avatarUrl: faker.image.avatar(),
      collections: {},
    },
  },
};
