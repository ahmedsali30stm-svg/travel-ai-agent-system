import { logger } from '../utils/logger.js';

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'agent' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserParams {
  email: string;
  password: string;
  name: string;
}

export class UserService {
  private users = new Map<string, User>();

  async createUser(params: CreateUserParams): Promise<Omit<User, 'password'>> {
    // Check if user exists
    const existingUser = Array.from(this.users.values()).find(
      u => u.email === params.email
    );

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password (simplified - use bcrypt in production)
    const hashedPassword = await this.hashPassword(params.password);

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    
    logger.info({ userId: user.id, email: user.email }, 'User created');
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateCredentials(
    email: string,
    password: string
  ): Promise<Omit<User, 'password'> | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);

    if (!user) {
      return null;
    }

    const isValid = await this.comparePasswords(password, user.password);

    if (!isValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = this.users.get(id);
    
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Omit<User, 'password'>> {
    const user = this.users.get(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    
    logger.info({ userId: id }, 'User updated');
    
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    this.users.delete(id);
    
    logger.info({ userId: id }, 'User deleted');
  }

  private async hashPassword(password: string): Promise<string> {
    // Simplified hash - use bcrypt in production
    return `hashed_${password}`;
  }

  private async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    // Simplified comparison - use bcrypt in production
    return hashedPassword === `hashed_${password}`;
  }
}
