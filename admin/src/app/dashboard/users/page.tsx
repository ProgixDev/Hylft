"use client";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import type { User } from "@/data/mock-data";
import { mockUsers } from "@/data/mock-data";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

const statusStyles: Record<string, string> = {
  active: "bg-lime/15 text-lime",
  inactive: "bg-muted-foreground/15 text-muted-foreground",
  banned: "bg-danger/15 text-danger",
};

const levelStyles: Record<string, string> = {
  beginner: "bg-sky/15 text-sky",
  intermediate: "bg-amber/15 text-amber",
  advanced: "bg-purple/15 text-purple",
};

const columns: ColumnDef<User>[] = [
  {
    key: "avatar",
    label: "User",
    sortable: false,
    render: (user) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime/20 text-xs font-semibold text-lime">
          {user.avatar}
        </div>
        <div>
          <p className="text-sm font-medium">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "gender",
    label: "Gender",
    render: (user) => (
      <span className="capitalize">{user.gender}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (user) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[user.status]}`}
      >
        {user.status}
      </span>
    ),
  },
  {
    key: "experienceLevel",
    label: "Level",
    render: (user) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelStyles[user.experienceLevel]}`}
      >
        {user.experienceLevel}
      </span>
    ),
  },
  {
    key: "followers",
    label: "Followers",
    render: (user) => user.followers.toLocaleString(),
  },
  {
    key: "workoutsCount",
    label: "Workouts",
    render: (user) => user.workoutsCount.toLocaleString(),
  },
  {
    key: "joinDate",
    label: "Joined",
    render: (user) => new Date(user.joinDate).toLocaleDateString(),
  },
];

const filters: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "all", label: "All Statuses" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "banned", label: "Banned" },
    ],
  },
  {
    key: "experienceLevel",
    label: "Level",
    options: [
      { value: "all", label: "All Levels" },
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
  {
    key: "gender",
    label: "Gender",
    options: [
      { value: "all", label: "All" },
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  },
];

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage all registered users
        </p>
      </div>

      <DataTable
        data={mockUsers}
        columns={columns}
        filters={filters}
        searchKeys={["username", "email"]}
        searchPlaceholder="Search users..."
        getRowId={(user) => user.id}
        actions={(user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setModalOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={user.status === "banned"}
              >
                {user.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                disabled={user.status === "banned"}
              >
                Ban User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* User Detail Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="details"
        title={selectedUser?.username ?? "User Details"}
        description={selectedUser?.email}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20 text-lg font-bold text-lime">
                {selectedUser.avatar}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {selectedUser.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.bio}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow
                label="Gender"
                value={selectedUser.gender}
              />
              <DetailRow label="Age" value={selectedUser.age} />
              <DetailRow
                label="Weight"
                value={`${selectedUser.weight} kg`}
              />
              <DetailRow
                label="Height"
                value={`${selectedUser.height} cm`}
              />
              <DetailRow label="Units" value={selectedUser.units} />
              <DetailRow
                label="Fitness Goal"
                value={selectedUser.fitnessGoal}
              />
              <DetailRow
                label="Experience"
                value={selectedUser.experienceLevel}
              />
              <DetailRow
                label="Followers"
                value={selectedUser.followers}
              />
              <DetailRow
                label="Following"
                value={selectedUser.following}
              />
              <DetailRow
                label="Posts"
                value={selectedUser.postsCount}
              />
              <DetailRow
                label="Workouts"
                value={selectedUser.workoutsCount}
              />
              <DetailRow label="Status" value={selectedUser.status} />
              <DetailRow
                label="Joined"
                value={new Date(
                  selectedUser.joinDate,
                ).toLocaleDateString()}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{String(value)}</p>
    </div>
  );
}
