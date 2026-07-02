import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../src/services/user/UserService.js';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = await userService.createUser(params);

      expect(user).toBeDefined();
      expect(user.id).toMatch(/^user_/);
      expect(user.email).toBe(params.email);
      expect(user.name).toBe(params.name);
      expect(user.role).toBe('user');
      expect(user).not.toHaveProperty('password');
    });

    it('should not create duplicate user', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await userService.createUser(params);

      await expect(userService.createUser(params)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await userService.createUser(params);

      const user = await userService.validateCredentials(
        params.email,
        params.password
      );

      expect(user).toBeDefined();
      expect(user?.email).toBe(params.email);
    });

    it('should return null for invalid credentials', async () => {
      const user = await userService.validateCredentials(
        'nonexistent@example.com',
        'password123'
      );

      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const created = await userService.createUser(params);
      const found = await userService.getUserById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent user', async () => {
      const found = await userService.getUserById('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const created = await userService.createUser(params);
      const updated = await userService.updateUser(created.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe(params.email);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const params = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const created = await userService.createUser(params);
      await userService.deleteUser(created.id);

      const found = await userService.getUserById(created.id);
      expect(found).toBeNull();
    });
  });
});
