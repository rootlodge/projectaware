import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from '@/lib/database/manager';
import { AuthUtils } from '@/lib/auth/utils';
import { 
  User, 
  SignUpRequest, 
  SignInRequest, 
  AuthResponse, 
  UserSession,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserActivity 
} from '@/lib/types/auth';

export class UserService {
  private db = DatabaseManager.getInstance();

  // User Registration
  async signUp(request: SignUpRequest): Promise<AuthResponse> {
    try {
      await this.db.connect();

      // Validate input
      if (!AuthUtils.isValidEmail(request.email)) {
        return { success: false, error: 'Invalid email address' };
      }

      const passwordValidation = AuthUtils.validatePassword(request.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      if (request.username) {
        const usernameValidation = AuthUtils.validateUsername(request.username);
        if (!usernameValidation.isValid) {
          return { success: false, error: usernameValidation.errors.join(', ') };
        }
      }

      // Check if user already exists
      const existingUser = this.db.prepare('SELECT id FROM users WHERE email = ? OR username = ?')
        .get(request.email, request.username) as { id: string } | undefined;

      if (existingUser) {
        return { success: false, error: 'User already exists with this email or username' };
      }

      // Create new user
      const userId = uuidv4();
      const passwordHash = await AuthUtils.hashPassword(request.password);
      const now = new Date().toISOString();

      const user: Omit<User, 'created_at' | 'updated_at'> = {
        id: userId,
        email: request.email,
        username: request.username,
        password_hash: passwordHash,
        full_name: request.full_name,
        avatar_url: request.full_name ? AuthUtils.generateAvatarUrl(request.full_name) : undefined,
        email_verified: true, // Temporarily disable email verification - set to true
        phone_verified: false,
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        status: 'active', // Set to active since email verification is disabled
        role: 'user',
        privacy_consent: request.privacy_consent,
        marketing_consent: request.marketing_consent || false,
        data_retention_days: 365
      };

      this.db.prepare(`
        INSERT INTO users (
          id, email, username, password_hash, full_name, avatar_url,
          email_verified, phone_verified, theme, language, timezone,
          status, role, privacy_consent, marketing_consent, data_retention_days,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id, user.email, user.username, user.password_hash, user.full_name, user.avatar_url,
        user.email_verified ? 1 : 0, user.phone_verified ? 1 : 0, user.theme, user.language, user.timezone,
        user.status, user.role, user.privacy_consent ? 1 : 0, user.marketing_consent ? 1 : 0, user.data_retention_days,
        now, now
      );

      // Log user activity
      await this.logActivity(userId, 'user_registered', { email: request.email });

      // Generate email verification token (DISABLED for now)
      // const verificationToken = await this.generateEmailVerificationToken(userId, request.email);

      const { password_hash, ...userWithoutPassword } = { ...user, created_at: now, updated_at: now };
      
      return {
        success: true,
        user: userWithoutPassword,
        requires_verification: true
      };

    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  // User Sign In
  async signIn(request: SignInRequest): Promise<AuthResponse> {
    try {
      await this.db.connect();

      // Find user by email
      const user = this.db.prepare(`
        SELECT * FROM users WHERE email = ? AND status != 'suspended'
      `).get(request.email) as User | undefined;

      if (!user || !user.password_hash) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await AuthUtils.verifyPassword(request.password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if email is verified (DISABLED for now)
      // if (!user.email_verified) {
      //   return { 
      //     success: false, 
      //     error: 'Please verify your email address before signing in',
      //     requires_verification: true 
      //   };
      // }

      // Update last login
      this.db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .run(new Date().toISOString(), user.id);

      // Generate tokens
      const accessToken = AuthUtils.generateAccessToken(user);
      const refreshToken = AuthUtils.generateRefreshToken(user.id);

      // Create session
      await this.createSession(user.id, accessToken, request);

      // Log activity
      await this.logActivity(user.id, 'user_signed_in');

      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + AuthUtils.parseTimeToSeconds('1h') * 1000).toISOString()
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Sign in failed. Please try again.' };
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      await this.db.connect();
      
      const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.connect();

      // Validate username if provided
      if (updates.username) {
        const usernameValidation = AuthUtils.validateUsername(updates.username);
        if (!usernameValidation.isValid) {
          return { success: false, error: usernameValidation.errors.join(', ') };
        }

        // Check if username is already taken
        const existingUser = this.db.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
          .get(updates.username, userId) as { id: string } | undefined;
        
        if (existingUser) {
          return { success: false, error: 'Username is already taken' };
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(userId);

      this.db.prepare(`
        UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
      `).run(...updateValues);

      await this.logActivity(userId, 'profile_updated', { fields: Object.keys(updates) });

      return { success: true };

    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  // Change password
  async changePassword(userId: string, request: ChangePasswordRequest): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.connect();

      // Get current user
      const user = this.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await AuthUtils.verifyPassword(request.current_password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      const passwordValidation = AuthUtils.validatePassword(request.new_password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Hash new password
      const newPasswordHash = await AuthUtils.hashPassword(request.new_password);

      // Update password
      this.db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
        .run(newPasswordHash, new Date().toISOString(), userId);

      // Invalidate all sessions
      this.db.prepare('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?').run(userId);

      await this.logActivity(userId, 'password_changed');

      return { success: true };

    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  // Create user session
  private async createSession(userId: string, token: string, request: SignInRequest & { ip?: string; userAgent?: string }): Promise<void> {
    const sessionId = uuidv4();
    const tokenHash = AuthUtils.hashToken(token);
    const expiresAt = AuthUtils.generateExpirationDate(request.remember_me ? 24 * 7 : 24); // 7 days or 1 day

    this.db.prepare(`
      INSERT INTO user_sessions (
        id, user_id, token_hash, device_info, ip_address, user_agent, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId, userId, tokenHash, 
      request.userAgent ? AuthUtils.parseUserAgent(request.userAgent) : null,
      request.ip, request.userAgent, expiresAt.toISOString()
    );
  }

  // Generate email verification token
  private async generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    const token = AuthUtils.generateSecureToken();
    const tokenHash = AuthUtils.hashToken(token);
    const expiresAt = AuthUtils.generateExpirationDate(24); // 24 hours

    this.db.prepare(`
      INSERT INTO email_verification_tokens (id, user_id, token_hash, email, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, tokenHash, email, expiresAt.toISOString());

    return token;
  }

  // Log user activity
  private async logActivity(userId: string, action: string, details?: any, request?: { ip?: string; userAgent?: string }): Promise<void> {
    this.db.prepare(`
      INSERT INTO user_activity (id, user_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, action, 
      details ? JSON.stringify(details) : null,
      request?.ip, request?.userAgent
    );
  }

  // Verify email token
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.connect();

      // Find verification token
      const verification = this.db.prepare(`
        SELECT * FROM email_verification_tokens 
        WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')
      `).get(AuthUtils.hashToken(token)) as any;

      if (!verification) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Mark user as verified
      this.db.transaction((db) => {
        db.prepare('UPDATE users SET email_verified = 1, status = ? WHERE id = ?')
          .run('active', verification.user_id);
        
        db.prepare('UPDATE email_verification_tokens SET used = 1 WHERE id = ?')
          .run(verification.id);
      });

      await this.logActivity(verification.user_id, 'email_verified');

      return { success: true };

    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Email verification failed' };
    }
  }
}
