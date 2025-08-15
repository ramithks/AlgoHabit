# PostgreSQL Implementation Guide for AlgoHabit

## Overview

This guide provides a detailed technical roadmap for migrating AlgoHabit from localStorage to PostgreSQL, including code examples, migration scripts, and deployment strategies.

## Backend API Design

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma (excellent TypeScript support)
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod for request/response validation

### Project Structure
```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, validation, etc.
│   ├── models/            # Prisma client extensions
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seeds/             # Initial data
├── tests/                 # API tests
└── package.json
```

## Database Schema Implementation

### Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String        @id @default(cuid())
  email             String        @unique
  passwordHash      String        @map("password_hash")
  salt              String
  createdAt         DateTime      @default(now()) @map("created_at")
  lastLogin         DateTime?     @map("last_login")
  timezone          String        @default("UTC")
  
  // Relations
  progress          UserProgress[]
  dailyNotes        DailyNote[]
  stats             UserStats?
  activityLog       ActivityLog[]
  
  @@map("users")
}

model Topic {
  id              String  @id
  label           String
  weekNumber      Int     @map("week_number")
  category        String
  cheatSheetRef   String? @map("cheat_sheet_ref")
  displayOrder    Int?    @map("display_order")
  createdAt       DateTime @default(now()) @map("created_at")
  
  // Relations
  userProgress    UserProgress[]
  dailyNotes      DailyNote[]
  activityLog     ActivityLog[]
  
  @@map("topics")
}

model UserProgress {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  topicId     String   @map("topic_id")
  status      Status   @default(NOT_STARTED)
  lastTouched DateTime? @map("last_touched") @db.Date
  xpFlags     Json     @default("{}") @map("xp_flags")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic       Topic    @relation(fields: [topicId], references: [id])
  
  @@unique([userId, topicId])
  @@map("user_progress")
}

model DailyNote {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  topicId     String   @map("topic_id")
  noteDate    DateTime @map("note_date") @db.Date
  content     String?
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic       Topic    @relation(fields: [topicId], references: [id])
  
  @@unique([userId, topicId, noteDate])
  @@map("daily_notes")
}

model UserStats {
  userId             String   @id @map("user_id")
  currentStreak      Int      @default(0) @map("current_streak")
  maxStreak          Int      @default(0) @map("max_streak")
  totalXp            Int      @default(0) @map("total_xp")
  lastActivityDate   DateTime? @map("last_activity_date") @db.Date
  achievements       Json     @default("[]")
  updatedAt          DateTime @updatedAt @map("updated_at")
  
  // Relations
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_stats")
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  topicId   String?  @map("topic_id")
  action    String
  details   Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic     Topic?   @relation(fields: [topicId], references: [id])
  
  @@map("activity_log")
}

enum Status {
  NOT_STARTED
  IN_PROGRESS
  COMPLETE
  SKIPPED
}
```

## API Implementation

### Authentication Service
```typescript
// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly SALT_ROUNDS = 12;

  async signup(email: string, password: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        salt,
      }
    });

    // Initialize user stats
    await prisma.userStats.create({
      data: {
        userId: user.id
      }
    });

    // Generate token
    const token = this.generateToken(user.id);
    
    return {
      user: { id: user.id, email: user.email },
      token
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const token = this.generateToken(user.id);
    
    return {
      user: { id: user.id, email: user.email },
      token
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string };
    } catch {
      throw new Error('Invalid token');
    }
  }
}
```

### Progress Service
```typescript
// src/services/progress.service.ts
import { PrismaClient, Status } from '@prisma/client';
import { addDays, differenceInDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class ProgressService {
  async getUserProgress(userId: string) {
    return await prisma.userProgress.findMany({
      where: { userId },
      include: {
        topic: true
      },
      orderBy: [
        { topic: { weekNumber: 'asc' } },
        { topic: { displayOrder: 'asc' } }
      ]
    });
  }

  async updateTopicStatus(userId: string, topicId: string, status: Status) {
    const today = startOfDay(new Date());
    
    // Get current progress
    const currentProgress = await prisma.userProgress.findUnique({
      where: { userId_topicId: { userId, topicId } }
    });

    if (!currentProgress) {
      throw new Error('Progress record not found');
    }

    // Calculate XP awards
    const xpFlags = currentProgress.xpFlags as any || {};
    let xpToAdd = 0;

    if (status === 'IN_PROGRESS' && !xpFlags.inProgress) {
      xpToAdd += 3; // XP_VALUES.IN_PROGRESS_AWARD
      xpFlags.inProgress = true;
    }

    if (status === 'COMPLETE' && !xpFlags.complete) {
      xpToAdd += 10; // XP_VALUES.COMPLETE_AWARD
      xpFlags.complete = true;
    }

    // Update progress
    const updatedProgress = await prisma.userProgress.update({
      where: { userId_topicId: { userId, topicId } },
      data: {
        status,
        lastTouched: today,
        xpFlags
      }
    });

    // Update user stats if XP was earned
    if (xpToAdd > 0) {
      await this.addXP(userId, xpToAdd);
      await this.updateStreak(userId);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        topicId,
        action: `status_changed_to_${status.toLowerCase()}`,
        details: { previousStatus: currentProgress.status, xpEarned: xpToAdd }
      }
    });

    return updatedProgress;
  }

  async addDailyNote(userId: string, topicId: string, date: Date, content: string) {
    return await prisma.dailyNote.upsert({
      where: {
        userId_topicId_noteDate: {
          userId,
          topicId,
          noteDate: startOfDay(date)
        }
      },
      update: { content },
      create: {
        userId,
        topicId,
        noteDate: startOfDay(date),
        content
      }
    });
  }

  private async addXP(userId: string, amount: number) {
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalXp: { increment: amount }
      }
    });
  }

  private async updateStreak(userId: string) {
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) return;

    const today = startOfDay(new Date());
    const lastActivity = userStats.lastActivityDate;

    let newStreak = userStats.currentStreak;

    if (!lastActivity) {
      // First activity
      newStreak = 1;
    } else {
      const daysSinceLastActivity = differenceInDays(today, lastActivity);
      
      if (daysSinceLastActivity === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysSinceLastActivity > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If daysSinceLastActivity === 0, it's the same day, no change
    }

    await prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        maxStreak: Math.max(newStreak, userStats.maxStreak),
        lastActivityDate: today
      }
    });
  }

  async getWeeklyStats(userId: string, weekNumber: number) {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        topic: { weekNumber }
      }
    });

    const total = progress.length;
    const completed = progress.filter(p => p.status === 'COMPLETE').length;
    const inProgress = progress.filter(p => p.status === 'IN_PROGRESS').length;
    const skipped = progress.filter(p => p.status === 'SKIPPED').length;

    return {
      weekNumber,
      total,
      completed,
      inProgress,
      skipped,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}
```

### API Routes
```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middleware/validation';

const router = Router();
const authService = new AuthService();

const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

router.post('/signup', validateRequest(signupSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.signup(email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export { router as authRoutes };
```

```typescript
// src/routes/progress.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { ProgressService } from '../services/progress.service';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const progressService = new ProgressService();

// All routes require authentication
router.use(authenticateToken);

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'SKIPPED'])
  })
});

const addNoteSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    content: z.string()
  })
});

router.get('/', async (req, res) => {
  try {
    const progress = await progressService.getUserProgress(req.user.userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:topicId/status', validateRequest(updateStatusSchema), async (req, res) => {
  try {
    const { topicId } = req.params;
    const { status } = req.body;
    const progress = await progressService.updateTopicStatus(
      req.user.userId,
      topicId,
      status
    );
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:topicId/notes', validateRequest(addNoteSchema), async (req, res) => {
  try {
    const { topicId } = req.params;
    const { date, content } = req.body;
    const note = await progressService.addDailyNote(
      req.user.userId,
      topicId,
      new Date(date),
      content
    );
    res.json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/week/:weekNumber/stats', async (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);
    const stats = await progressService.getWeeklyStats(req.user.userId, weekNumber);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as progressRoutes };
```

## Data Migration Script

### localStorage to PostgreSQL Migration
```typescript
// migration/migrate-localStorage.ts
import { PrismaClient, Status } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface LocalStorageBackup {
  version: number;
  exportedAt: string;
  userData: {
    email: string;
    password: string; // Plain text for migration only
    topics: any[];
    streak: string;
    lastActive?: string;
    xp: string;
    achievements: string;
  };
}

export async function migrateUserData(backup: LocalStorageBackup) {
  const { userData } = backup;
  
  // Create user account
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(userData.password, salt);
  
  const user = await prisma.user.create({
    data: {
      email: userData.email.toLowerCase(),
      passwordHash,
      salt,
      createdAt: new Date(backup.exportedAt)
    }
  });

  // Migrate progress data
  const topicsData = Array.isArray(userData.topics) 
    ? userData.topics 
    : JSON.parse(userData.topics || '[]');

  for (const topic of topicsData) {
    // Convert status format
    const statusMap: Record<string, Status> = {
      'not-started': 'NOT_STARTED',
      'in-progress': 'IN_PROGRESS',
      'complete': 'COMPLETE',
      'skipped': 'SKIPPED'
    };

    await prisma.userProgress.create({
      data: {
        userId: user.id,
        topicId: topic.id,
        status: statusMap[topic.status] || 'NOT_STARTED',
        lastTouched: topic.lastTouched ? new Date(topic.lastTouched) : null,
        xpFlags: topic.xpFlags || {}
      }
    });

    // Migrate daily notes
    if (topic.dailyNotes) {
      for (const [dateStr, content] of Object.entries(topic.dailyNotes)) {
        if (content && typeof content === 'string') {
          await prisma.dailyNote.create({
            data: {
              userId: user.id,
              topicId: topic.id,
              noteDate: new Date(dateStr),
              content: content as string
            }
          });
        }
      }
    }
  }

  // Migrate user stats
  const achievements = userData.achievements 
    ? JSON.parse(userData.achievements)
    : [];

  await prisma.userStats.create({
    data: {
      userId: user.id,
      currentStreak: parseInt(userData.streak || '0'),
      maxStreak: parseInt(userData.streak || '0'), // Approximate
      totalXp: parseInt(userData.xp || '0'),
      lastActivityDate: userData.lastActive ? new Date(userData.lastActive) : null,
      achievements
    }
  });

  return user;
}

// Batch migration for multiple users
export async function batchMigrateUsers(backups: LocalStorageBackup[]) {
  const results = [];
  
  for (const backup of backups) {
    try {
      const user = await migrateUserData(backup);
      results.push({ success: true, userId: user.id, email: user.email });
    } catch (error) {
      results.push({ 
        success: false, 
        email: backup.userData.email, 
        error: error.message 
      });
    }
  }
  
  return results;
}
```

## Frontend Integration

### API Client
```typescript
// src/services/apiClient.ts
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async signup(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Progress methods
  async getProgress() {
    return this.request<any[]>('/progress');
  }

  async updateTopicStatus(topicId: string, status: string) {
    return this.request(`/progress/${topicId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async addDailyNote(topicId: string, date: string, content: string) {
    return this.request(`/progress/${topicId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ date, content }),
    });
  }

  async getWeeklyStats(weekNumber: number) {
    return this.request(`/progress/week/${weekNumber}/stats`);
  }
}

export const apiClient = new ApiClient(
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
);
```

### Updated State Management
```typescript
// src/modules/apiState.ts - New API-based state management
import { apiClient } from '../services/apiClient';

interface ApiAppState {
  user: { id: string; email: string } | null;
  progress: any[];
  stats: any;
  loading: boolean;
  error: string | null;
}

class ApiStore {
  private state: ApiAppState = {
    user: null,
    progress: [],
    stats: null,
    loading: false,
    error: null
  };

  private listeners: Set<(state: ApiAppState) => void> = new Set();

  subscribe(listener: (state: ApiAppState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach(listener => listener(this.state));
  }

  async login(email: string, password: string) {
    try {
      this.state.loading = true;
      this.emit();

      const result = await apiClient.login(email, password);
      apiClient.setToken(result.token);
      
      this.state.user = result.user;
      this.state.loading = false;
      this.state.error = null;
      this.emit();

      // Load user data
      await this.loadProgress();
    } catch (error) {
      this.state.loading = false;
      this.state.error = error.message;
      this.emit();
    }
  }

  async loadProgress() {
    try {
      this.state.loading = true;
      this.emit();

      const progress = await apiClient.getProgress();
      this.state.progress = progress;
      this.state.loading = false;
      this.emit();
    } catch (error) {
      this.state.loading = false;
      this.state.error = error.message;
      this.emit();
    }
  }

  async updateTopicStatus(topicId: string, status: string) {
    try {
      await apiClient.updateTopicStatus(topicId, status);
      // Optimistic update
      this.state.progress = this.state.progress.map(p => 
        p.topicId === topicId ? { ...p, status } : p
      );
      this.emit();
    } catch (error) {
      this.state.error = error.message;
      this.emit();
      // Reload to get correct state
      await this.loadProgress();
    }
  }

  logout() {
    apiClient.clearToken();
    this.state.user = null;
    this.state.progress = [];
    this.state.stats = null;
    this.emit();
  }
}

export const apiStore = new ApiStore();
```

## Deployment Guide

### Environment Setup
```bash
# Backend environment variables
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="production"
PORT="3001"

# Frontend environment variables
REACT_APP_API_URL="https://your-backend-domain.com/api"
```

### Docker Setup
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY dist ./dist/

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
```

### Railway Deployment
```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm run start"

[environments.production.variables]
  NODE_ENV = "production"
```

This implementation guide provides a complete roadmap for migrating AlgoHabit from localStorage to PostgreSQL, maintaining the existing user experience while unlocking powerful new capabilities.