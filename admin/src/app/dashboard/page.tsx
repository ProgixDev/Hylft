"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  mockDashboardStats,
  mockRecentActivity,
  mockUsers,
} from "@/data/mock-data";
import {
  Activity,
  AlertTriangle,
  Dumbbell,
  ListChecks,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

const activityIcons = {
  user_joined: UserPlus,
  workout_completed: Dumbbell,
  post_flagged: AlertTriangle,
  routine_created: ListChecks,
} as const;

const activityColors = {
  user_joined: "text-sky",
  workout_completed: "text-lime",
  post_flagged: "text-danger",
  routine_created: "text-purple",
} as const;

const statusStyles = {
  active: "bg-lime/15 text-lime",
  inactive: "bg-muted-foreground/15 text-muted-foreground",
  banned: "bg-danger/15 text-danger",
} as const;

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const recentUsers = mockUsers.slice(0, 5);
  const recentActivity = mockRecentActivity;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Hylift platform
        </p>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtext={`+${stats.newUsersThisWeek} this week`}
          color="lime"
        />
        <InfoCard
          icon={Dumbbell}
          title="Total Workouts"
          value={stats.totalWorkouts.toLocaleString()}
          subtext={`${stats.workoutsThisWeek} this week`}
          color="blue"
        />
        <InfoCard
          icon={ListChecks}
          title="Routines"
          value={stats.totalRoutines.toLocaleString()}
          color="purple"
        />
        <InfoCard
          icon={MessageSquare}
          title="Posts"
          value={stats.totalPosts.toLocaleString()}
          subtext={`${stats.flaggedPosts} flagged`}
          color="orange"
        />
      </InfoCardContainer>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-lime/10 p-3">
              <TrendingUp className="h-5 w-5 text-lime" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">
                {stats.activeUsers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of
                total
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-sky/10 p-3">
              <Activity className="h-5 w-5 text-sky" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Avg Workouts/User
              </p>
              <p className="text-2xl font-bold">
                {(stats.totalWorkouts / stats.totalUsers).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Per active user</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-danger/10 p-3">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Flagged Posts</p>
              <p className="text-2xl font-bold">{stats.flaggedPosts}</p>
              <p className="text-xs text-muted-foreground">Requires review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime/20 text-xs font-semibold text-lime">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[user.status as keyof typeof statusStyles]}`}
                  >
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type];
                const color = activityColors[activity.type];
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.description}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
