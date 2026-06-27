# ARCHITECTURE.md — NeoProxy Lab01

## Visión General

NeoProxy Lab01 es una arquitectura basada en eventos y capacidades, diseñada para ser:

1. **Reemplazable**: Cualquier componente puede ser sustituido sin afectar el sistema
2. **Observable**: Todos los eventos son rastreables
3. **Escalable**: Puede crecer horizontalmente
4. **Tipada**: Todo el código está completamente tipado en TypeScript

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Dashboard)                      │
│  ┌─────────────┬──────────────┬──────────────┐              │
│  │   Modules   │ Runtime Graph│  Inspector   │              │
│  ├─────────────┼──────────────┼──────────────┤              │
│  │Event Stream │   Console    │   Metrics    │              │
│  └─────────────┴──────────────┴──────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Genesis Runtime)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Express Server                       │   │
│  │  GET /capabilities  POST /execute  GET /events ...   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 WebSocket Server                      │   │
│  │           Broadcast events to clients                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Registry   │   │ Event Bus   │   │  Resolver   │       │
│  │             │   │             │   │  (QWEN)     │       │
│  │ - register  │   │ - emit      │   │ - resolve   │       │
│  │ - resolve   │   │ - subscribe │   │ - execute   │       │
│  │ - getAll    │   │ - getStats  │   │ - score     │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ▼                                 │
│              ┌─────────────────────────┐                    │
│              │   Capability Providers   │                    │
│              │  (Mock → Real someday)   │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Ejecución

### 1. Registro de Capacidades

```typescript
// En registry.ts
registry.register({
  name: 'ai.generate.text',
  description: 'Generates text from prompt',
  providers: [
    { id: 'chatgpt', name: 'ChatGPT', health: 'healthy' },
    { id: 'qwen', name: 'Qwen', health: 'healthy' }
  ]
});
```

### 2. Resolución de Capacidad

```typescript
// Cliente solicita resolver capacidad
GET /resolve/ai.generate.text

// Resolver selecciona mejor provider
const result = resolver.resolve('ai.generate.text');
// → { capability, provider, score, latency }
```

### 3. Ejecución de Capacidad

```typescript
// Cliente solicita ejecutar capacidad
POST /execute
{
  "capability": "ai.generate.text",
  "input": { "prompt": "Hello" },
  "priority": "normal"
}

// Resolver ejecuta con fallback
const result = await resolver.execute(request);
// → { success, output, provider, latency }
```

### 4. Emisión de Eventos

```typescript
// Cada acción emite eventos
eventBus.emit({
  type: 'capability.executed',
  source: 'resolver',
  payload: { capability, provider, latency }
});

// WebSocket broadcast a todos los clientes
broadcast(event);
```

## Componentes Principales

### Backend

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| Server | `backend/server.ts` | HTTP + WebSocket server |
| Registry | `backend/genesis/registry.ts` | Capability registration |
| EventBus | `backend/genesis/eventBus.ts` | Event distribution |
| Resolver | `backend/genesis/resolver.ts` | Capability resolution (HOOK QWEN) |

### Frontend

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| Dashboard UI | `frontend/dashboard/index.html` | Visual layout |
| Dashboard Logic | `frontend/dashboard/app.js` | API calls + WebSocket |

## Patrones de Diseño

### 1. Singleton

Todos los componentes principales son singletons:

```typescript
export const registry = new CapabilityRegistry();
export const eventBus = new EventBusImpl();
export const resolver = new CapabilityResolverImpl();
```

### 2. Observer Pattern

El Event Bus implementa observer pattern:

```typescript
// Suscribirse
const unsubscribe = eventBus.subscribe('*', (event) => {
  console.log('Event:', event);
});

// Cancelar suscripción
unsubscribe();
```

### 3. Strategy Pattern

El Resolver usa strategy para seleccionar providers:

```typescript
// Estrategia actual: mock
private selectBestProvider(providers) {
  return providers[0]; // Simple mock
}

// Estrategia futura: scoring real
private selectBestProvider(providers) {
  return providers.sort((a, b) => {
    return this.calculateScore(b) - this.calculateScore(a);
  })[0];
}
```

### 4. Chain of Responsibility

Fallback chain para ejecución:

```typescript
async execute(capability, input) {
  for (const provider of providers) {
    try {
      return await provider.execute(input);
    } catch (error) {
      continue; // Try next provider
    }
  }
  throw new Error('All providers failed');
}
```

## Extension Points para Qwen

### 1. Implementar Scoring Real

Editar `backend/genesis/resolver.ts`:

```typescript
private calculateMockScore(provider): number {
  // TODO: Reemplazar con fórmula real
  // Factores: latencia, errorRate, load, reliability
}
```

### 2. Añadir Nuevos Providers

Crear `backend/providers/`:

```typescript
// backend/providers/ChatGPTProvider.ts
export class ChatGPTProvider implements ICapabilityProvider {
  async execute(input: any): Promise<any> {
    // Implementar llamada real a ChatGPT API
  }
}
```

### 3. Añadir Nuevas Capacidades

Registrar en `backend/genesis/registry.ts`:

```typescript
registry.register({
  name: 'new.domain.action',
  description: 'Description',
  providers: [...]
});
```

### 4. Middleware de Ejecución

Añadir hooks antes/después de ejecutar:

```typescript
async execute(request) {
  await this.beforeExecute(request);
  const result = await this.doExecute(request);
  await this.afterExecute(result);
  return result;
}
```

## Consideraciones de Performance

### 1. Event Bus

- Máximo 1000 eventos en memoria
- Auto-trim de eventos antiguos
- Suscriptores asíncronos

### 2. WebSocket

- Reconexión automática en frontend
- Broadcast solo a clientes conectados
- Manejo graceful de desconexiones

### 3. Resolver

- Cacheo de resoluciones frecuentes
- Scoring lazy (solo cuando se necesita)
- Ejecución asíncrona no bloqueante

## Seguridad (Futuro)

Actualmente no implementado. Para producción añadir:

1. Autenticación de clientes WebSocket
2. Rate limiting en APIs
3. Validación de inputs
4. Sanitización de outputs
5. Logging de auditoría

## Monitorización (Futuro)

Para producción añadir:

1. Métricas de Prometheus
2. Tracing distribuido (Jaeger)
3. Logs estructurados (Winston)
4. Health checks avanzados

---

**Nota**: Esta arquitectura está diseñada para evolucionar. Los HOOKs para Qwen permiten reemplazar componentes mock por implementaciones reales sin modificar la estructura general.
