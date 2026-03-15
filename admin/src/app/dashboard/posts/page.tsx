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
import type { Post } from "@/data/mock-data";
import { mockPosts } from "@/data/mock-data";
import { Heart, Image, MessageCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const statusStyles: Record<string, string> = {
  published: "bg-lime/15 text-lime",
  flagged: "bg-amber/15 text-amber",
  removed: "bg-danger/15 text-danger",
};

const columns: ColumnDef<Post>[] = [
  {
    key: "userName",
    label: "Author",
    render: (post) => (
      <span className="font-medium">{post.userName}</span>
    ),
  },
  {
    key: "caption",
    label: "Caption",
    render: (post) => (
      <p className="max-w-xs truncate text-sm">{post.caption}</p>
    ),
  },
  {
    key: "imageCount",
    label: "Images",
    render: (post) => (
      <div className="flex items-center gap-1.5">
        <Image className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{post.imageCount}</span>
      </div>
    ),
  },
  {
    key: "likes",
    label: "Likes",
    render: (post) => (
      <div className="flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5 text-danger" />
        <span>{post.likes}</span>
      </div>
    ),
  },
  {
    key: "comments",
    label: "Comments",
    render: (post) => (
      <div className="flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5 text-sky" />
        <span>{post.comments}</span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (post) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[post.status]}`}
      >
        {post.status}
      </span>
    ),
  },
  {
    key: "timestamp",
    label: "Date",
    render: (post) =>
      new Date(post.timestamp).toLocaleDateString(),
  },
];

const filters: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "all", label: "All Statuses" },
      { value: "published", label: "Published" },
      { value: "flagged", label: "Flagged" },
      { value: "removed", label: "Removed" },
    ],
  },
];

export default function PostsPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="text-sm text-muted-foreground">
          Manage social posts and flagged content
        </p>
      </div>

      <DataTable
        data={mockPosts}
        columns={columns}
        filters={filters}
        searchKeys={["userName", "caption"]}
        searchPlaceholder="Search posts..."
        getRowId={(p) => p.id}
        actions={(post) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPost(post);
                  setModalOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {post.status === "flagged" && (
                <DropdownMenuItem>Approve Post</DropdownMenuItem>
              )}
              {post.status !== "removed" && (
                <DropdownMenuItem className="text-destructive">
                  Remove Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="details"
        title="Post Details"
        description={`by ${selectedPost?.userName}`}
      >
        {selectedPost && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Caption</p>
              <p className="text-sm">{selectedPost.caption}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Author" value={selectedPost.userName} />
              <DetailRow label="Status" value={selectedPost.status} />
              <DetailRow label="Likes" value={selectedPost.likes} />
              <DetailRow label="Comments" value={selectedPost.comments} />
              <DetailRow label="Images" value={selectedPost.imageCount} />
              <DetailRow
                label="Posted"
                value={new Date(
                  selectedPost.timestamp,
                ).toLocaleString()}
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
