# NeoProxy Lab01 - Genesis Console v0.1

## Overview

NeoProxy Lab01 es el primer prototipo del **NeoProxy Runtime**. No es un dashboard, es el sistema operativo de un laboratorio de IA, fabricación digital y robótica.

## Arquitectura Basada en Capacidades

Este sistema sigue la especificación de [CAPABILITIES.md](./docs/CAPABILITIES.md). El sistema no pregunta "¿qué módulo existe?", sino "¿quién puede hacer esto?".

### Estructura del Proyecto

```
lab01/
├── backend/
│   ├── server.ts              # Servidor principal (Express + WebSocket)
│   └── genesis/
│       ├── registry.ts        # Capability Registry
│       ├── eventBus.ts        # Event Bus central
│       └── resolver.ts        # Capability Resolver (HOOK para Qwen)
├── frontend/
│   └── dashboard/
│       ├── index.html         # UI del Genesis Console
│       └── app.js             # Lógica del frontend
├── docs/
│   ├── CAPABILITIES.md        # Especificación de capacidades
│   ├── ARCHITECTURE.md        # Documentación de arquitectura
│   └── README.md              # Este archivo
├── docker-compose.yml         # Configuración Docker
├── Dockerfile                 # Imagen Docker
├── package.json               # Dependencias
└── tsconfig.json              # Configuración TypeScript
```

## Componentes del Runtime

### 1. Capability Registry (`backend/genesis/registry.ts`)

Registro central de todas las capacidades del sistema. Cada capacidad sigue el formato:

```
domain.action.object
```

Ejemplos:
- `ai.generate.text`
- `memory.store.context`
- `fabrication.print`

### 2. Event Bus (`backend/genesis/eventBus.ts`)

Sistema central de eventos. Todos los eventos fluyen a través de este bus y pueden ser observados por cualquier componente.

### 3. Capability Resolver (`backend/genesis/resolver.ts`)

**HOOK PARA QWEN**: Este es el componente que debes implementar con lógica real:

- Scoring de providers
- Selección basada en latencia, carga, confiabilidad
- Fallback chain management
- Execution layer

Actualmente es un placeholder con datos mock.

### 4. Server (`backend/server.ts`)

Servidor HTTP + WebSocket que proporciona:
- REST API para capacidades y eventos
- WebSocket para actualizaciones en tiempo real
- Endpoints de health monitoring

## APIs Disponibles

### REST

```bash
# Obtener todas las capacidades
GET /capabilities

# Obtener una capacidad específica
GET /capabilities/:name

# Obtener eventos recientes
GET /events

# Obtener estadísticas de eventos
GET /events/stats

# Emitir un evento
POST /event
Body: { type, source, payload, capability }

# Resolver una capacidad
GET /resolve/:capability

# Ejecutar una capacidad
POST /execute
Body: { capability, input, priority }

# Health check
GET /health

# Estado completo del sistema
GET /status
```

### WebSocket

Conectar a `ws://localhost:3000` para recibir eventos en tiempo real.

## Instalación y Ejecución

### Opción 1: Docker (Recomendado)

```bash
# Construir y ejecutar
docker-compose up --build

# El servidor estará disponible en http://localhost:3000
# El dashboard se puede abrir directamente desde frontend/dashboard/index.html
```

### Opción 2: Local con Node.js

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# O ejecutar directamente
npx ts-node backend/server.ts
```

### Abrir el Dashboard

El dashboard es un archivo HTML estático. Puedes:

1. Abrirlo directamente en tu navegador:
   ```
   file:///path/to/lab01/frontend/dashboard/index.html
   ```

2. O servirlo con un servidor estático:
   ```bash
   npx serve frontend/dashboard
   ```

## Comandos de la Consola

La consola integrada acepta los siguientes comandos:

- `help` - Mostrar ayuda
- `status` - Estado del sistema
- `modules` - Listar módulos
- `events` - Contador de eventos
- `clear` - Limpiar consola
- `restart memory` - Reiniciar módulo MEMORY
- `restart ai` - Reiniciar módulo AI
- `inspect genesis` - Inspeccionar nodo GENESIS

## HOOKs para Qwen

Este proyecto está diseñado para que Qwen implemente la lógica real sin modificar la arquitectura:

### 1. Implementar Resolver Real

Editar `backend/genesis/resolver.ts`:

```typescript
// Reemplazar selectBestProvider con scoring real
private selectBestProvider(providers: CapabilityProvider[]): CapabilityProvider | null {
  // TODO: Implementar algoritmo de scoring real
}

// Reemplazar execute con ejecución real
async execute(request: ExecutionRequest): Promise<ExecutionResult> {
  // TODO: Implementar ejecución real de capacidades
}
```

### 2. Conectar Providers Reales

Editar `backend/genesis/registry.ts` para registrar providers reales:

```typescript
registry.register({
  name: 'ai.generate.text',
  providers: [
    { id: 'chatgpt-real', name: 'ChatGPT', /* ... */ },
    { id: 'qwen-real', name: 'Qwen', /* ... */ }
  ]
});
```

### 3. Implementar Execution Layer

Crear nueva carpeta `backend/execution/` con:

```
backend/execution/
├── ChatGPTProvider.ts
├── QwenProvider.ts
├── MemoryProvider.ts
└── index.ts
```

## Principios de Diseño

1. **Capabilities sobre Módulos**: El sistema se organiza por capacidades ejecutables, no por módulos estáticos.

2. **Reemplazable**: Todo está diseñado para ser reemplazado. El MockGenesisRuntime puede sustituirse por SSEGenesisRuntime o PythonGenesisRuntime sin tocar la UI.

3. **Observabilidad**: Todos los eventos son rastreables a través del Event Bus.

4. **Fallback System**: Las capacidades tienen soporte nativo para fallback chains.

5. **Tipado Estricto**: Todo el código TypeScript está completamente tipado, sin `any`.

## Siguientes Pasos

1. **Lab 0.2**: Implementar resolver real con scoring
2. **Lab 0.3**: Conectar providers reales (AI, Memory, etc.)
3. **Lab 0.4**: Implementar ejecución asíncrona con colas
4. **Lab 0.5**: Añadir persistencia y estado distribuido

## Filosofía

> NeoProxy no es un sistema de módulos.
> NeoProxy es un **grafo vivo de capacidades ejecutables**.
> 
> Los módulos son intercambiables.
> Las capacidades son la verdad del sistema.

---

**Estado**: MVP funcional con datos mock  
**Próximo hito**: Implementación real del resolver por Qwen
