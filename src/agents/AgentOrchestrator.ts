import { logger } from '../utils/logger.js';

interface AgentRequest {
  query: string;
  context: {
    userId: string;
    tripId?: string;
    preferences?: Record<string, any>;
  };
  agents?: string[];
  options?: {
    parallel?: boolean;
    timeout?: number;
  };
}

interface AgentResponse {
  requestId: string;
  status: 'completed' | 'failed' | 'timeout';
  results: Record<string, any>;
  metadata: {
    agentsUsed: string[];
    duration: number;
    tokensUsed: number;
  };
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'busy' | 'error';
  lastActive: Date | null;
  taskCount: number;
  errorCount: number;
}

export class AgentOrchestrator {
  private agents = new Map<string, AgentStatus>();
  private tasks = new Map<string, { status: string; startTime: number; tokensUsed: number }>();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agentNames = [
      'supervisor',
      'planner',
      'hotel',
      'flight',
      'activities',
      'transportation',
      'visa',
      'weather',
      'currency',
      'price-intelligence',
      'validation',
      'qa',
      'html-renderer',
      'pdf-generator',
      'image-collector',
      'seo-content',
      'research',
      'memory',
      'logging',
      'error-recovery',
    ];

    for (const name of agentNames) {
      this.agents.set(name, {
        name,
        status: 'idle',
        lastActive: null,
        taskCount: 0,
        errorCount: 0,
      });
    }
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info({
      requestId,
      query: request.query,
      userId: request.context.userId,
    }, 'Processing agent request');

    // Determine which agents to use
    const agentsToUse = request.agents || this.selectAgents(request.query);
    
    // Update agent status
    for (const agentName of agentsToUse) {
      const agent = this.agents.get(agentName);
      if (agent) {
        agent.status = 'busy';
        agent.lastActive = new Date();
      }
    }

    // Track task
    this.tasks.set(requestId, { status: 'running', startTime, tokensUsed: 0 });

    try {
      const results: Record<string, any> = {};
      
      if (request.options?.parallel) {
        // Run agents in parallel
        const promises = agentsToUse.map(agentName => 
          this.executeAgent(agentName, request)
        );
        
        const agentResults = await Promise.allSettled(promises);
        
        for (let i = 0; i < agentsToUse.length; i++) {
          const result = agentResults[i];
          const agentName = agentsToUse[i];
          
          if (result.status === 'fulfilled') {
            results[agentName] = result.value;
          } else {
            results[agentName] = { error: result.reason };
          }
        }
      } else {
        // Run agents sequentially
        for (const agentName of agentsToUse) {
          try {
            results[agentName] = await this.executeAgent(agentName, request);
          } catch (error) {
            results[agentName] = { error: error instanceof Error ? error.message : String(error) };
          }
        }
      }

      const duration = Date.now() - startTime;
      
      // Update task status
      const completedTask = this.tasks.get(requestId);
      this.tasks.set(requestId, { ...completedTask!, status: 'completed', startTime });
      
      // Reset agent status
      for (const agentName of agentsToUse) {
        const agent = this.agents.get(agentName);
        if (agent) {
          agent.status = 'idle';
          agent.taskCount++;
        }
      }

      logger.info({
        requestId,
        agentsUsed: agentsToUse,
        duration,
      }, 'Request completed');

      return {
        requestId,
        status: 'completed',
        results,
        metadata: {
          agentsUsed: agentsToUse,
          duration,
          tokensUsed: completedTask?.tokensUsed || 0,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update task status
      this.tasks.set(requestId, { status: 'failed', startTime, tokensUsed: 0 });
      
      // Reset agent status and increment error count
      for (const agentName of agentsToUse) {
        const agent = this.agents.get(agentName);
        if (agent) {
          agent.status = 'idle';
          agent.errorCount++;
        }
      }

      logger.error({
        requestId,
        error,
        duration,
      }, 'Request failed');

      return {
        requestId,
        status: 'failed',
        results: {},
        metadata: {
          agentsUsed: agentsToUse,
          duration,
          tokensUsed: 0,
        },
      };
    }
  }

  private selectAgents(query: string): string[] {
    // Simple agent selection based on query keywords
    const agents = ['supervisor'];
    
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('hotel') || queryLower.includes('stay')) {
      agents.push('hotel');
    }
    
    if (queryLower.includes('flight') || queryLower.includes('fly')) {
      agents.push('flight');
    }
    
    if (queryLower.includes('activity') || queryLower.includes('tour')) {
      agents.push('activities');
    }
    
    if (queryLower.includes('weather')) {
      agents.push('weather');
    }
    
    if (queryLower.includes('price') || queryLower.includes('cost')) {
      agents.push('price-intelligence');
    }
    
    // Always include planner and validation
    agents.push('planner', 'validation');
    
    return [...new Set(agents)];
  }

  private async executeAgent(
    agentName: string,
    request: AgentRequest
  ): Promise<any> {
    logger.info({ agentName, requestId: request.query }, 'Executing agent');
    
    // Simulate agent execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock response based on agent type
    switch (agentName) {
      case 'hotel':
        return {
          type: 'hotel',
          results: [
            {
              id: 'hotel_1',
              name: 'Grand Hotel',
              price: 150,
              currency: 'USD',
              rating: 4.5,
            },
          ],
        };
      
      case 'flight':
        return {
          type: 'flight',
          results: [
            {
              id: 'flight_1',
              airline: 'Air Travel',
              price: 500,
              currency: 'USD',
              duration: '2h 30m',
            },
          ],
        };
      
      case 'weather':
        return {
          type: 'weather',
          forecast: {
            temperature: 25,
            condition: 'sunny',
            humidity: 60,
          },
        };
      
      default:
        return { type: agentName, status: 'completed' };
    }
  }

  async getStatus(): Promise<AgentStatus[]> {
    return Array.from(this.agents.values());
  }

  async getMetrics(): Promise<any> {
    const agents = Array.from(this.agents.values());
    
    return {
      totalAgents: agents.length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalTasks: agents.reduce((sum, a) => sum + a.taskCount, 0),
      totalErrors: agents.reduce((sum, a) => sum + a.errorCount, 0),
    };
  }

  async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    if (task.status === 'completed') {
      return { success: false, message: 'Task already completed' };
    }

    this.tasks.set(taskId, { ...task, status: 'cancelled' });
    
    logger.info({ taskId }, 'Task cancelled');
    
    return { success: true, message: 'Task cancelled successfully' };
  }
}
