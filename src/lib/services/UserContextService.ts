import { MemorySystem } from '@/lib/core/memory';

export interface UserContext {
  id?: string;
  username: string;
  display_name: string;
  email?: string;
  isAuthenticated: boolean;
  preferences?: Record<string, any>;
}

class UserContextService {
  private static instance: UserContextService;
  private currentUser: UserContext | null = null;
  private memory: MemorySystem;

  constructor() {
    this.memory = new MemorySystem();
  }

  static getInstance(): UserContextService {
    if (!UserContextService.instance) {
      UserContextService.instance = new UserContextService();
    }
    return UserContextService.instance;
  }

  async loadUserContext(sessionUser?: any): Promise<UserContext> {
    try {
      if (sessionUser) {
        // User is authenticated - load from database
        const profile = await this.memory.getUserProfile(sessionUser.id);
        if (profile) {
          this.currentUser = {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            email: profile.email,
            isAuthenticated: true,
            preferences: await this.getUserPreferences(profile.id!),
          };
        } else {
          // Fallback for authenticated user without profile
          this.currentUser = {
            id: sessionUser.id,
            username: sessionUser.name || sessionUser.email?.split('@')[0] || 'user',
            display_name: sessionUser.name || 'User',
            email: sessionUser.email,
            isAuthenticated: true,
          };
        }
      } else {
        // Local mode - check for existing local user or create default
        const localUser = await this.getOrCreateLocalUser();
        this.currentUser = {
          id: localUser.id,
          username: localUser.username,
          display_name: localUser.display_name,
          email: localUser.email,
          isAuthenticated: false,
          preferences: await this.getUserPreferences(localUser.id!),
        };
      }

      return this.currentUser;
    } catch (error) {
      console.error('Failed to load user context:', error);
      // Fallback to default user
      this.currentUser = {
        username: 'user',
        display_name: 'User',
        isAuthenticated: false,
      };
      return this.currentUser;
    }
  }

  private async getOrCreateLocalUser() {
    try {
      // For local mode, try to get profile by username 'user' first
      let profile = await this.memory.getUserProfileByUsername('user');
      
      if (!profile) {
        // Create default local user profile
        const userId = await this.memory.createUserProfile({
          username: 'user',
          display_name: 'User',
          bio: 'Local user profile',
          onboarding_completed: false,
        });

        profile = await this.memory.getUserProfile(userId);
      }

      return profile;
    } catch (error) {
      console.error('Failed to get or create local user:', error);
      throw error;
    }
  }

  private async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const preferences = await this.memory.getUserPreferences(userId);
      const prefMap: Record<string, any> = {};
      
      preferences.forEach(pref => {
        if (!prefMap[pref.category]) {
          prefMap[pref.category] = {};
        }
        prefMap[pref.category][pref.preference_key] = pref.preference_value;
      });

      return prefMap;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return {};
    }
  }

  getCurrentUser(): UserContext | null {
    return this.currentUser;
  }

  getUserName(): string {
    return this.currentUser?.display_name || this.currentUser?.username || 'User';
  }

  getUserNameForReference(): string {
    return this.currentUser?.username || 'user';
  }

  isAuthenticated(): boolean {
    return this.currentUser?.isAuthenticated || false;
  }

  async updateUserPreference(category: string, key: string, value: any): Promise<void> {
    if (!this.currentUser?.id) return;
    
    try {
      await this.memory.saveUserPreference(this.currentUser.id, category, key, value);
      
      // Update local cache
      if (!this.currentUser.preferences) {
        this.currentUser.preferences = {};
      }
      if (!this.currentUser.preferences[category]) {
        this.currentUser.preferences[category] = {};
      }
      this.currentUser.preferences[category][key] = value;
    } catch (error) {
      console.error('Failed to update user preference:', error);
    }
  }

  clearUserContext(): void {
    this.currentUser = null;
  }
}

export const userContextService = UserContextService.getInstance();
