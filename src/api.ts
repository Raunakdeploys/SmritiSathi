import type { AppDatabase, UserProfile, CognitiveProgress, ActivityItem, GameInfo, FamilyFaceItem, RewardItem, CameraIdentifyResult } from './types';

export const api = {
  async identifyCameraImage(payload: {
    imageBase64: string;
    targetObject?: string;
    level?: number;
    mode?: 'challenge' | 'explore';
  }): Promise<{ success: boolean; result: CameraIdentifyResult }> {
    const res = await fetch('/api/gemini/identify-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getFullDatabase(): Promise<AppDatabase> {
    const res = await fetch('/api/data');
    const json = await res.json();
    return json.data;
  },

  async getUser(): Promise<UserProfile> {
    const res = await fetch('/api/user');
    const json = await res.json();
    return json.user;
  },

  async updateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    return json.user;
  },

  async getProgress(): Promise<CognitiveProgress> {
    const res = await fetch('/api/progress');
    const json = await res.json();
    return json.progress;
  },

  async updateProgress(progressData: Partial<CognitiveProgress>): Promise<CognitiveProgress> {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData),
    });
    const json = await res.json();
    return json.progress;
  },

  async getActivities(): Promise<ActivityItem[]> {
    const res = await fetch('/api/activities');
    const json = await res.json();
    return json.activities;
  },

  async logActivity(data: {
    title: string;
    category: string;
    points: number;
    icon: string;
    durationMinutes?: number;
    accuracy?: number;
    notes?: string;
  }): Promise<{ activity: ActivityItem; mindPoints: number; activities: ActivityItem[] }> {
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getGames(): Promise<GameInfo[]> {
    const res = await fetch('/api/games');
    const json = await res.json();
    return json.games;
  },

  async toggleFavoriteGame(gameId: string, isFavorite: boolean): Promise<GameInfo[]> {
    const res = await fetch('/api/games/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, isFavorite }),
    });
    const json = await res.json();
    return json.games;
  },

  async completeGame(payload: {
    gameId: string;
    score: number;
    pointsEarned: number;
    durationMinutes: number;
    accuracy: number;
    category: string;
    title?: string;
    playedLevel?: number;
  }): Promise<{
    success: boolean;
    mindPoints: number;
    progress: CognitiveProgress;
    activity: ActivityItem;
    games: GameInfo[];
    leveledUp?: boolean;
    newLevel?: number;
  }> {
    const res = await fetch('/api/games/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getFamilyFaces(): Promise<FamilyFaceItem[]> {
    const res = await fetch('/api/family-faces');
    const json = await res.json();
    return json.familyFaces;
  },

  async addFamilyFace(face: Omit<FamilyFaceItem, 'id'>): Promise<{ face: FamilyFaceItem; familyFaces: FamilyFaceItem[] }> {
    const res = await fetch('/api/family-faces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(face),
    });
    return res.json();
  },

  async deleteFamilyFace(id: string): Promise<FamilyFaceItem[]> {
    const res = await fetch(`/api/family-faces/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.familyFaces;
  },

  async getRealityQuests(): Promise<{ todayCompleted: boolean; completedDate: string | null; questions: any[] }> {
    const res = await fetch('/api/reality-quests');
    const json = await res.json();
    return json.realityQuests;
  },

  async completeRealityQuest(): Promise<{
    success: boolean;
    mindPoints: number;
    currentStreak: number;
    progress: CognitiveProgress;
    realityQuests: any;
    activity: ActivityItem;
  }> {
    const res = await fetch('/api/reality-quests/complete', {
      method: 'POST',
    });
    return res.json();
  },

  async getRewards(): Promise<{ rewards: RewardItem[]; mindPoints: number }> {
    const res = await fetch('/api/rewards');
    return res.json();
  },

  async redeemReward(rewardId: string): Promise<{
    success: boolean;
    reward: RewardItem;
    mindPoints: number;
    rewards: RewardItem[];
  }> {
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId }),
    });
    return res.json();
  },

  async resetDemo(): Promise<AppDatabase> {
    const res = await fetch('/api/reset', { method: 'POST' });
    const json = await res.json();
    return json.data;
  },
};
