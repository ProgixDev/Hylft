"use client";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  type ColumnDef,
} from "@/components/ui/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import type { Workout } from "@/data/mock-data";
import { mockWorkouts } from "@/data/mock-data";
import { Clock, Dumbbell, Flame, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const columns: ColumnDef<Workout>[] = [
  {
    key: "userName",
    label: "User",
    render: (workout) => (
      <span className="font-medium">{workout.userName}</span>
    ),
  },
  {
    key: "name",
    label: "Workout",
    render: (workout) => workout.name,
  },
  {
    key: "date",
    label: "Date",
    render: (workout) => new Date(workout.date).toLocaleDateString(),
  },
  {
    key: "duration",
    label: "Duration",
    render: (workout) => (
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{workout.duration} min</span>
      </div>
    ),
  },
  {
    key: "exerciseCount",
    label: "Exercises",
    render: (workout) => (
      <div className="flex items-center gap-1.5">
        <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{workout.exerciseCount}</span>
      </div>
    ),
  },
  {
    key: "caloriesBurned",
    label: "Calories",
    render: (workout) => (
      <div className="flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span>{workout.caloriesBurned}</span>
      </div>
    ),
  },
];

export default function WorkoutsPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-sm text-muted-foreground">
          All workout sessions across the platform
        </p>
      </div>

      <DataTable
        data={mockWorkouts}
        columns={columns}
        searchKeys={["userName", "name"]}
        searchPlaceholder="Search workouts..."
        getRowId={(w) => w.id}
        actions={(workout) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedWorkout(workout);
                  setModalOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="details"
        title={selectedWorkout?.name ?? "Workout Details"}
        description={`by ${selectedWorkout?.userName}`}
      >
        {selectedWorkout && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="User" value={selectedWorkout.userName} />
              <DetailRow label="Workout" value={selectedWorkout.name} />
              <DetailRow
                label="Date"
                value={new Date(
                  selectedWorkout.date,
                ).toLocaleDateString()}
              />
              <DetailRow
                label="Duration"
                value={`${selectedWorkout.duration} min`}
              />
              <DetailRow
                label="Exercises"
                value={selectedWorkout.exerciseCount}
              />
              <DetailRow
                label="Calories Burned"
                value={selectedWorkout.caloriesBurned}
              />
            </div>
            {selectedWorkout.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{selectedWorkout.notes}</p>
              </div>
            )}
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
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  );
}
