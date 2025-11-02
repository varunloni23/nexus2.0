# 🔌 WebSocket Client Connection Guide

## Overview
This guide helps you connect your frontend application to the CementAI Nexus WebSocket server running at: `https://backend2-0-lrcn.onrender.com`

## Quick Test
Open `websocket-test-client.html` in your browser to test the WebSocket connection immediately.

## Connection Examples

### 1. Basic JavaScript/HTML Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('https://backend2-0-lrcn.onrender.com', {
  transports: ['websocket', 'polling'],
  upgrade: true,
  secure: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to CementAI Backend:', socket.id);
});

socket.on('connection_confirmed', (data) => {
  console.log('🎉 Connection confirmed:', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
});

// Data events
socket.on('dashboard_update', (data) => {
  console.log('📊 Dashboard update:', data);
  // Update your UI with the data
});
```

### 2. React Hook Example
```javascript
// hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useWebSocket = (serverUrl = 'https://backend2-0-lrcn.onrender.com') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      secure: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('✅ Connected to CementAI Backend');
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionError(error.message);
      console.error('❌ Connection error:', error);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from server');
    });

    newSocket.on('dashboard_update', (data) => {
      setDashboardData(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  const requestSensorData = () => {
    if (socket && isConnected) {
      socket.emit('request_sensor_data');
    }
  };

  const requestProcessData = () => {
    if (socket && isConnected) {
      socket.emit('request_process_data');
    }
  };

  return {
    socket,
    isConnected,
    dashboardData,
    connectionError,
    requestSensorData,
    requestProcessData
  };
};
```

### 3. Vue.js Composition API Example
```javascript
// composables/useWebSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useWebSocket() {
  const socket = ref(null);
  const isConnected = ref(false);
  const dashboardData = ref(null);
  const connectionError = ref(null);

  const connect = () => {
    socket.value = io('https://backend2-0-lrcn.onrender.com', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      secure: true
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
      connectionError.value = null;
    });

    socket.value.on('connect_error', (error) => {
      isConnected.value = false;
      connectionError.value = error.message;
    });

    socket.value.on('dashboard_update', (data) => {
      dashboardData.value = data;
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      isConnected.value = false;
    }
  };

  onMounted(connect);
  onUnmounted(disconnect);

  return {
    socket: socket.value,
    isConnected,
    dashboardData,
    connectionError,
    disconnect
  };
}
```

### 4. Angular Service Example
```typescript
// services/websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private dashboardDataSubject = new BehaviorSubject<any>(null);

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io('https://backend2-0-lrcn.onrender.com', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      secure: true
    });

    this.socket.on('connect', () => {
      this.isConnectedSubject.next(true);
      console.log('✅ Connected to CementAI Backend');
    });

    this.socket.on('connect_error', (error) => {
      this.isConnectedSubject.next(false);
      console.error('❌ Connection error:', error);
    });

    this.socket.on('dashboard_update', (data) => {
      this.dashboardDataSubject.next(data);
    });
  }

  get isConnected$(): Observable<boolean> {
    return this.isConnectedSubject.asObservable();
  }

  get dashboardData$(): Observable<any> {
    return this.dashboardDataSubject.asObservable();
  }

  requestSensorData() {
    this.socket.emit('request_sensor_data');
  }

  requestProcessData() {
    this.socket.emit('request_process_data');
  }
}
```

## Available WebSocket Events

### Client → Server (Emit)
- `request_sensor_data` - Request current sensor readings
- `request_process_data` - Request current process parameters
- `request_status` - Request server status
- `ping` - Send ping for connection health check

### Server → Client (Listen)
- `connect` - Connection established
- `connection_confirmed` - Welcome message with server info
- `dashboard_update` - Real-time dashboard data updates (every 5 seconds)
- `sensor_data` - Response to sensor data request
- `process_data` - Response to process data request
- `server_status` - Response to status request
- `pong` - Response to ping
- `error` - Error messages
- `disconnect` - Connection closed

## Troubleshooting Common Issues

### 1. CORS Errors
The server is configured to accept connections from multiple origins. If you're still getting CORS errors:
```javascript
const socket = io('https://backend2-0-lrcn.onrender.com', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

### 2. SSL/TLS Issues
For HTTPS deployments, ensure secure connection:
```javascript
const socket = io('https://backend2-0-lrcn.onrender.com', {
  secure: true,
  rejectUnauthorized: true // Set to false only for development
});
```

### 3. Firewall/Network Issues
Try polling first, then upgrade:
```javascript
const socket = io('https://backend2-0-lrcn.onrender.com', {
  transports: ['polling', 'websocket'],
  upgrade: true
});
```

### 4. Connection Timeout
Increase timeout values:
```javascript
const socket = io('https://backend2-0-lrcn.onrender.com', {
  timeout: 20000,
  reconnectionDelay: 2000,
  reconnectionAttempts: 10
});
```

## Server Health Check

Before connecting, verify the server is running:
```bash
curl https://backend2-0-lrcn.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "CementAI Nexus API is running",
  "simulation_running": true,
  "connected_clients": 0,
  "firebase_status": {...},
  "gemini_enabled": true,
  "timestamp": "2025-09-20T17:15:36.421Z"
}
```

## Data Structure Examples

### Dashboard Update Data Structure
```javascript
{
  plant_overview: {
    overall_efficiency: 85.2,
    production_rate_current: 1850,
    production_rate_target: 2000,
    energy_consumption_current: 95.2,
    active_alerts_count: 2,
    equipment_running_count: 7,
    quality_score_avg: 88.5
  },
  recent_sensors: [
    {
      timestamp: "2025-09-20T17:15:36.421Z",
      sensor_id: "KILN_TEMP_01",
      value: 1450.5,
      unit: "°C",
      location: "Kiln Burning Zone",
      sensor_type: "temperature"
    }
    // ... more sensors
  ],
  current_parameters: {
    kiln_temperature: 1450.5,
    kiln_pressure: -12.3,
    raw_mill_power: 2850,
    cement_mill_power: 3150,
    production_rate: 1850
  },
  recent_quality: [...],
  equipment_status: [...],
  active_alerts: [...],
  environmental_data: {...}
}
```

## Next Steps

1. **Test Connection**: Open `websocket-test-client.html` in your browser
2. **Implement in Your App**: Use the appropriate example for your framework
3. **Handle Data**: Process the `dashboard_update` events to update your UI
4. **Add Error Handling**: Implement reconnection logic and error states
5. **Monitor Connection**: Use the health check endpoint and connection events

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify server is running with health check
3. Test with the provided HTML test client
4. Check network connectivity and firewall settings