# CAPABILITIES.md — NeoProxy Lab01

## 1. Definición

NeoProxy no está organizado por módulos.

Está organizado por **capacidades ejecutables**.

Una capacidad es una unidad mínima de habilidad del sistema que puede ser:

* provista por un módulo
* compuesta por varios módulos
* reemplazada sin romper el sistema
* descubierta dinámicamente por el runtime

---

## 2. Principio central

> El sistema no pregunta "¿qué módulo existe?"
>
> El sistema pregunta "¿quién puede hacer esto?"

---

## 3. Estructura de una capacidad

Toda capacidad sigue este formato:

```
domain.action.object
```

Ejemplos:

```
ai.generate.text
ai.generate.image
memory.store.context
memory.retrieve.context
fabrication.export.stl
fabrication.print
system.monitor.health
```

---

## 4. Reglas de naming (OBLIGATORIAS)

### 4.1 No sinónimos

❌ generate_mesh
❌ create_model
❌ build_3d

✔ fabrication.generate.mesh

---

### 4.2 Jerarquía fija

* domain (ai, memory, fabrication, system)
* action (generate, store, retrieve, export, analyze)
* object (text, image, stl, context)

---

### 4.3 Prohibido inventar nuevas raíces sin registro

Solo se permiten nuevos domains si se documentan en CAPABILITIES.md.

---

## 5. Capability Descriptor

Cada capacidad debe declararse así:

```yaml
Capability: ai.generate.text

Description:
Generates natural language text from prompt and context.

Input:
- prompt: string
- context: optional object

Output:
- text: string

Constraints:
- latency < 2s (soft)
- deterministic mode optional

Providers:
- ChatGPT
- Qwen
```

---

## 6. Capability Registry

El sistema mantiene un registro global:

```typescript
CapabilityRegistry = {
  "ai.generate.text": [ChatGPT, Qwen],
  "memory.retrieve.context": [NeoMemory],
  "fabrication.print": [PrinterAgent]
}
```

---

## 7. Capability Resolution

Cuando el runtime necesita ejecutar algo:

### Paso 1 — Query

```typescript
resolve("ai.generate.text")
```

### Paso 2 — Match providers

Se listan todos los agentes capaces.

### Paso 3 — Scoring

Se selecciona el mejor candidato según:

* latencia
* carga
* prioridad del sistema
* confiabilidad
* contexto

---

## 8. Fallback System

Si una capacidad falla:

```
primary → fallback → fallback → error event
```

Ejemplo:

```
ChatGPT (fail)
→ Qwen
→ Local Model
→ runtime.error
```

---

## 9. Capability Composition

El runtime puede combinar capacidades:

Ejemplo:

```
ai.generate.image
+
fabrication.export.stl
=
ai.generate.printable_model
```

Esto es permitido SOLO si se declara explícitamente.

---

## 10. Dynamic Capabilities

Los módulos pueden anunciar capacidades en runtime:

```typescript
module.loaded → emits capabilities()
```

Ejemplo:

```typescript
PrinterModule:
- fabrication.print
- fabrication.status
```

---

## 11. Capability vs Module Rule

| Concept    | Rol            |
| ---------- | -------------- |
| Module     | implementación |
| Capability | contrato       |
| Runtime    | resolver       |

Un módulo puede cambiar.

Una capacidad no puede romper contratos existentes.

---

## 12. Versionado

Las capacidades pueden evolucionar:

```
ai.generate.text@1
ai.generate.text@2
```

Regla:

* nunca romper versiones anteriores
* nuevas versiones deben coexistir

---

## 13. Health of Capability

Cada capacidad puede emitir estado:

```typescript
capability.health

payload:
- status: healthy | degraded | offline
- latency
- error_rate
```

---

## 14. Governance Rule (CRÍTICO)

El sistema NO permite:

* capacidades duplicadas semánticamente
* nombres libres no registrados
* módulos sin capacidades declaradas

---

## 15. Filosofía

NeoProxy no es un sistema de módulos.

NeoProxy es un **grafo vivo de capacidades ejecutables**.

Los módulos son intercambiables.

Las capacidades son la verdad del sistema.

---

## Implementación Actual

Ver `backend/genesis/registry.ts` para la implementación del Capability Registry.

Ver `backend/genesis/resolver.ts` para la implementación del Resolver (placeholder para Qwen).
