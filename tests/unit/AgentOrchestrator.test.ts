import { describe, it, expect, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../../src/agents/AgentOrchestrator.js';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  describe('processRequest', () => {
    it('should process a travel request', async () => {
      const request = {
        query: 'Find hotels in Paris',
        context: {
          userId: 'user_test_123',
        },
        options: {
          parallel: true,
          timeout: 30000,
        },
      };

      const result = await orchestrator.processRequest(request);

      expect(result).toBeDefined();
      expect(result.requestId).toMatch(/^req_/);
      expect(result.status).toBe('completed');
      expect(result.results).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.agentsUsed).toBeInstanceOf(Array);
    });

    it('should handle timeout', async () => {
      const request = {
        query: 'Complex query',
        context: {
          userId: 'user_test_123',
        },
        options: {
          parallel: true,
          timeout: 1, // Very short timeout
        },
      };

      const result = await orchestrator.processRequest(request);

      expect(result).toBeDefined();
      expect(result.requestId).toMatch(/^req_/);
    });
  });

  describe('getStatus', () => {
    it('should return agent status', async () => {
      const status = await orchestrator.getStatus();

      expect(status).toBeInstanceOf(Array);
      expect(status.length).toBeGreaterThan(0);
      expect(status[0]).toHaveProperty('name');
      expect(status[0]).toHaveProperty('status');
      expect(status[0]).toHaveProperty('taskCount');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      const metrics = await orchestrator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalAgents).toBeGreaterThan(0);
      expect(metrics.idleAgents).toBeDefined();
      expect(metrics.busyAgents).toBeDefined();
      expect(metrics.totalTasks).toBeDefined();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', async () => {
      const request = {
        query: 'Test query',
        context: {
          userId: 'user_test_123',
        },
      };

      // Start processing (don't await)
      const resultPromise = orchestrator.processRequest(request);
      
      // Get the request ID from the promise
      const result = await resultPromise;
      
      const cancelResult = await orchestrator.cancelTask(result.requestId);

      expect(cancelResult).toBeDefined();
      expect(cancelResult.success).toBeDefined();
    });
  });
});
