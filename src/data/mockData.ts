// Centralized mock data for the entire application

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  isPrivate: boolean;
  isFollowing: boolean;
}

export interface Post {
  id: string;
  userId: string;
  images: string[]; // Support multiple images (1-4)
  likes: number;
  caption: string;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  // Bodybuilding specific
  weight?: string;
  reps?: string;
  sets?: string;
  duration?: string;
}

export interface Notification {
  id: string;
  type: "like" | "follow" | "comment" | "mention";
  userId: string;
  action: string;
  timestamp: string;
  postId?: string;
  isRead: boolean;
}

export interface Reply {
  id: string;
  commentId: string;
  userId: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Reply[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  duration?: string;
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  exercises: Exercise[];
  caloriesBurned: number;
  notes?: string;
}

export interface SetTarget {
  setNumber: number;
  targetKg: number;
  targetReps: string;
}

export interface RoutineExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: number; // in seconds
  trainingTime?: number; // seconds per set (0 = no timer)
  targetWeight?: number; // default kg for all sets
  setTargets?: SetTarget[]; // per-set weight/reps overrides
  notes?: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
  estimatedDuration: number; // in minutes
  targetMuscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  lastUsed?: string;
  timesCompleted: number;
}

// ============================================
// USERS DATA
// ============================================
export const USERS: Record<string, User> = {
  "1": {
    id: "1",
    username: "alex_shred",
    avatar: "https://i.pravatar.cc/150?img=12",
    bio: "NPC Competitor | Nutrition Coach 🏆",
    followers: 4231,
    following: 234,
    postsCount: 2,
    isPrivate: false,
    isFollowing: false,
  },
  "2": {
    id: "2",
    username: "iron_legacy",
    avatar: "https://i.pravatar.cc/150?img=14",
    bio: "IFBB Pro | Back Specialist 💪",
    followers: 2543,
    following: 487,
    postsCount: 1,
    isPrivate: false,
    isFollowing: false,
  },
  "3": {
    id: "3",
    username: "shred_mode",
    avatar: "https://i.pravatar.cc/150?img=20",
    bio: "Shredded year-round | Cardio & Calisthenics 🔥",
    followers: 3891,
    following: 612,
    postsCount: 3,
    isPrivate: false,
    isFollowing: false,
  },
  "4": {
    id: "4",
    username: "legs_for_days",
    avatar: "https://i.pravatar.cc/150?img=18",
    bio: "Quad specialist | Transformation 💪",
    followers: 2187,
    following: 543,
    postsCount: 1,
    isPrivate: false,
    isFollowing: true,
  },
  "5": {
    id: "5",
    username: "bulk_king",
    avatar: "https://i.pravatar.cc/150?img=22",
    bio: "On a mission to pack on mass 🍗",
    followers: 1654,
    following: 432,
    postsCount: 1,
    isPrivate: false,
    isFollowing: true,
  },
  "6": {
    id: "6",
    username: "gym_rat_mike",
    avatar: "https://i.pravatar.cc/150?img=24",
    bio: "Fitness enthusiast | Gym lover 🏋️",
    followers: 1205,
    following: 342,
    postsCount: 0,
    isPrivate: true,
    isFollowing: false,
  },
  "7": {
    id: "7",
    username: "powerlifter_pro",
    avatar: "https://i.pravatar.cc/150?img=25",
    bio: "Powerlifting champion 🏋️",
    followers: 3421,
    following: 198,
    postsCount: 0,
    isPrivate: false,
    isFollowing: false,
  },
  "8": {
    id: "8",
    username: "fit_journey",
    avatar: "https://i.pravatar.cc/150?img=30",
    bio: "Documenting my fitness journey 📸",
    followers: 876,
    following: 654,
    postsCount: 0,
    isPrivate: false,
    isFollowing: false,
  },
};

// ============================================
// POSTS DATA
// ============================================
export const POSTS: Post[] = [
  {
    id: "1",
    userId: "1",
    images: [
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
      "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800",
    ],
    likes: 1240,
    caption:
      "Heavy chest day! Feeling the mind-muscle connection 🔥 This volume is insane, 3 more weeks into my competition prep!",
    comments: 87,
    timestamp: "3h ago",
    isLiked: false,
    weight: "315 lbs",
    sets: "5",
    reps: "6",
    duration: "45 min",
  },
  {
    id: "2",
    userId: "2",
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    ],
    likes: 2156,
    caption:
      "Back and biceps pump! Rows are the foundation of a massive back. 🦾 Current stats: 22 inch arms pumped",
    comments: 156,
    timestamp: "5h ago",
    isLiked: true,
    weight: "405 lbs",
    sets: "4",
    reps: "8-10",
    duration: "60 min",
  },
  {
    id: "3",
    userId: "4",
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    ],
    likes: 1876,
    caption:
      "Quad day 🔥 Progressive overload at its finest! These wheels are growing like crazy during this bulk phase",
    comments: 124,
    timestamp: "6h ago",
    isLiked: false,
    weight: "765 lbs",
    sets: "5",
    reps: "10-12",
    duration: "90 min",
  },
  {
    id: "4",
    userId: "3",
    images: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800",
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800",
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
    ],
    likes: 2543,
    caption:
      "Dropset delts 💥 This shoulder workout left me DESTROYED! Striving for that round, 3D shoulder look for stage",
    comments: 198,
    timestamp: "7h ago",
    isLiked: true,
    weight: "60 lbs",
    sets: "6",
    reps: "12-15",
    duration: "45 min",
  },
  {
    id: "5",
    userId: "5",
    images: [
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
      "https://images.unsplash.com/photo-1593476123561-9516f2097158?w=800",
    ],
    likes: 1654,
    caption:
      "Consuming 5500 calories today 🍗 Bulking season is HERE! Focusing on heavy compound movements and progressive overload. Goal: 225 lbs at 8% bodyfat",
    comments: 92,
    timestamp: "8h ago",
    isLiked: false,
    weight: "495 lbs",
    sets: "5",
    reps: "3-5",
    duration: "75 min",
  },
  {
    id: "6",
    userId: "1",
    images: [
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800",
    ],
    likes: 987,
    caption:
      "Arm day pump achieved! 💪 Biceps and triceps superset warfare. These gains aren't gonna make themselves!",
    comments: 64,
    timestamp: "10h ago",
    isLiked: false,
    weight: "50 lbs",
    sets: "4",
    reps: "12",
    duration: "35 min",
  },
  {
    id: "7",
    userId: "3",
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    ],
    likes: 1876,
    caption:
      "Back and biceps pump day 🦾 Rows are the foundation of a massive back. Current stats: 22 inch arms pumped",
    comments: 142,
    timestamp: "1d ago",
    isLiked: false,
    weight: "405 lbs",
    sets: "4",
    reps: "8-10",
    duration: "60 min",
  },
  {
    id: "8",
    userId: "3",
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    ],
    likes: 1654,
    caption:
      "Leg day never skipped 🔥 Quad day! Progressive overload at its finest! These wheels are growing like crazy during this bulk phase",
    comments: 98,
    timestamp: "2d ago",
    isLiked: false,
    weight: "765 lbs",
    sets: "5",
    reps: "10-12",
    duration: "90 min",
  },
];

// ============================================
// NOTIFICATIONS DATA
// ============================================
export const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    userId: "2",
    action: "liked your post",
    timestamp: "5m ago",
    postId: "5",
    isRead: false,
  },
  {
    id: "2",
    type: "follow",
    userId: "6",
    action: "started following you",
    timestamp: "12m ago",
    isRead: false,
  },
  {
    id: "3",
    type: "comment",
    userId: "3",
    action: "commented on your post",
    timestamp: "1h ago",
    postId: "3",
    isRead: true,
  },
  {
    id: "4",
    type: "like",
    userId: "4",
    action: "liked your post",
    timestamp: "3h ago",
    postId: "2",
    isRead: true,
  },
  {
    id: "5",
    type: "mention",
    userId: "5",
    action: "mentioned you in a comment",
    timestamp: "5h ago",
    postId: "1",
    isRead: true,
  },
  {
    id: "6",
    type: "follow",
    userId: "1",
    action: "started following you",
    timestamp: "1d ago",
    isRead: true,
  },
];

// ============================================
// COMMENTS DATA
// ============================================
export const COMMENTS: Comment[] = [
  // Post 1 comments
  {
    id: "c1",
    postId: "1",
    userId: "2",
    text: "Bro those numbers are insane! 💪 What's your training split looking like?",
    timestamp: "2h ago",
    likes: 15,
    isLiked: false,
    replies: [
      {
        id: "r1",
        commentId: "c1",
        userId: "1",
        text: "Push/pull/legs split! Been working great for me 🔥",
        timestamp: "1h ago",
        likes: 5,
        isLiked: false,
      },
      {
        id: "r2",
        commentId: "c1",
        userId: "2",
        text: "That's solid bro! Gonna give it a try",
        timestamp: "45m ago",
        likes: 2,
        isLiked: false,
      },
    ],
  },
  {
    id: "c2",
    postId: "1",
    userId: "4",
    text: "Chest day is the best day! Keep crushing it 🔥",
    timestamp: "2h ago",
    likes: 8,
    isLiked: true,
    replies: [
      {
        id: "r3",
        commentId: "c2",
        userId: "1",
        text: "Chest and tris is my favorite combo!",
        timestamp: "1h ago",
        likes: 3,
        isLiked: true,
      },
    ],
  },
  {
    id: "c3",
    postId: "1",
    userId: "5",
    text: "315 for reps is no joke! Respect 🙌",
    timestamp: "1h ago",
    likes: 12,
    isLiked: false,
  },
  // Post 2 comments
  {
    id: "c4",
    postId: "2",
    userId: "1",
    text: "Back workouts hit different! Your form is perfect 👌",
    timestamp: "4h ago",
    likes: 22,
    isLiked: false,
  },
  {
    id: "c5",
    postId: "2",
    userId: "3",
    text: "22 inch arms?! That's legendary status bro 💯",
    timestamp: "3h ago",
    likes: 34,
    isLiked: true,
    replies: [
      {
        id: "r4",
        commentId: "c5",
        userId: "2",
        text: "Took years of dedicated arm work but worth it!",
        timestamp: "2h ago",
        likes: 8,
        isLiked: false,
      },
      {
        id: "r5",
        commentId: "c5",
        userId: "3",
        text: "What exercises do you recommend?",
        timestamp: "1h ago",
        likes: 1,
        isLiked: false,
      },
      {
        id: "r6",
        commentId: "c5",
        userId: "2",
        text: "Barbell curls, cable curls, and close grip benches!",
        timestamp: "30m ago",
        likes: 4,
        isLiked: false,
      },
    ],
  },
  {
    id: "c6",
    postId: "2",
    userId: "5",
    text: "Can you share your back routine? Need to add some width",
    timestamp: "2h ago",
    likes: 18,
    isLiked: false,
  },
  {
    id: "c7",
    postId: "2",
    userId: "4",
    text: "405 lbs rowing?! Absolute unit 🔥",
    timestamp: "1h ago",
    likes: 25,
    isLiked: false,
  },
  // Post 3 comments
  {
    id: "c8",
    postId: "3",
    userId: "2",
    text: "Leg day = best day! Those quads are looking massive 🦵",
    timestamp: "5h ago",
    likes: 19,
    isLiked: false,
  },
  {
    id: "c9",
    postId: "3",
    userId: "1",
    text: "765 lbs? That's superhuman strength! 💪",
    timestamp: "4h ago",
    likes: 28,
    isLiked: true,
  },
  // Post 4 comments
  {
    id: "c10",
    postId: "4",
    userId: "2",
    text: "Those delts are looking 3D already! Stage ready 🏆",
    timestamp: "6h ago",
    likes: 31,
    isLiked: false,
  },
  {
    id: "c11",
    postId: "4",
    userId: "5",
    text: "Dropsets for shoulders are brutal but so effective!",
    timestamp: "5h ago",
    likes: 14,
    isLiked: false,
  },
  {
    id: "c12",
    postId: "4",
    userId: "1",
    text: "Your shoulder development is goals! What's the secret?",
    timestamp: "4h ago",
    likes: 21,
    isLiked: true,
  },
  // Post 5 comments
  {
    id: "c13",
    postId: "5",
    userId: "3",
    text: "5500 calories?! Living the dream 😅🍗",
    timestamp: "7h ago",
    likes: 42,
    isLiked: true,
  },
  {
    id: "c14",
    postId: "5",
    userId: "4",
    text: "Bulk season is the best season! Enjoy those gains",
    timestamp: "6h ago",
    likes: 16,
    isLiked: false,
  },
];

// ============================================
// WORKOUTS DATA
// ============================================
const WORKOUTS: Workout[] = [
  {
    id: "w1",
    userId: "1",
    name: "Chest & Triceps",
    date: "2024-02-12",
    startTime: "06:00 AM",
    endTime: "07:30 AM",
    duration: 90,
    caloriesBurned: 450,
    exercises: [
      {
        id: "e1",
        name: "Barbell Bench Press",
        sets: 4,
        reps: "8",
        weight: "120 kg",
      },
      {
        id: "e2",
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "10",
        weight: "40 kg",
      },
      {
        id: "e3",
        name: "Chest Flyes",
        sets: 3,
        reps: "12",
        weight: "20 kg",
      },
      {
        id: "e4",
        name: "Tricep Dips",
        sets: 3,
        reps: "10",
        weight: "25 kg",
      },
      {
        id: "e5",
        name: "Rope Tricep Pushdown",
        sets: 3,
        reps: "15",
        weight: "35 kg",
      },
    ],
    notes: undefined,
  },
  {
    id: "w2",
    userId: "1",
    name: "Back & Biceps",
    date: "2024-02-11",
    startTime: "06:30 AM",
    endTime: "08:00 AM",
    duration: 90,
    caloriesBurned: 480,
    exercises: [
      {
        id: "e6",
        name: "Barbell Rows",
        sets: 4,
        reps: "6",
        weight: "100 kg",
      },
      {
        id: "e7",
        name: "Pull-ups",
        sets: 4,
        reps: "10",
        weight: "20 kg",
      },
      {
        id: "e8",
        name: "Lat Pulldown",
        sets: 3,
        reps: "12",
        weight: "80 kg",
      },
      {
        id: "e9",
        name: "Barbell Curls",
        sets: 4,
        reps: "8",
        weight: "50 kg",
      },
      {
        id: "e10",
        name: "Hammer Curls",
        sets: 3,
        reps: "12",
        weight: "22 kg",
      },
    ],
    notes: undefined,
  },
];

// ============================================
// FOLLOWERS/FOLLOWING RELATIONSHIPS
// ============================================

export interface FollowRelationship {
  followerId: string; // user who is following
  followingId: string; // user who is being followed
}

export const FOLLOW_RELATIONSHIPS: FollowRelationship[] = [
  // User 1 (alex_shred) followers and following
  { followerId: "2", followingId: "1" }, // iron_legacy follows alex_shred
  { followerId: "3", followingId: "1" }, // shred_mode follows alex_shred
  { followerId: "4", followingId: "1" }, // legs_for_days follows alex_shred
  { followerId: "5", followingId: "1" }, // bulk_king follows alex_shred
  { followerId: "1", followingId: "2" }, // alex_shred follows iron_legacy
  { followerId: "1", followingId: "3" }, // alex_shred follows shred_mode
  { followerId: "1", followingId: "4" }, // alex_shred follows legs_for_days
  { followerId: "1", followingId: "5" }, // alex_shred follows bulk_king

  // User 2 (iron_legacy) followers and following
  { followerId: "3", followingId: "2" }, // shred_mode follows iron_legacy
  { followerId: "7", followingId: "2" }, // powerlifter_pro follows iron_legacy
  { followerId: "2", followingId: "7" }, // iron_legacy follows powerlifter_pro

  // User 3 (shred_mode) followers and following
  { followerId: "4", followingId: "3" }, // legs_for_days follows shred_mode

  // User 4 (legs_for_days) followers and following
  { followerId: "5", followingId: "4" }, // bulk_king follows legs_for_days
  { followerId: "4", followingId: "5" }, // legs_for_days follows bulk_king

  // User 5 (bulk_king) followers and following
  { followerId: "6", followingId: "5" }, // gym_rat_mike follows bulk_king
  { followerId: "5", followingId: "6" }, // bulk_king follows gym_rat_mike

  // User 6 (gym_rat_mike) followers and following
  { followerId: "8", followingId: "6" }, // fit_journey follows gym_rat_mike
  { followerId: "6", followingId: "8" }, // gym_rat_mike follows fit_journey

  // User 7 (powerlifter_pro) followers and following
  // (relationships already defined above)

  // User 8 (fit_journey) followers and following
  // (relationships already defined above)
];
export const ROUTINES: Routine[] = [
  {
    id: "r1",
    userId: "1",
    name: "Push Day - Strength",
    description: "Heavy compound movements for chest, shoulders and triceps",
    estimatedDuration: 90,
    targetMuscles: ["chest", "shoulders", "triceps"],
    difficulty: "advanced",
    lastUsed: "2024-02-12",
    timesCompleted: 24,
    exercises: [
      {
        id: "re1",
        name: "Barbell Bench Press",
        sets: 5,
        reps: "5-6",
        restTime: 180,
        notes: "Focus on explosive concentric",
      },
      {
        id: "re2",
        name: "Incline Dumbbell Press",
        sets: 4,
        reps: "8-10",
        restTime: 120,
      },
      {
        id: "re3",
        name: "Overhead Press",
        sets: 4,
        reps: "6-8",
        restTime: 150,
      },
      {
        id: "re4",
        name: "Lateral Raises",
        sets: 3,
        reps: "12-15",
        restTime: 60,
      },
      {
        id: "re5",
        name: "Tricep Dips",
        sets: 3,
        reps: "8-12",
        restTime: 90,
      },
      {
        id: "re6",
        name: "Rope Pushdowns",
        sets: 3,
        reps: "15-20",
        restTime: 60,
      },
    ],
  },
  {
    id: "r2",
    userId: "1",
    name: "Pull Day - Hypertrophy",
    description: "Back and biceps focused on muscle growth",
    estimatedDuration: 85,
    targetMuscles: ["back", "biceps", "rear delts"],
    difficulty: "intermediate",
    lastUsed: "2024-02-11",
    timesCompleted: 31,
    exercises: [
      {
        id: "re7",
        name: "Barbell Rows",
        sets: 4,
        reps: "8-10",
        restTime: 120,
      },
      {
        id: "re8",
        name: "Pull-ups",
        sets: 4,
        reps: "8-12",
        restTime: 120,
      },
      {
        id: "re9",
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        restTime: 90,
      },
      {
        id: "re10",
        name: "Cable Rows",
        sets: 3,
        reps: "12-15",
        restTime: 90,
      },
      {
        id: "re11",
        name: "Barbell Curls",
        sets: 3,
        reps: "8-10",
        restTime: 90,
      },
      {
        id: "re12",
        name: "Hammer Curls",
        sets: 3,
        reps: "12-15",
        restTime: 60,
      },
    ],
  },
  {
    id: "r3",
    userId: "1",
    name: "Leg Day - Volume",
    description: "High volume leg workout for quad and hamstring development",
    estimatedDuration: 120,
    targetMuscles: ["quads", "hamstrings", "glutes"],
    difficulty: "advanced",
    lastUsed: "2024-02-10",
    timesCompleted: 18,
    exercises: [
      {
        id: "re13",
        name: "Barbell Squats",
        sets: 5,
        reps: "6-8",
        restTime: 180,
        notes: "Go deep, focus on form",
      },
      {
        id: "re14",
        name: "Leg Press",
        sets: 4,
        reps: "10-12",
        restTime: 120,
      },
      {
        id: "re15",
        name: "Romanian Deadlifts",
        sets: 4,
        reps: "8-10",
        restTime: 120,
      },
      {
        id: "re16",
        name: "Leg Extensions",
        sets: 3,
        reps: "12-15",
        restTime: 90,
      },
      {
        id: "re17",
        name: "Leg Curls",
        sets: 3,
        reps: "12-15",
        restTime: 90,
      },
      {
        id: "re18",
        name: "Calf Raises",
        sets: 4,
        reps: "15-20",
        restTime: 60,
      },
    ],
  },
  {
    id: "r4",
    userId: "1",
    name: "Upper Body Power",
    description: "Full upper body strength and power workout",
    estimatedDuration: 75,
    targetMuscles: ["chest", "back", "shoulders", "arms"],
    difficulty: "intermediate",
    timesCompleted: 12,
    exercises: [
      {
        id: "re19",
        name: "Bench Press",
        sets: 4,
        reps: "5-6",
        restTime: 180,
      },
      {
        id: "re20",
        name: "Barbell Rows",
        sets: 4,
        reps: "5-6",
        restTime: 180,
      },
      {
        id: "re21",
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        restTime: 120,
      },
      {
        id: "re22",
        name: "Pull-ups",
        sets: 3,
        reps: "8-10",
        restTime: 120,
      },
      {
        id: "re23",
        name: "Dumbbell Curls",
        sets: 3,
        reps: "10-12",
        restTime: 60,
      },
    ],
  },
];

// ============================================
// SCHEDULE DATA
// ============================================

export interface ScheduledDay {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  routineId?: string;
  notes?: string;
  status: "completed" | "scheduled" | "rest";
}

const SCHEDULE_ROUTINE_IDS = ["r1", "r2", "r3", "r4"] as const;
const SCHEDULE_NOTES = [
  "Push for good form today.",
  "Keep rests tight between sets.",
  "Focus on control and tempo.",
  "Light mobility after the session.",
  "Try to beat last week's volume.",
  "Recovery matters as much as intensity.",
];

function formatScheduleDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateWithOffset(baseDate: Date, offset: number): Date {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offset);
  return date;
}

function getSeededValue(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function buildScheduledDay(
  offset: number,
  baseDate: Date,
  userId: string,
): ScheduledDay {
  const date = getDateWithOffset(baseDate, offset);
  const isoDate = formatScheduleDate(date);
  const seed = getSeededValue(`${userId}-${isoDate}`);
  const routineId =
    SCHEDULE_ROUTINE_IDS[Math.floor(seed * SCHEDULE_ROUTINE_IDS.length)];
  const note = SCHEDULE_NOTES[Math.floor(seed * SCHEDULE_NOTES.length)];

  let status: ScheduledDay["status"];
  if (offset === 0) {
    status = "scheduled";
  } else if (offset === 2) {
    status = "scheduled";
  } else if (offset === 1) {
    status = seed < 0.4 ? "rest" : "scheduled";
  } else if (offset === -1) {
    status = seed < 0.35 ? "rest" : "completed";
  } else if (offset < 0) {
    status = seed < 0.3 ? "rest" : "completed";
  } else {
    status = seed < 0.33 ? "rest" : "scheduled";
  }

  return {
    id: `sched-${userId}-${isoDate}`,
    userId,
    date: isoDate,
    status,
    routineId: status === "rest" ? undefined : routineId,
    notes: seed < 0.55 ? note : undefined,
  };
}

function createMockSchedule(userId: string = "1"): ScheduledDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule: ScheduledDay[] = [];
  for (let offset = -14; offset <= 21; offset += 1) {
    schedule.push(buildScheduledDay(offset, today, userId));
  }

  return schedule;
}

let SCHEDULE: ScheduledDay[] = createMockSchedule();

export function getScheduleForDate(
  date: string,
  userId: string = "1",
): ScheduledDay | undefined {
  return SCHEDULE.find((s) => s.date === date && s.userId === userId);
}

export function getScheduleForDateRange(
  startDate: string,
  endDate: string,
  userId: string = "1",
): ScheduledDay[] {
  return SCHEDULE.filter(
    (s) => s.userId === userId && s.date >= startDate && s.date <= endDate,
  ).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function updateScheduleDay(
  date: string,
  updates: Partial<Omit<ScheduledDay, "id" | "userId" | "date">>,
  userId: string = "1",
): void {
  const idx = SCHEDULE.findIndex((s) => s.date === date && s.userId === userId);
  if (idx !== -1) {
    SCHEDULE[idx] = { ...SCHEDULE[idx], ...updates };
  } else {
    SCHEDULE.push({
      id: `sched-${Date.now()}`,
      userId,
      date,
      status: "rest",
      ...updates,
    });
  }
  _notifyScheduleListeners();
}

let _scheduleListeners: (() => void)[] = [];
export function addScheduleListener(fn: () => void) {
  _scheduleListeners.push(fn);
  return () => {
    _scheduleListeners = _scheduleListeners.filter((f) => f !== fn);
  };
}
function _notifyScheduleListeners() {
  _scheduleListeners.forEach((f) => {
    try {
      f();
    } catch {
      /* ignore */
    }
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | undefined {
  return USERS[userId];
}

/**
 * Get all users as an array
 */
export function getAllUsers(): User[] {
  return Object.values(USERS);
}

/**
 * Get posts for a specific user
 */
export function getPostsByUserId(userId: string): Post[] {
  return POSTS.filter((post) => post.userId === userId);
}

/**
 * Get post by ID
 */
export function getPostById(postId: string): Post | undefined {
  return POSTS.find((post) => post.id === postId);
}

/**
 * Get all posts with populated user data
 */
export function getPostsWithUserData() {
  return POSTS.map((post) => ({
    ...post,
    user: USERS[post.userId],
  }));
}

/**
 * Get notifications with populated user data
 */
export function getNotificationsWithUserData() {
  return NOTIFICATIONS.map((notification) => ({
    ...notification,
    user: USERS[notification.userId],
  }));
}

/**
 * Get comments for a specific post
 */
export function getCommentsByPostId(postId: string): Comment[] {
  return COMMENTS.filter((comment) => comment.postId === postId);
}

/**
 * Get comments with populated user data
 */
export function getCommentsWithUserData(postId: string) {
  return getCommentsByPostId(postId).map((comment) => ({
    ...comment,
    user: USERS[comment.userId],
    replies: (comment.replies || []).map((reply) => ({
      ...reply,
      user: USERS[reply.userId],
    })),
  }));
}

/**
 * Get user profile with posts
 */
export function getUserProfile(userId: string) {
  const user = USERS[userId];
  if (!user) return null;

  const userPosts = getPostsByUserId(userId);

  return {
    ...user,
    posts_data: userPosts.map((post) => ({
      id: post.id,
      images: post.images,
      likes: post.likes,
      comments: post.comments,
      caption: post.caption,
    })),
  };
}

/**
 * Get all workouts for a specific user
 */
export function getWorkoutsByUserId(userId: string): Workout[] {
  return WORKOUTS.filter((w) => w.userId === userId);
}

/**
 * Simple listener API - notify when posts mutate (in-memory)
 */
let _postsListeners: (() => void)[] = [];
export function addPostsListener(fn: () => void) {
  _postsListeners.push(fn);
  return () => {
    _postsListeners = _postsListeners.filter((f) => f !== fn);
  };
}
function _notifyPosts() {
  _postsListeners.forEach((f) => {
    try {
      f();
    } catch {
      /* ignore */
    }
  });
}

/**
 * Add a new post (in-memory)
 */
export function addPost(post: Post): void {
  POSTS.unshift(post);
  _notifyPosts();
}

/**
 * Simple listener API - notify when workouts mutates (in-memory)
 */
let _workoutsListeners: (() => void)[] = [];
export function addWorkoutsListener(fn: () => void) {
  _workoutsListeners.push(fn);
  return () => {
    _workoutsListeners = _workoutsListeners.filter((f) => f !== fn);
  };
}
function _notifyWorkouts() {
  _workoutsListeners.forEach((f) => {
    try {
      f();
    } catch {
      /* ignore */
    }
  });
}

/**
 * Add a new workout (in-memory)
 */
export function addWorkout(workout: Workout): void {
  WORKOUTS.unshift(workout); // add to the front so it appears in Recent Workouts
  _notifyWorkouts();
}

/**
 * Get workout by ID
 */
export function getWorkoutById(workoutId: string): Workout | undefined {
  return WORKOUTS.find((workout) => workout.id === workoutId);
}

/**
 * Get all workouts
 */
export function getAllWorkouts(): Workout[] {
  return WORKOUTS;
}

/**
 * Get recent workouts for a user (last 7 days)
 */
export function getRecentWorkouts(userId: string, days: number = 7): Workout[] {
  const now = new Date();
  const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return getWorkoutsByUserId(userId).filter((workout) => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= pastDate;
  });
}

/**
 * Get all routines for a specific user
 */
export function getRoutinesByUserId(userId: string): Routine[] {
  return ROUTINES.filter((routine) => routine.userId === userId);
}

/**
 * Get routine by ID
 */
export function getRoutineById(routineId: string): Routine | undefined {
  return ROUTINES.find((routine) => routine.id === routineId);
}

/**
 * Get all routines
 */
export function getAllRoutines(): Routine[] {
  return ROUTINES;
}

/**
 * Add a new routine (in-memory)
 */
export function addRoutine(routine: Routine): void {
  ROUTINES.push(routine);
}

/**
 * Get followers for a user (users who follow this user)
 */
export function getFollowers(userId: string): User[] {
  const seen = new Set<string>();
  return FOLLOW_RELATIONSHIPS.filter(
    (rel) => rel.followingId === userId,
  ).reduce<User[]>((acc, rel) => {
    if (!seen.has(rel.followerId)) {
      seen.add(rel.followerId);
      const u = getUserById(rel.followerId);
      if (u) acc.push(u);
    }
    return acc;
  }, []);
}

/**
 * Get following for a user (users this user follows)
 */
export function getFollowing(userId: string): User[] {
  const seen = new Set<string>();
  return FOLLOW_RELATIONSHIPS.filter((rel) => rel.followerId === userId).reduce<
    User[]
  >((acc, rel) => {
    if (!seen.has(rel.followingId)) {
      seen.add(rel.followingId);
      const u = getUserById(rel.followingId);
      if (u) acc.push(u);
    }
    return acc;
  }, []);
}

/**
 * Check if user A follows user B
 */
export function isFollowing(followerId: string, followingId: string): boolean {
  return FOLLOW_RELATIONSHIPS.some(
    (rel) => rel.followerId === followerId && rel.followingId === followingId,
  );
}
