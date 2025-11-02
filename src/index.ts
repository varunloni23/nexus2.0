import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { CementPlantSimulator } from './simulation/dataGenerator';
import { DashboardData, SimulationConfig } from './data/models';
import { createGeminiService } from './ai/geminiService';
import { createFirebaseService } from './services/firebaseService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Enhanced CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', // Frontend on alternate port
    'https://nexusfrontend2.vercel.app', // Current Vercel frontend
    'https://cement-nexus-ai.vercel.app',
    'https://cement-nexus-ai.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean) as string[],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

const io = new Server(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  allowRequest: (req, callback) => {
    // Enhanced request validation and logging
    const origin = req.headers.origin;
    const userAgent = req.headers['user-agent'];
    
    console.log(`🔌 WebSocket connection attempt from origin: ${origin}`);
    console.log(`🔌 User Agent: ${userAgent}`);
    
    // Allow all origins for now (you can restrict this later)
    callback(null, true);
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CementAI Nexus API is running',
    simulation_running: simulator.isRunning(),
    connected_clients: io.engine.clientsCount,
    firebase_status: firebaseService.getProjectInfo(),
    gemini_enabled: process.env.GEMINI_API_KEY ? true : false,
    timestamp: new Date()
  });
});

// Initialize cement plant simulator
const simulationConfig: SimulationConfig = {
  plant_capacity: parseInt(process.env.PLANT_CAPACITY || '2000'),
  sensor_count: parseInt(process.env.SENSOR_COUNT || '50'),
  simulation_speed: 1,
  noise_level: 0.1,
  anomaly_probability: 0.05,
  quality_variation: 0.1
};

const simulator = new CementPlantSimulator(simulationConfig);
const geminiService = createGeminiService();
const firebaseService = createFirebaseService();

// Function to load sample real cement plant data
async function loadSampleRealData(): Promise<any[]> {
  // Sample real cement plant data based on industry averages and standards
  const realData = [
    {
      timestamp: '2024-01-01T00:00:00Z',
      kiln_temperature: 1450.5, kiln_pressure: -12.3, raw_mill_power: 2850, cement_mill_power: 3150,
      production_rate: 1850, compressive_strength: 42.5, fineness: 365, co2_emissions: 875, energy_consumption: 95.2
    },
    {
      timestamp: '2024-01-01T00:05:00Z', 
      kiln_temperature: 1452.1, kiln_pressure: -11.8, raw_mill_power: 2890, cement_mill_power: 3180,
      production_rate: 1870, compressive_strength: 43.1, fineness: 358, co2_emissions: 878, energy_consumption: 94.8
    },
    {
      timestamp: '2024-01-01T00:10:00Z',
      kiln_temperature: 1448.7, kiln_pressure: -13.1, raw_mill_power: 2820, cement_mill_power: 3120,
      production_rate: 1820, compressive_strength: 41.9, fineness: 372, co2_emissions: 882, energy_consumption: 96.1
    },
    {
      timestamp: '2024-01-01T00:15:00Z',
      kiln_temperature: 1455.3, kiln_pressure: -10.9, raw_mill_power: 2910, cement_mill_power: 3200,
      production_rate: 1895, compressive_strength: 44.2, fineness: 351, co2_emissions: 869, energy_consumption: 93.7
    },
    {
      timestamp: '2024-01-01T00:20:00Z',
      kiln_temperature: 1451.8, kiln_pressure: -12.7, raw_mill_power: 2875, cement_mill_power: 3165,
      production_rate: 1860, compressive_strength: 42.8, fineness: 363, co2_emissions: 873, energy_consumption: 95.5
    },
    {
      timestamp: '2024-01-01T00:25:00Z',
      kiln_temperature: 1453.4, kiln_pressure: -11.5, raw_mill_power: 2895, cement_mill_power: 3185,
      production_rate: 1885, compressive_strength: 43.5, fineness: 356, co2_emissions: 871, energy_consumption: 94.3
    },
    {
      timestamp: '2024-01-01T00:30:00Z',
      kiln_temperature: 1449.9, kiln_pressure: -13.4, raw_mill_power: 2835, cement_mill_power: 3135,
      production_rate: 1835, compressive_strength: 42.1, fineness: 369, co2_emissions: 885, energy_consumption: 96.8
    },
    {
      timestamp: '2024-01-01T00:35:00Z',
      kiln_temperature: 1456.2, kiln_pressure: -10.6, raw_mill_power: 2925, cement_mill_power: 3210,
      production_rate: 1905, compressive_strength: 44.8, fineness: 348, co2_emissions: 865, energy_consumption: 93.2
    },
    {
      timestamp: '2024-01-01T00:40:00Z',
      kiln_temperature: 1452.7, kiln_pressure: -12.1, raw_mill_power: 2885, cement_mill_power: 3175,
      production_rate: 1875, compressive_strength: 43.3, fineness: 361, co2_emissions: 876, energy_consumption: 95.1
    },
    {
      timestamp: '2024-01-01T00:45:00Z',
      kiln_temperature: 1450.3, kiln_pressure: -12.9, raw_mill_power: 2860, cement_mill_power: 3155,
      production_rate: 1850, compressive_strength: 42.6, fineness: 367, co2_emissions: 880, energy_consumption: 95.9
    }
  ];
  
  console.log('Loaded sample real cement plant data:', realData.length, 'records');
  return realData;
}

// Function to generate dashboard data from real plant data
function generateDashboardFromRealData(realData: any): DashboardData {
  const timestamp = new Date();
  
  // Convert real data to sensor readings
  const sensorReadings: any[] = [
    {
      timestamp,
      sensor_id: 'KILN_TEMP_01',
      value: realData.kiln_temperature,
      unit: '°C',
      location: 'Kiln Burning Zone',
      sensor_type: 'temperature'
    },
    {
      timestamp,
      sensor_id: 'KILN_PRESSURE_01', 
      value: realData.kiln_pressure,
      unit: 'kPa',
      location: 'Kiln Inlet',
      sensor_type: 'pressure'
    },
    {
      timestamp,
      sensor_id: 'RAW_MILL_POWER_01',
      value: realData.raw_mill_power,
      unit: 'kW',
      location: 'Raw Mill',
      sensor_type: 'power'
    },
    {
      timestamp,
      sensor_id: 'CEMENT_MILL_POWER_01',
      value: realData.cement_mill_power,
      unit: 'kW', 
      location: 'Cement Mill',
      sensor_type: 'power'
    },
    {
      timestamp,
      sensor_id: 'PRODUCTION_FLOW_01',
      value: realData.production_rate,
      unit: 'TPH',
      location: 'Cement Silo',
      sensor_type: 'flow'
    },
    {
      timestamp,
      sensor_id: 'FINENESS_01',
      value: realData.fineness,
      unit: 'm²/kg',
      location: 'Quality Control Lab', 
      sensor_type: 'flow'
    }
  ];

  // Convert real data to process parameters
  const processParameters: any = {
    timestamp,
    kiln_temperature: realData.kiln_temperature,
    kiln_pressure: realData.kiln_pressure,
    raw_mill_power: realData.raw_mill_power,
    cement_mill_power: realData.cement_mill_power,
    production_rate: realData.production_rate,
    energy_consumption: realData.energy_consumption,
    alternative_fuel_rate: 25, // Default value
    raw_meal_flow: realData.production_rate * 1.55,
    cement_fineness: realData.fineness,
    clinker_temperature: realData.kiln_temperature - 300,
    exhaust_fan_speed: 500,
    preheater_temperature: realData.kiln_temperature - 1100
  };

  // Generate quality metrics from real data
  const qualityMetrics: any = {
    timestamp,
    sample_id: `REAL_${Date.now()}`,
    blaine_fineness: realData.fineness,
    compressive_strength_3d: realData.compressive_strength * 0.5,
    compressive_strength_28d: realData.compressive_strength,
    setting_time_initial: 75,
    setting_time_final: 270,
    quality_score: Math.min(95, realData.compressive_strength * 2),
    defect_count: 1,
    consistency: 97.5,
    chemical_composition: {
      c3s: 60,
      c2s: 20,
      c3a: 10,
      c4af: 10,
      so3: 3.0,
      free_lime: 1.0
    }
  };

  // Generate environmental data from real data
  const environmentalData: any = {
    timestamp,
    co2_emissions: realData.co2_emissions,
    nox_emissions: 650,
    so2_emissions: 120,
    dust_emissions: 25,
    energy_consumption_specific: realData.energy_consumption,
    alternative_fuel_substitution: 25,
    waste_heat_recovery: realData.production_rate * 25,
    water_consumption: 300
  };

  // Generate plant overview from real data
  const plantOverview: any = {
    timestamp,
    overall_efficiency: Math.min(95, 100 - (realData.energy_consumption - 90) * 2),
    production_rate_current: realData.production_rate,
    production_rate_target: 2000,
    energy_consumption_current: realData.energy_consumption,
    energy_consumption_target: 90,
    quality_score_avg: Math.min(95, realData.compressive_strength * 2),
    active_alerts_count: 2,
    equipment_running_count: 7,
    equipment_total_count: 8,
    environmental_compliance: true
  };

  return {
    plant_overview: plantOverview,
    recent_sensors: sensorReadings,
    current_parameters: processParameters,
    recent_quality: [qualityMetrics],
    equipment_status: simulator.generateEquipmentStatus(), // Use simulated equipment status
    active_alerts: [],
    ai_recommendations: [],
    environmental_data: environmentalData
  };
}

// Store latest data for API endpoints
let latestDashboardData: DashboardData;
let realDataEnabled = false;
let realDataSource: any[] = [];
let realDataIndex = 0;

// Real-time data broadcasting
const broadcastData = () => {
  let dashboardData: DashboardData;
  
  if (realDataEnabled && realDataSource.length > 0) {
    // Use real data
    const currentRealData = realDataSource[realDataIndex % realDataSource.length];
    dashboardData = generateDashboardFromRealData(currentRealData);
    realDataIndex++;
    console.log(`Broadcasting REAL data (record ${realDataIndex}/${realDataSource.length}) to ${io.engine.clientsCount} clients`);
  } else {
    // Use simulated data
    dashboardData = {
      plant_overview: simulator.generatePlantOverview(),
      recent_sensors: simulator.generateSensorReadings(),
      current_parameters: simulator.generateProcessParameters(),
      recent_quality: [simulator.generateQualityMetrics()],
      equipment_status: simulator.generateEquipmentStatus(),
      active_alerts: [],
      ai_recommendations: [],
      environmental_data: simulator.generateEnvironmentalData()
    };
    console.log(`Broadcasting simulated data to ${io.engine.clientsCount} clients`);
  }

  latestDashboardData = dashboardData;
  
  // Broadcast to all connected clients
  io.emit('dashboard_update', dashboardData);
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  const clientInfo = {
    id: socket.id,
    ip: socket.handshake.address,
    origin: socket.handshake.headers.origin,
    userAgent: socket.handshake.headers['user-agent'],
    timestamp: new Date().toISOString()
  };
  
  console.log('🔌 Client connected:', JSON.stringify(clientInfo, null, 2));
  console.log(`📊 Total connected clients: ${io.engine.clientsCount}`);
  
  // Send welcome message and latest data immediately upon connection
  socket.emit('connection_confirmed', {
    message: 'Connected to CementAI Nexus Backend',
    server_time: new Date().toISOString(),
    your_id: socket.id
  });
  
  if (latestDashboardData) {
    console.log(`📤 Sending latest dashboard data to client: ${socket.id}`);
    socket.emit('dashboard_update', latestDashboardData);
  }
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    console.log(`📊 Disconnect reason: ${reason}`);
    console.log(`📊 Remaining connected clients: ${io.engine.clientsCount}`);
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`🔌 Socket error for client ${socket.id}:`, error);
  });
  
  // Handle client requests for specific data
  socket.on('request_sensor_data', () => {
    console.log(`📊 Client ${socket.id} requested sensor data`);
    try {
      const sensorData = simulator.generateSensorReadings();
      socket.emit('sensor_data', sensorData);
      console.log(`📤 Sent ${sensorData.length} sensor readings to client: ${socket.id}`);
    } catch (error) {
      console.error(`❌ Error generating sensor data for client ${socket.id}:`, error);
      socket.emit('error', { message: 'Failed to generate sensor data' });
    }
  });
  
  socket.on('request_process_data', () => {
    console.log(`📊 Client ${socket.id} requested process data`);
    try {
      const processData = simulator.generateProcessParameters();
      socket.emit('process_data', processData);
      console.log(`📤 Sent process data to client: ${socket.id}`);
    } catch (error) {
      console.error(`❌ Error generating process data for client ${socket.id}:`, error);
      socket.emit('error', { message: 'Failed to generate process data' });
    }
  });
  
  // Handle ping/pong for connection health
  socket.on('ping', () => {
    console.log(`🏓 Ping received from client: ${socket.id}`);
    socket.emit('pong');
  });
  
  // Handle client status requests
  socket.on('request_status', () => {
    socket.emit('server_status', {
      connected_clients: io.engine.clientsCount,
      server_time: new Date().toISOString(),
      simulation_running: simulator.isRunning(),
      uptime: process.uptime()
    });
  });
});

// WebSocket Debug and Status Endpoints
app.get('/api/websocket/status', (req, res) => {
  try {
    const socketInfo = {
      connected_clients: io.engine.clientsCount,
      server_time: new Date().toISOString(),
      socket_io_version: require('socket.io/package.json').version,
      transport_types: ['websocket', 'polling'],
      cors_origins: [
        'http://localhost:3000',
        'https://cement-nexus-ai.vercel.app',
        'https://cement-nexus-ai.onrender.com',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      ping_timeout: 60000,
      ping_interval: 25000,
      upgrade_timeout: 30000
    };
    
    res.json({
      success: true,
      websocket_status: 'active',
      data: socketInfo,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket status',
      timestamp: new Date()
    });
  }
});

app.get('/api/websocket/test', (req, res) => {
  try {
    // Send a test broadcast to all connected clients
    const testData = {
      test: true,
      message: 'WebSocket test broadcast from REST endpoint',
      timestamp: new Date().toISOString(),
      connected_clients: io.engine.clientsCount
    };
    
    io.emit('test_broadcast', testData);
    
    res.json({
      success: true,
      message: 'Test broadcast sent to all connected WebSocket clients',
      broadcast_data: testData,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send test broadcast',
      timestamp: new Date()
    });
  }
});

// REST API Endpoints

// Get current sensor readings
app.get('/api/sensors/realtime', (req, res) => {
  try {
    const sensorData = simulator.generateSensorReadings();
    res.json({
      success: true,
      data: sensorData,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor data',
      timestamp: new Date()
    });
  }
});

// Get plant status overview
app.get('/api/plant/status', (req, res) => {
  try {
    const plantOverview = simulator.generatePlantOverview();
    res.json({
      success: true,
      data: plantOverview,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant status',
      timestamp: new Date()
    });
  }
});

// Get current process parameters
app.get('/api/process/parameters', (req, res) => {
  try {
    const processParams = simulator.generateProcessParameters();
    res.json({
      success: true,
      data: processParams,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch process parameters',
      timestamp: new Date()
    });
  }
});

// Get quality metrics
app.get('/api/quality/current', (req, res) => {
  try {
    const qualityData = simulator.generateQualityMetrics();
    res.json({
      success: true,
      data: qualityData,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quality data',
      timestamp: new Date()
    });
  }
});

// Get equipment status
app.get('/api/equipment/status', (req, res) => {
  try {
    const equipmentStatus = simulator.generateEquipmentStatus();
    res.json({
      success: true,
      data: equipmentStatus,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment status',
      timestamp: new Date()
    });
  }
});

// Get environmental data
app.get('/api/environmental/current', (req, res) => {
  try {
    const environmentalData = simulator.generateEnvironmentalData();
    res.json({
      success: true,
      data: environmentalData,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environmental data',
      timestamp: new Date()
    });
  }
});

// Get complete dashboard data
app.get('/api/dashboard/data', (req, res) => {
  try {
    if (latestDashboardData) {
      res.json({
        success: true,
        data: latestDashboardData,
        timestamp: new Date()
      });
    } else {
      // Generate fresh data if none available
      const dashboardData: DashboardData = {
        plant_overview: simulator.generatePlantOverview(),
        recent_sensors: simulator.generateSensorReadings(),
        current_parameters: simulator.generateProcessParameters(),
        recent_quality: [simulator.generateQualityMetrics()],
        equipment_status: simulator.generateEquipmentStatus(),
        active_alerts: [],
        ai_recommendations: [],
        environmental_data: simulator.generateEnvironmentalData()
      };
      
      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      timestamp: new Date()
    });
  }
});

// Simulation control endpoints
app.post('/api/simulation/start', (req, res) => {
  try {
    simulator.startSimulation();
    res.json({
      success: true,
      message: 'Simulation started',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start simulation',
      timestamp: new Date()
    });
  }
});

app.post('/api/simulation/stop', (req, res) => {
  try {
    simulator.stopSimulation();
    res.json({
      success: true,
      message: 'Simulation stopped',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop simulation',
      timestamp: new Date()
    });
  }
});

// Inject anomaly for testing
app.post('/api/simulation/anomaly', (req, res) => {
  try {
    const { type } = req.body;
    simulator.injectAnomaly(type);
    res.json({
      success: true,
      message: `${type} anomaly injected`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to inject anomaly',
      timestamp: new Date()
    });
  }
});

// AI Chat endpoint using Gemini
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await geminiService.askGemini(message, latestDashboardData);
    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
      timestamp: new Date()
    });
  }
});

// Get AI optimization recommendations
app.get('/api/ai/recommendations', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available',
        timestamp: new Date()
      });
    }
    
    const recommendations = await geminiService.generateOptimizationRecommendations(latestDashboardData);
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      timestamp: new Date()
    });
  }
});

// Explain anomaly endpoint
app.post('/api/ai/explain-anomaly', async (req, res) => {
  try {
    const { anomalyType, currentValue, normalRange } = req.body;
    const explanation = await geminiService.explainAnomaly(
      anomalyType,
      currentValue,
      normalRange,
      latestDashboardData
    );
    res.json({
      success: true,
      data: explanation,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to explain anomaly',
      timestamp: new Date()
    });
  }
});

// Quality fluctuation detection endpoint
app.post('/api/ai/quality-fluctuations', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available for analysis',
        timestamp: new Date()
      });
    }

    const analysis = await geminiService.detectQualityFluctuations(
      latestDashboardData,
      req.body.historicalData
    );
    
    // Store analysis results to Firebase
    firebaseService.storeQualityAnalysis({
      type: 'quality_fluctuations',
      analysis,
      plant_data: latestDashboardData.plant_overview
    }).catch(error => {
      console.log('📝 Note: Firebase storage failed, continuing with analysis response');
    });
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Quality fluctuation analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze quality fluctuations',
      timestamp: new Date()
    });
  }
});

// Quality trends analysis endpoint
app.post('/api/ai/quality-trends', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available for analysis',
        timestamp: new Date()
      });
    }

    const { qualityHistory } = req.body;
    const analysis = await geminiService.analyzeQualityTrends(
      qualityHistory || [],
      latestDashboardData
    );
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Quality trends analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze quality trends',
      timestamp: new Date()
    });
  }
});

// Proactive Quality Corrections endpoint
app.post('/api/ai/proactive-quality-corrections', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available for analysis',
        timestamp: new Date()
      });
    }

    const { currentData, fluctuations, historicalTrends } = req.body;
    
    // Generate comprehensive quality correction recommendations using Gemini
    const correctionAnalysis = await geminiService.generateProactiveCorrections(
      currentData || latestDashboardData,
      fluctuations || [],
      historicalTrends || []
    );
    
    // Store the analysis results to Firebase for tracking
    firebaseService.storeQualityAnalysis({
      type: 'proactive_corrections',
      analysis: correctionAnalysis,
      plant_data: latestDashboardData.plant_overview,
      fluctuations: fluctuations,
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.log('📝 Note: Firebase storage failed, continuing with analysis response');
    });
    
    res.json({
      success: true,
      data: correctionAnalysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Proactive quality corrections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate proactive quality corrections',
      timestamp: new Date()
    });
  }
});

// Input fluctuation monitoring endpoint
app.post('/api/ai/input-fluctuations', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available for analysis',
        timestamp: new Date()
      });
    }

    const { parameters, thresholds, historicalData } = req.body;
    
    // Analyze input parameter fluctuations and stability
    const fluctuationAnalysis = await geminiService.analyzeInputFluctuations(
      parameters || latestDashboardData.current_parameters,
      thresholds || {},
      historicalData || []
    );
    
    res.json({
      success: true,
      data: fluctuationAnalysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Input fluctuation analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze input fluctuations',
      timestamp: new Date()
    });
  }
});

// Real-time optimization endpoint
app.post('/api/ai/real-time-optimization', async (req, res) => {
  try {
    if (!latestDashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No plant data available for optimization',
        timestamp: new Date()
      });
    }

    const { objective } = req.body;
    const validObjectives = ['quality', 'energy', 'production', 'environment'];
    
    if (!objective || !validObjectives.includes(objective)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid objective. Must be one of: quality, energy, production, environment',
        timestamp: new Date()
      });
    }

    const optimization = await geminiService.generateRealTimeOptimization(
      latestDashboardData,
      objective
    );
    res.json({
      success: true,
      data: optimization,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Real-time optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization recommendations',
      timestamp: new Date()
    });
  }
});

// System prompt management endpoints
app.get('/api/ai/system-prompt', (req, res) => {
  try {
    const currentPrompt = geminiService.getCustomSystemPrompt();
    
    res.json({
      success: true,
      systemPrompt: currentPrompt,
      isCustom: currentPrompt !== null,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get system prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system prompt',
      timestamp: new Date()
    });
  }
});

app.post('/api/ai/system-prompt', (req, res) => {
  try {
    const { systemPrompt } = req.body;
    
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'System prompt is required and must be a string',
        timestamp: new Date()
      });
    }

    if (systemPrompt.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'System prompt must be at least 10 characters long',
        timestamp: new Date()
      });
    }

    geminiService.setCustomSystemPrompt(systemPrompt.trim());
    
    res.json({
      success: true,
      message: 'Custom system prompt set successfully',
      systemPrompt: systemPrompt.trim(),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Set system prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set system prompt',
      timestamp: new Date()
    });
  }
});

app.delete('/api/ai/system-prompt', (req, res) => {
  try {
    geminiService.clearCustomSystemPrompt();
    
    res.json({
      success: true,
      message: 'Custom system prompt cleared, reverted to default',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Clear system prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear system prompt',
      timestamp: new Date()
    });
  }
});

// Real data management endpoints
app.post('/api/real-data/load', async (req, res) => {
  try {
    const { dataType, source } = req.body;
    
    if (dataType === 'sample') {
      // Load sample real cement plant data
      realDataSource = await loadSampleRealData();
      realDataEnabled = true;
      realDataIndex = 0;
      
      res.json({
        success: true,
        message: `Loaded ${realDataSource.length} real data records`,
        dataType: 'sample',
        recordCount: realDataSource.length,
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported data type. Use "sample" for demo data.',
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load real data',
      timestamp: new Date()
    });
  }
});

app.post('/api/real-data/toggle', (req, res) => {
  try {
    realDataEnabled = !realDataEnabled;
    
    res.json({
      success: true,
      message: realDataEnabled ? 'Real data mode enabled' : 'Simulation mode enabled',
      realDataEnabled,
      currentDataSource: realDataEnabled ? 'Real plant data' : 'Simulated data',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle data mode',
      timestamp: new Date()
    });
  }
});

app.get('/api/real-data/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        realDataEnabled,
        recordCount: realDataSource.length,
        currentIndex: realDataIndex,
        dataSource: realDataEnabled ? 'Real plant data' : 'Simulated data',
        nextRecord: realDataEnabled && realDataSource.length > 0 
          ? realDataSource[realDataIndex % realDataSource.length] 
          : null
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get real data status',
      timestamp: new Date()
    });
  }
});
// Firebase integration test endpoint
app.get('/api/firebase/test', async (req, res) => {
  try {
    const testData = {
      message: 'Firebase integration test',
      timestamp: new Date().toISOString(),
      test_id: Math.random().toString(36).substr(2, 9)
    };
    
    // Test Firebase storage
    await firebaseService.storeQualityAnalysis({
      type: 'integration_test',
      data: testData
    });
    
    res.json({
      success: true,
      message: 'Firebase integration test successful',
      firebase_connected: firebaseService.isConnected(),
      test_data: testData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.json({
      success: false,
      message: 'Firebase integration test failed (continuing in demo mode)',
      firebase_connected: firebaseService.isConnected(),
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Start server with error handling and port conflict resolution
const PORT = process.env.PORT || 3001;

// Function to handle port conflicts
const startServerWithRetry = (port: number, maxRetries: number = 5): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tryStart = (currentPort: number, retriesLeft: number) => {
      const serverInstance = server.listen(currentPort, () => {
        console.log(`CementAI Nexus API Server running on port ${currentPort}`);
        console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        
        // Start simulation and data broadcasting
        simulator.startSimulation();
        
        // Broadcast data every 5 seconds
        setInterval(broadcastData, parseInt(process.env.SIMULATION_INTERVAL || '5000'));
        
        console.log('Real-time data simulation started');
        resolve();
      });

      serverInstance.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${currentPort} is busy, trying port ${currentPort + 1}...`);
          if (retriesLeft > 0) {
            tryStart(currentPort + 1, retriesLeft - 1);
          } else {
            reject(new Error(`Unable to find available port after ${maxRetries} attempts`));
          }
        } else {
          reject(err);
        }
      });
    };

    tryStart(port, maxRetries);
  });
};

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServerWithRetry(parseInt(PORT.toString()))
  .then(() => {
    console.log('🚀 CementAI Nexus backend is ready!');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

export default app;