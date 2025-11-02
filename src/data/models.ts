// Cement Plant Data Models and Type Definitions

export interface SensorReading {
  timestamp: Date;
  sensor_id: string;
  value: number;
  unit: string;
  location: string;
  sensor_type: 'temperature' | 'pressure' | 'flow' | 'power' | 'vibration' | 'ph' | 'humidity';
}

export interface ProcessParameters {
  timestamp: Date;
  kiln_temperature: number; // °C
  kiln_pressure: number; // kPa
  raw_mill_power: number; // kW
  cement_mill_power: number; // kW
  production_rate: number; // TPH (Tons Per Hour)
  energy_consumption: number; // kWh/ton
  alternative_fuel_rate: number; // %
  raw_meal_flow: number; // TPH
  cement_fineness: number; // Blaine (m²/kg)
  clinker_temperature: number; // °C
  exhaust_fan_speed: number; // RPM
  preheater_temperature: number; // °C
}

export interface QualityMetrics {
  timestamp: Date;
  sample_id: string;
  blaine_fineness: number; // m²/kg
  compressive_strength_3d: number; // MPa
  compressive_strength_28d: number; // MPa
  setting_time_initial: number; // minutes
  setting_time_final: number; // minutes
  quality_score: number; // 0-100
  defect_count: number;
  consistency: number; // %
  chemical_composition: {
    c3s: number; // %
    c2s: number; // %
    c3a: number; // %
    c4af: number; // %
    so3: number; // %
    free_lime: number; // %
  };
}

export interface EquipmentStatus {
  equipment_id: string;
  equipment_name: string;
  status: 'running' | 'stopped' | 'maintenance' | 'error';
  efficiency: number; // %
  temperature: number; // °C
  vibration_level: number;
  power_consumption: number; // kW
  runtime_hours: number;
  last_maintenance: Date;
  location: string;
  alerts: string[];
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'temperature' | 'vibration' | 'power' | 'quality' | 'efficiency' | 'maintenance';
  message: string;
  acknowledged: boolean;
  resolved: boolean;
  equipment_id?: string;
}

export interface ProductionBatch {
  batch_id: string;
  start_time: Date;
  end_time?: Date;
  target_quantity: number; // tons
  actual_quantity: number; // tons
  cement_type: string;
  quality_parameters: QualityMetrics;
  energy_consumed: number; // kWh
  raw_materials: {
    limestone: number; // tons
    clay: number; // tons
    iron_ore: number; // tons
    gypsum: number; // tons
    alternative_fuels: number; // tons
  };
}

export interface EnvironmentalData {
  timestamp: Date;
  co2_emissions: number; // kg/ton cement
  nox_emissions: number; // mg/Nm³
  so2_emissions: number; // mg/Nm³
  dust_emissions: number; // mg/Nm³
  energy_consumption_specific: number; // kWh/ton
  alternative_fuel_substitution: number; // %
  waste_heat_recovery: number; // kWh
  water_consumption: number; // L/ton
}

export interface AIRecommendation {
  id: string;
  timestamp: Date;
  type: 'energy_optimization' | 'quality_improvement' | 'maintenance' | 'environmental';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expected_benefit: string;
  implementation_steps: string[];
  confidence_score: number; // 0-100
  parameters_to_adjust: {
    parameter: string;
    current_value: number;
    recommended_value: number;
    unit: string;
  }[];
}

export interface PlantOverview {
  timestamp: Date;
  overall_efficiency: number; // %
  production_rate_current: number; // TPH
  production_rate_target: number; // TPH
  energy_consumption_current: number; // kWh/ton
  energy_consumption_target: number; // kWh/ton
  quality_score_avg: number; // 0-100
  active_alerts_count: number;
  equipment_running_count: number;
  equipment_total_count: number;
  environmental_compliance: boolean;
}

// ML Model Predictions
export interface EnergyPrediction {
  timestamp: Date;
  predicted_consumption: number; // kWh/ton
  confidence_interval: {
    lower: number;
    upper: number;
  };
  prediction_horizon: number; // hours
  factors: {
    factor: string;
    impact: number; // -1 to 1
  }[];
}

export interface QualityPrediction {
  timestamp: Date;
  predicted_quality_score: number; // 0-100
  risk_factors: string[];
  recommendations: string[];
  defect_probability: number; // 0-1
}

export interface AnomalyDetection {
  timestamp: Date;
  anomaly_score: number; // 0-1
  affected_systems: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommended_actions: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: Date;
}

export interface DashboardData {
  plant_overview: PlantOverview;
  recent_sensors: SensorReading[];
  current_parameters: ProcessParameters;
  recent_quality: QualityMetrics[];
  equipment_status: EquipmentStatus[];
  active_alerts: Alert[];
  ai_recommendations: AIRecommendation[];
  environmental_data: EnvironmentalData;
}

// Simulation Configuration
export interface SimulationConfig {
  plant_capacity: number; // TPH
  sensor_count: number;
  simulation_speed: number; // 1 = real-time
  noise_level: number; // 0-1
  anomaly_probability: number; // 0-1
  quality_variation: number; // 0-1
}