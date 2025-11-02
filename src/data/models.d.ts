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
    kiln_temperature: number;
    kiln_pressure: number;
    raw_mill_power: number;
    cement_mill_power: number;
    production_rate: number;
    energy_consumption: number;
    alternative_fuel_rate: number;
    raw_meal_flow: number;
    cement_fineness: number;
    clinker_temperature: number;
    exhaust_fan_speed: number;
    preheater_temperature: number;
}
export interface QualityMetrics {
    timestamp: Date;
    sample_id: string;
    blaine_fineness: number;
    compressive_strength_3d: number;
    compressive_strength_28d: number;
    setting_time_initial: number;
    setting_time_final: number;
    quality_score: number;
    defect_count: number;
    consistency: number;
    chemical_composition: {
        c3s: number;
        c2s: number;
        c3a: number;
        c4af: number;
        so3: number;
        free_lime: number;
    };
}
export interface EquipmentStatus {
    equipment_id: string;
    equipment_name: string;
    status: 'running' | 'stopped' | 'maintenance' | 'fault';
    operating_hours: number;
    efficiency: number;
    last_maintenance: Date;
    next_maintenance: Date;
    alerts: Alert[];
    vibration_level: number;
    temperature: number;
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
    target_quantity: number;
    actual_quantity: number;
    cement_type: string;
    quality_parameters: QualityMetrics;
    energy_consumed: number;
    raw_materials: {
        limestone: number;
        clay: number;
        iron_ore: number;
        gypsum: number;
        alternative_fuels: number;
    };
}
export interface EnvironmentalData {
    timestamp: Date;
    co2_emissions: number;
    nox_emissions: number;
    so2_emissions: number;
    dust_emissions: number;
    energy_consumption_specific: number;
    alternative_fuel_substitution: number;
    waste_heat_recovery: number;
    water_consumption: number;
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
    confidence_score: number;
    parameters_to_adjust: {
        parameter: string;
        current_value: number;
        recommended_value: number;
        unit: string;
    }[];
}
export interface PlantOverview {
    timestamp: Date;
    overall_efficiency: number;
    production_rate_current: number;
    production_rate_target: number;
    energy_consumption_current: number;
    energy_consumption_target: number;
    quality_score_avg: number;
    active_alerts_count: number;
    equipment_running_count: number;
    equipment_total_count: number;
    environmental_compliance: boolean;
}
export interface EnergyPrediction {
    timestamp: Date;
    predicted_consumption: number;
    confidence_interval: {
        lower: number;
        upper: number;
    };
    prediction_horizon: number;
    factors: {
        factor: string;
        impact: number;
    }[];
}
export interface QualityPrediction {
    timestamp: Date;
    predicted_quality_score: number;
    risk_factors: string[];
    recommendations: string[];
    defect_probability: number;
}
export interface AnomalyDetection {
    timestamp: Date;
    anomaly_score: number;
    affected_systems: string[];
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommended_actions: string[];
}
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
export interface SimulationConfig {
    plant_capacity: number;
    sensor_count: number;
    simulation_speed: number;
    noise_level: number;
    anomaly_probability: number;
    quality_variation: number;
}
