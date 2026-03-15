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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import type { Routine } from "@/data/mock-data";
import { mockRoutines } from "@/data/mock-data";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

const difficultyStyles: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "rgba(79,195,247,0.15)", text: "#4fc3f7" },
  intermediate: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  advanced: { bg: "rgba(182,82,199,0.15)", text: "#b652c7" },
};

const columns: ColumnDef<Routine>[] = [
  {
    key: "name",
    label: "Routine",
    render: (routine) => (
      <div>
        <p className="font-medium">{routine.name}</p>
        <p className="text-xs text-muted-foreground">
          {routine.description}
        </p>
      </div>
    ),
  },
  {
    key: "userName",
    label: "Creator",
    render: (routine) => routine.userName,
  },
  {
    key: "difficulty",
    label: "Difficulty",
    render: (routine) => {
      const style = difficultyStyles[routine.difficulty];
      return (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {routine.difficulty}
        </span>
      );
    },
  },
  {
    key: "exerciseCount",
    label: "Exercises",
    render: (routine) => routine.exerciseCount,
  },
  {
    key: "estimatedDuration",
    label: "Duration",
    render: (routine) => `${routine.estimatedDuration} min`,
  },
  {
    key: "targetMuscles",
    label: "Target Muscles",
    sortable: false,
    render: (routine) => (
      <div className="flex flex-wrap gap-1">
        {routine.targetMuscles.slice(0, 3).map((muscle) => (
          <span
            key={muscle}
            className="rounded bg-secondary px-1.5 py-0.5 text-xs"
          >
            {muscle}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: "timesCompleted",
    label: "Completed",
    render: (routine) => `${routine.timesCompleted}x`,
  },
];

const filters: FilterDef[] = [
  {
    key: "difficulty",
    label: "Difficulty",
    options: [
      { value: "all", label: "All Difficulties" },
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
];

export default function RoutinesPage() {
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Routines</h1>
        <p className="text-sm text-muted-foreground">
          All workout routines created by users
        </p>
      </div>

      <DataTable
        data={mockRoutines}
        columns={columns}
        filters={filters}
        searchKeys={["name", "userName"]}
        searchPlaceholder="Search routines..."
        getRowId={(r) => r.id}
        actions={(routine) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRoutine(routine);
                  setModalOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Remove Routine
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="details"
        title={selectedRoutine?.name ?? "Routine Details"}
        description={`by ${selectedRoutine?.userName}`}
      >
        {selectedRoutine && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedRoutine.description}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Creator" value={selectedRoutine.userName} />
              <DetailRow
                label="Difficulty"
                value={selectedRoutine.difficulty}
              />
              <DetailRow
                label="Exercises"
                value={selectedRoutine.exerciseCount}
              />
              <DetailRow
                label="Est. Duration"
                value={`${selectedRoutine.estimatedDuration} min`}
              />
              <DetailRow
                label="Times Completed"
                value={selectedRoutine.timesCompleted}
              />
              <DetailRow
                label="Target Muscles"
                value={selectedRoutine.targetMuscles.join(", ")}
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
