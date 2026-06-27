/**
 * Capability Registry
 * 
 * Central registry for all capabilities in the NeoProxy system.
 * Follows the CAPABILITIES.md specification.
 * 
 * A capability is identified by: domain.action.object
 * Example: ai.generate.text, memory.store.context
 */

export interface CapabilityProvider {
  id: string;
  name: string;
  health: 'healthy' | 'degraded' | 'offline';
  latency: number;
  errorRate: number;
}

export interface CapabilityDescriptor {
  name: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  constraints: Record<string, any>;
  providers: CapabilityProvider[];
  version: string;
}

export interface CapabilityRegistryData {
  [capabilityName: string]: CapabilityDescriptor;
}

class CapabilityRegistry {
  private capabilities: CapabilityRegistryData = {};

  /**
   * Register a new capability with its providers
   */
  register(descriptor: CapabilityDescriptor): void {
    if (!this.isValidCapabilityName(descriptor.name)) {
      throw new Error(`Invalid capability name: ${descriptor.name}. Must follow domain.action.object format.`);
    }

    if (this.capabilities[descriptor.name]) {
      console.warn(`Capability ${descriptor.name} already registered. Updating...`);
    }

    this.capabilities[descriptor.name] = descriptor;
    console.log(`[Registry] Registered capability: ${descriptor.name}`);
  }

  /**
   * Get all registered capabilities
   */
  getAll(): CapabilityRegistryData {
    return { ...this.capabilities };
  }

  /**
   * Get a specific capability by name
   */
  get(capabilityName: string): CapabilityDescriptor | undefined {
    return this.capabilities[capabilityName];
  }

  /**
   * Resolve a capability to find available providers
   * This is the entry point for the Resolver system
   */
  resolve(capabilityName: string): CapabilityDescriptor | null {
    const capability = this.capabilities[capabilityName];
    if (!capability) {
      return null;
    }

    // Filter only healthy providers
    const availableProviders = capability.providers.filter(
      p => p.health === 'healthy' || p.health === 'degraded'
    );

    if (availableProviders.length === 0) {
      return null;
    }

    return {
      ...capability,
      providers: availableProviders
    };
  }

  /**
   * Validate capability name follows domain.action.object format
   */
  private isValidCapabilityName(name: string): boolean {
    const parts = name.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [domain, action, object] = parts;
    return domain.length > 0 && action.length > 0 && object.length > 0;
  }

  /**
   * Update provider health status
   */
  updateProviderHealth(capabilityName: string, providerId: string, health: 'healthy' | 'degraded' | 'offline'): void {
    const capability = this.capabilities[capabilityName];
    if (!capability) {
      return;
    }

    const provider = capability.providers.find(p => p.id === providerId);
    if (provider) {
      provider.health = health;
      console.log(`[Registry] Updated provider ${providerId} health to ${health}`);
    }
  }
}

// Export singleton instance
export const registry = new CapabilityRegistry();

// Register initial mock capabilities
registry.register({
  name: 'ai.generate.text',
  description: 'Generates natural language text from prompt and context.',
  input: {
    prompt: 'string',
    context: 'optional object'
  },
  output: {
    text: 'string'
  },
  constraints: {
    latency: '< 2s (soft)',
    deterministicMode: 'optional'
  },
  providers: [
    { id: 'chatgpt', name: 'ChatGPT', health: 'healthy', latency: 150, errorRate: 0.01 },
    { id: 'qwen', name: 'Qwen', health: 'healthy', latency: 180, errorRate: 0.02 }
  ],
  version: '1.0.0'
});

registry.register({
  name: 'memory.store.context',
  description: 'Stores context data in NeoMemory for later retrieval.',
  input: {
    context: 'object',
    ttl: 'optional number'
  },
  output: {
    id: 'string',
    stored: 'boolean'
  },
  constraints: {
    latency: '< 50ms',
    maxSize: '10MB per context'
  },
  providers: [
    { id: 'neomemory', name: 'NeoMemory', health: 'healthy', latency: 25, errorRate: 0.001 }
  ],
  version: '1.0.0'
});

registry.register({
  name: 'fabrication.generate.mesh',
  description: 'Generates a 3D mesh model for fabrication.',
  input: {
    design: 'object',
    resolution: 'string'
  },
  output: {
    meshId: 'string',
    vertices: 'number'
  },
  constraints: {
    latency: '< 1s',
    maxVertices: '1M'
  },
  providers: [
    { id: 'fabricator', name: 'Fabricator', health: 'healthy', latency: 150, errorRate: 0.03 }
  ],
  version: '1.0.0'
});

registry.register({
  name: 'fabrication.print.job',
  description: 'Sends a 3D model to the printer for fabrication.',
  input: {
    model: 'STL or OBJ file',
    material: 'string',
    resolution: 'string'
  },
  output: {
    jobId: 'string',
    estimatedTime: 'number'
  },
  constraints: {
    latency: '< 5s',
    maxFileSize: '100MB'
  },
  providers: [
    { id: 'printer_agent', name: 'PrinterAgent', health: 'healthy', latency: 200, errorRate: 0.05 }
  ],
  version: '1.0.0'
});

console.log('[Registry] Initialized with mock capabilities');
