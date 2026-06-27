/**
 * NeoProxy Genesis Dashboard
 * 
 * Frontend application for the Genesis Console.
 * Connects to backend via WebSocket and REST API.
 */

const API_BASE = 'http://localhost:3000';
let ws = null;
let selectedNode = null;
let modules = [];
let events = [];

// DOM Elements
const modulesListEl = document.getElementById('modules-list');
const graphEl = document.getElementById('graph');
const inspectorEl = document.getElementById('inspector');
const eventStreamEl = document.getElementById('event-stream');
const consoleOutputEl = document.getElementById('console-output');
const consoleInputEl = document.getElementById('console-input');

// Initialize dashboard
async function init() {
  console.log('[Dashboard] Initializing...');
  
  // Load initial data
  await loadCapabilities();
  await loadEvents();
  
  // Setup WebSocket
  setupWebSocket();
  
  // Render UI
  renderModules();
  renderGraph();
  
  // Start event simulation
  startEventSimulation();
  
  console.log('[Dashboard] Initialized');
}

// Load capabilities from backend
async function loadCapabilities() {
  try {
    const response = await fetch(`${API_BASE}/capabilities`);
    const capabilities = await response.json();
    
    // Convert capabilities to modules for display
    modules = Object.keys(capabilities).map((name, index) => ({
      id: `module-${index}`,
      name: name.split('.')[0].toUpperCase(),
      capability: name,
      status: ['running', 'running', 'warning', 'stopped'][Math.floor(Math.random() * 4)],
      providers: capabilities[name].providers.length,
      health: capabilities[name].providers[0]?.health || 'unknown'
    }));
    
    console.log('[Dashboard] Loaded capabilities:', modules.length);
  } catch (error) {
    console.error('[Dashboard] Failed to load capabilities:', error);
    // Use mock data if backend is not available
    loadMockCapabilities();
  }
}

// Load mock capabilities if backend is unavailable
function loadMockCapabilities() {
  modules = [
    { id: 'module-0', name: 'AI', capability: 'ai.generate.text', status: 'running', providers: 2, health: 'healthy' },
    { id: 'module-1', name: 'MEMORY', capability: 'memory.store.context', status: 'running', providers: 1, health: 'healthy' },
    { id: 'module-2', name: 'STORAGE', capability: 'storage.retrieve.data', status: 'running', providers: 1, health: 'healthy' },
    { id: 'module-3', name: 'DASHBOARD', capability: 'dashboard.render.ui', status: 'running', providers: 1, health: 'healthy' },
    { id: 'module-4', name: 'FABRICATION', capability: 'fabrication.export.stl', status: 'warning', providers: 1, health: 'degraded' },
    { id: 'module-5', name: 'PRINTER', capability: 'fabrication.print', status: 'stopped', providers: 1, health: 'offline' }
  ];
  console.log('[Dashboard] Loaded mock capabilities');
}

// Load events from backend
async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE}/events`);
    events = await response.json();
    renderEventStream();
  } catch (error) {
    console.error('[Dashboard] Failed to load events:', error);
  }
}

// Setup WebSocket connection
function setupWebSocket() {
  const wsUrl = `ws://localhost:3000`;
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('[Dashboard] WebSocket connected');
    addConsoleMessage('WebSocket connected', 'system');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketEvent(data);
  };
  
  ws.onclose = () => {
    console.log('[Dashboard] WebSocket disconnected');
    addConsoleMessage('WebSocket disconnected - reconnecting...', 'system');
    setTimeout(setupWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('[Dashboard] WebSocket error:', error);
  };
}

// Handle incoming WebSocket events
function handleWebSocketEvent(event) {
  events.push(event);
  if (events.length > 100) {
    events.shift();
  }
  renderEventStream();
}

// Render modules list
function renderModules() {
  modulesListEl.innerHTML = '';
  
  modules.forEach(module => {
    const item = document.createElement('div');
    item.className = 'module-item';
    item.onclick = () => selectModule(module);
    
    const statusClass = `status-${module.status}`;
    
    item.innerHTML = `
      <div class="module-name">${module.name}</div>
      <div class="module-status ${statusClass}">${module.status.toUpperCase()}</div>
    `;
    
    modulesListEl.appendChild(item);
  });
}

// Render runtime graph
function renderGraph() {
  graphEl.innerHTML = '';
  
  const nodes = [
    { id: 'genesis', name: 'GENESIS', className: 'node-genesys' },
    { id: 'ai', name: 'AI', className: 'node-ai' },
    { id: 'memory', name: 'MEMORY', className: 'node-memory' },
    { id: 'storage', name: 'STORAGE', className: 'node-storage' },
    { id: 'dashboard', name: 'DASHBOARD', className: 'node-dashboard' }
  ];
  
  // Create connections (simplified visual)
  createConnection(graphEl, nodes[0], nodes[1]);
  createConnection(graphEl, nodes[0], nodes[2]);
  createConnection(graphEl, nodes[0], nodes[3]);
  createConnection(graphEl, nodes[1], nodes[4]);
  createConnection(graphEl, nodes[2], nodes[4]);
  createConnection(graphEl, nodes[3], nodes[4]);
  
  // Create nodes
  nodes.forEach(node => {
    const nodeEl = document.createElement('div');
    nodeEl.className = `node ${node.className}`;
    nodeEl.dataset.id = node.id;
    nodeEl.textContent = node.name;
    
    nodeEl.onclick = () => selectNode(node);
    
    graphEl.appendChild(nodeEl);
  });
}

// Create visual connection between nodes
function createConnection(container, node1, node2) {
  // Simplified connection - in production would calculate proper positions
  const connection = document.createElement('div');
  connection.className = 'connection';
  connection.style.width = '100px';
  connection.style.top = '100px';
  connection.style.left = '200px';
  container.appendChild(connection);
}

// Select a module from the list
function selectModule(module) {
  selectedNode = {
    id: module.id,
    name: module.name,
    type: 'module',
    status: module.status,
    capability: module.capability,
    providers: module.providers,
    health: module.health,
    description: `${module.name} module - handles ${module.capability}`,
    dependencies: ['GENESIS'],
    latency: Math.floor(Math.random() * 200) + 10,
    events: Math.floor(Math.random() * 1000)
  };
  
  renderInspector();
  
  // Highlight in modules list
  document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
  event.target.closest('.module-item')?.classList.add('active');
}

// Select a node from the graph
function selectNode(node) {
  selectedNode = {
    id: node.id,
    name: node.name,
    type: 'runtime-node',
    status: 'running',
    capability: node.id + '.core',
    providers: 1,
    health: 'healthy',
    description: `${node.name} runtime node - core system component`,
    dependencies: ['GENESIS'],
    latency: Math.floor(Math.random() * 100) + 5,
    events: Math.floor(Math.random() * 5000)
  };
  
  renderInspector();
  
  // Highlight in graph
  document.querySelectorAll('.node').forEach(el => el.classList.remove('selected'));
  const nodeEl = graphEl.querySelector(`[data-id="${node.id}"]`);
  if (nodeEl) nodeEl.classList.add('selected');
}

// Render inspector panel
function renderInspector() {
  if (!selectedNode) return;
  
  inspectorEl.innerHTML = `
    <div class="inspector-section">
      <div class="inspector-label">Name</div>
      <div class="inspector-value">${selectedNode.name}</div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Status</div>
      <div class="inspector-value" style="color: ${getStatusColor(selectedNode.status)}">
        ${selectedNode.status.toUpperCase()}
      </div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Type</div>
      <div class="inspector-value">${selectedNode.type}</div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Capability</div>
      <div class="inspector-value">
        <span class="capability-tag">${selectedNode.capability}</span>
      </div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Health</div>
      <div class="inspector-value" style="color: ${getHealthColor(selectedNode.health)}">
        ${selectedNode.health.toUpperCase()}
      </div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Latency</div>
      <div class="inspector-value">${selectedNode.latency}ms</div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Events</div>
      <div class="inspector-value">${selectedNode.events.toLocaleString()}</div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Description</div>
      <div class="inspector-value">${selectedNode.description}</div>
    </div>
    
    <div class="inspector-section">
      <div class="inspector-label">Dependencies</div>
      <div class="inspector-value">
        ${selectedNode.dependencies.map(d => `<span class="capability-tag">${d}</span>`).join('')}
      </div>
    </div>
  `;
}

// Get color for status
function getStatusColor(status) {
  const colors = {
    running: '#00ff00',
    stopped: '#ff4444',
    warning: '#ffaa00',
    offline: '#666666'
  };
  return colors[status] || '#666666';
}

// Get color for health
function getHealthColor(health) {
  const colors = {
    healthy: '#00ff00',
    degraded: '#ffaa00',
    offline: '#ff4444'
  };
  return colors[health] || '#666666';
}

// Render event stream
function renderEventStream() {
  const recentEvents = events.slice(-50);
  
  eventStreamEl.innerHTML = recentEvents.map(event => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    return `
      <div class="event-item">
        <span class="event-time">${time}</span>
        <span class="event-type">${event.type}</span>
      </div>
    `;
  }).join('');
  
  // Auto-scroll to bottom
  eventStreamEl.scrollTop = eventStreamEl.scrollHeight;
}

// Add console message
function addConsoleMessage(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const color = type === 'error' ? '#ff4444' : type === 'success' ? '#00ff00' : '#888888';
  
  consoleOutputEl.innerHTML += `
    <div style="color: ${color}; margin-bottom: 4px;">
      <span style="color: #666;">[${time}]</span> ${message}
    </div>
  `;
  
  // Auto-scroll to bottom
  consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
}

// Process console commands
function processCommand(input) {
  const cmd = input.trim().toLowerCase();
  
  addConsoleMessage(`> ${input}`, 'info');
  
  switch (cmd) {
    case 'help':
      addConsoleMessage('Available commands: help, status, modules, events, clear, restart memory, restart ai, inspect genesis', 'info');
      break;
      
    case 'status':
      addConsoleMessage('System Status: RUNNING | Uptime: ' + process.uptime() + 's | Modules: ' + modules.length, 'success');
      break;
      
    case 'modules':
      modules.forEach(m => {
        addConsoleMessage(`  • ${m.name} - ${m.status.toUpperCase()}`, 'info');
      });
      break;
      
    case 'events':
      addConsoleMessage(`Total events: ${events.length}`, 'info');
      break;
      
    case 'clear':
      consoleOutputEl.innerHTML = '';
      break;
      
    case 'restart memory':
      addConsoleMessage('Restarting MEMORY module...', 'info');
      setTimeout(() => addConsoleMessage('MEMORY restarted successfully', 'success'), 1000);
      break;
      
    case 'restart ai':
      addConsoleMessage('Restarting AI module...', 'info');
      setTimeout(() => addConsoleMessage('AI restarted successfully', 'success'), 1000);
      break;
      
    case 'inspect genesis':
      selectedNode = {
        id: 'genesis',
        name: 'GENESIS',
        type: 'runtime-core',
        status: 'running',
        capability: 'genesis.core',
        providers: 1,
        health: 'healthy',
        description: 'Genesis Runtime Core - Central orchestrator of NeoProxy',
        dependencies: [],
        latency: 1,
        events: events.length
      };
      renderInspector();
      addConsoleMessage('GENESIS inspected - see Inspector panel', 'success');
      break;
      
    default:
      addConsoleMessage(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
  }
}

// Simulate events for demo purposes
function startEventSimulation() {
  const eventTypes = [
    'runtime.boot',
    'registry.ready',
    'memory.loaded',
    'ai.connected',
    'storage.updated',
    'fabrication.idle',
    'printer.online',
    'dashboard.render',
    'capability.resolved',
    'capability.executed'
  ];
  
  setInterval(() => {
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const event = {
      id: Math.random().toString(36).substr(2, 9),
      type: randomType,
      source: 'simulation',
      payload: {},
      timestamp: Date.now()
    };
    
    handleWebSocketEvent(event);
  }, 1000);
}

// Event listeners
consoleInputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = consoleInputEl.value;
    if (input.trim()) {
      processCommand(input);
      consoleInputEl.value = '';
    }
  }
});

// Initialize on load
init();
