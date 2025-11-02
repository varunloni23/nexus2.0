import { v4 as uuidv4 } from 'uuid';
import { 
  SensorReading, 
  ProcessParameters, 
  QualityMetrics, 
  EquipmentStatus, 
  Alert, 
  EnvironmentalData,
  SimulationConfig,
  PlantOverview
} from '../data/models';
import RealDataAdapter from '../data/realDataAdapter';

export class CementPlantSimulator {
  private config: SimulationConfig;
  private baseTime: Date;
  private simulationRunning: boolean = false;
  private lastParameters: ProcessParameters | null = null;
  private realDataAdapter: any; // RealDataAdapter
  private useRealData: boolean = false;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.baseTime = new Date();
  }

  private getRandomInRange(min: number, max: number, noise: number = 0.1): number {
    const base = min + Math.random() * (max - min);
    const noiseValue = base * noise * (Math.random() - 0.5) * 2;
    return Math.max(min, Math.min(max, base + noiseValue));
  }

  private generateCyclicalValue(baseValue: number, amplitude: number, period: number, phase: number = 0): number {
    const timeInHours = (Date.now() - this.baseTime.getTime()) / (1000 * 60 * 60);
    const cyclical = Math.sin((2 * Math.PI * timeInHours / period) + phase);
    return baseValue + (amplitude * cyclical);
  }

  generateSensorReadings(): SensorReading[] {
    const sensors: SensorReading[] = [];
    const timestamp = new Date();

    // Kiln sensors
    sensors.push({
      timestamp,
      sensor_id: 'KILN_TEMP_01',
      value: this.generateCyclicalValue(1450, 50, 4, 0), // 4-hour cycle
      unit: '°C',
      location: 'Kiln Burning Zone',
      sensor_type: 'temperature'
    });

    sensors.push({
      timestamp,
      sensor_id: 'KILN_PRESSURE_01',
      value: this.getRandomInRange(-15, -5),
      unit: 'kPa',
      location: 'Kiln Inlet',
      sensor_type: 'pressure'
    });

    // Mill sensors
    sensors.push({
      timestamp,
      sensor_id: 'RAW_MILL_POWER_01',
      value: this.generateCyclicalValue(2800, 200, 6, Math.PI/4),
      unit: 'kW',
      location: 'Raw Mill',
      sensor_type: 'power'
    });

    sensors.push({
      timestamp,
      sensor_id: 'CEMENT_MILL_POWER_01',
      value: this.generateCyclicalValue(3200, 300, 8, Math.PI/2),
      unit: 'kW',
      location: 'Cement Mill',
      sensor_type: 'power'
    });

    // Production flow sensors
    sensors.push({
      timestamp,
      sensor_id: 'PRODUCTION_FLOW_01',
      value: this.generateCyclicalValue(this.config.plant_capacity * 0.85, this.config.plant_capacity * 0.1, 12),
      unit: 'TPH',
      location: 'Cement Silo',
      sensor_type: 'flow'
    });

    // Environmental sensors
    sensors.push({
      timestamp,
      sensor_id: 'EXHAUST_TEMP_01',
      value: this.getRandomInRange(320, 380),
      unit: '°C',
      location: 'Preheater Exit',
      sensor_type: 'temperature'
    });

    sensors.push({
      timestamp,
      sensor_id: 'DUST_LEVEL_01',
      value: this.getRandomInRange(15, 25),
      unit: 'mg/Nm³',
      location: 'Stack',
      sensor_type: 'flow'
    });

    // Quality sensors
    sensors.push({
      timestamp,
      sensor_id: 'FINENESS_01',
      value: this.getRandomInRange(340, 380),
      unit: 'm²/kg',
      location: 'Cement Mill Exit',
      sensor_type: 'flow'
    });

    return sensors;
  }

  generateProcessParameters(): ProcessParameters {
    const timestamp = new Date();
    const timeHours = (timestamp.getTime() - this.baseTime.getTime()) / (1000 * 60 * 60);
    
    // Simulate daily production cycles
    const productionCycle = Math.sin(2 * Math.PI * timeHours / 24);
    const efficiency = 0.8 + 0.15 * productionCycle + this.getRandomInRange(-0.05, 0.05, 0.5);
    
    const parameters: ProcessParameters = {
      timestamp,
      kiln_temperature: this.generateCyclicalValue(1450, 40, 4),
      kiln_pressure: this.getRandomInRange(-15, -5),
      raw_mill_power: this.generateCyclicalValue(2800, 200, 6) * efficiency,
      cement_mill_power: this.generateCyclicalValue(3200, 250, 8) * efficiency,
      production_rate: this.config.plant_capacity * efficiency,
      energy_consumption: this.getRandomInRange(85, 105) / efficiency, // kWh/ton
      alternative_fuel_rate: this.getRandomInRange(15, 35),
      raw_meal_flow: this.config.plant_capacity * 1.55 * efficiency, // Raw meal to clinker ratio ~1.55
      cement_fineness: this.getRandomInRange(340, 380),
      clinker_temperature: this.getRandomInRange(1100, 1200),
      exhaust_fan_speed: this.getRandomInRange(480, 520),
      preheater_temperature: this.getRandomInRange(320, 380)
    };

    this.lastParameters = parameters;
    return parameters;
  }

  generateQualityMetrics(): QualityMetrics {
    const timestamp = new Date();
    const qualityBase = 75 + Math.random() * 20; // Base quality 75-95

    return {
      timestamp,
      sample_id: `QS_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      blaine_fineness: this.getRandomInRange(340, 380),
      compressive_strength_3d: this.getRandomInRange(18, 25),
      compressive_strength_28d: this.getRandomInRange(42, 52),
      setting_time_initial: this.getRandomInRange(45, 90),
      setting_time_final: this.getRandomInRange(180, 300),
      quality_score: qualityBase,
      defect_count: Math.floor(this.getRandomInRange(0, 5)),
      consistency: this.getRandomInRange(95, 99.5),
      chemical_composition: {
        c3s: this.getRandomInRange(50, 65),
        c2s: this.getRandomInRange(15, 25),
        c3a: this.getRandomInRange(8, 12),
        c4af: this.getRandomInRange(8, 12),
        so3: this.getRandomInRange(2.5, 3.5),
        free_lime: this.getRandomInRange(0.5, 1.5)
      }
    };
  }

  generateEquipmentStatus(): EquipmentStatus[] {
    const equipment = [
      { id: 'KILN_01', name: 'Rotary Kiln #1' },
      { id: 'RAW_MILL_01', name: 'Raw Mill #1' },
      { id: 'CEMENT_MILL_01', name: 'Cement Mill #1' },
      { id: 'PREHEATER_01', name: 'Preheater Tower' },
      { id: 'COOLER_01', name: 'Grate Cooler' },
      { id: 'CRUSHER_01', name: 'Limestone Crusher' },
      { id: 'SEPARATOR_01', name: 'Cement Separator' },
      { id: 'FAN_01', name: 'Exhaust Fan' }
    ];

    return equipment.map(eq => ({
      equipment_id: eq.id,
      equipment_name: eq.name,
      status: Math.random() > 0.05 ? 'running' : Math.random() > 0.5 ? 'maintenance' : 'error',
      efficiency: this.getRandomInRange(85, 98),
      temperature: this.getRandomInRange(45, 85),
      vibration_level: this.getRandomInRange(0.5, 8.0),
      power_consumption: this.getRandomInRange(800, 3500), // kW
      runtime_hours: this.getRandomInRange(1000, 8760), // Annual hours
      last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      location: `Plant Section ${Math.floor(Math.random() * 3) + 1}`,
      alerts: this.generateAlertsForEquipment(eq.id).map(alert => alert.message)
    }));
  }

  private generateAlertsForEquipment(equipmentId: string): Alert[] {
    const alerts: Alert[] = [];
    
    // Random chance of alerts
    if (Math.random() < 0.3) {
      alerts.push({
        id: uuidv4(),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        type: ['temperature', 'vibration', 'power', 'efficiency'][Math.floor(Math.random() * 4)] as any,
        message: `${equipmentId}: Parameter deviation detected`,
        acknowledged: Math.random() > 0.3,
        resolved: Math.random() > 0.6,
        equipment_id: equipmentId
      });
    }

    return alerts;
  }

  generateEnvironmentalData(): EnvironmentalData {
    const timestamp = new Date();
    const productionRate = this.lastParameters?.production_rate || this.config.plant_capacity * 0.8;

    return {
      timestamp,
      co2_emissions: this.getRandomInRange(820, 950), // kg CO2/ton cement
      nox_emissions: this.getRandomInRange(400, 800),
      so2_emissions: this.getRandomInRange(50, 200),
      dust_emissions: this.getRandomInRange(15, 30),
      energy_consumption_specific: this.getRandomInRange(85, 105),
      alternative_fuel_substitution: this.getRandomInRange(15, 35),
      waste_heat_recovery: productionRate * this.getRandomInRange(20, 35), // kWh
      water_consumption: this.getRandomInRange(200, 350) // L/ton
    };
  }

  generatePlantOverview(): PlantOverview {
    const timestamp = new Date();
    const equipmentStatus = this.generateEquipmentStatus();
    const runningEquipment = equipmentStatus.filter(eq => eq.status === 'running').length;
    const activeAlerts = equipmentStatus.reduce((total, eq) => total + eq.alerts.length, 0);

    return {
      timestamp,
      overall_efficiency: this.getRandomInRange(82, 94),
      production_rate_current: this.lastParameters?.production_rate || this.config.plant_capacity * 0.85,
      production_rate_target: this.config.plant_capacity,
      energy_consumption_current: this.getRandomInRange(85, 105),
      energy_consumption_target: 90,
      quality_score_avg: this.getRandomInRange(88, 96),
      active_alerts_count: activeAlerts,
      equipment_running_count: runningEquipment,
      equipment_total_count: equipmentStatus.length,
      environmental_compliance: Math.random() > 0.1 // 90% compliance
    };
  }

  // Simulate anomalies for testing AI detection
  injectAnomaly(type: 'temperature' | 'power' | 'quality' | 'vibration'): void {
    // This method would modify the next generated data to include anomalies
    console.log(`Injecting ${type} anomaly for testing`);
  }

  startSimulation(interval: number = 5000): void {
    this.simulationRunning = true;
    console.log(`Starting cement plant simulation with ${interval}ms interval`);
  }

  stopSimulation(): void {
    this.simulationRunning = false;
    console.log('Stopping cement plant simulation');
  }

  isRunning(): boolean {
    return this.simulationRunning;
  }
}