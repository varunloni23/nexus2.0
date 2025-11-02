import { DashboardData, ProcessParameters, EnvironmentalData } from '../data/models';

export interface GeminiResponse {
  response: string;
  confidence: number;
  recommendations?: string[];
  context_used: string[];
}

export class GeminiService {
  private apiKey: string;
  private readonly baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private customSystemPrompt: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Set a custom system prompt for the AI Assistant
   */
  setCustomSystemPrompt(prompt: string): void {
    this.customSystemPrompt = prompt;
  }

  /**
   * Get the current custom system prompt
   */
  getCustomSystemPrompt(): string | null {
    return this.customSystemPrompt;
  }

  /**
   * Clear the custom system prompt and revert to default
   */
  clearCustomSystemPrompt(): void {
    this.customSystemPrompt = null;
  }

  /**
   * Generate context-aware responses for cement plant operations
   */
  async askGemini(
    question: string, 
    dashboardData?: DashboardData,
    plantContext?: ProcessParameters
  ): Promise<GeminiResponse> {
    try {
      console.log('🔍 askGemini called with question:', question);
      
      const systemPrompt = this.buildSystemPrompt();
      const contextualPrompt = this.buildContextualPrompt(question, dashboardData, plantContext);
      
      const fullPrompt = systemPrompt + '\n\n' + contextualPrompt;
      console.log('📤 Full prompt being sent to Gemini (first 200 chars):', fullPrompt.substring(0, 200));
      
      const response = await this.callGeminiAPI(fullPrompt);
      
      console.log('📥 Gemini response received:', response.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 150));
      
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        response: 'I apologize, but I am currently unable to access the AI system. Please try again later.',
        confidence: 0,
        context_used: ['error']
      };
    }
  }

  /**
   * Generate optimization recommendations based on current plant data
   */
  async generateOptimizationRecommendations(dashboardData: DashboardData): Promise<GeminiResponse> {
    const prompt = `
Based on the current cement plant operational data, provide specific optimization recommendations:

Current Status:
- Overall Efficiency: ${dashboardData.plant_overview.overall_efficiency.toFixed(1)}%
- Production Rate: ${dashboardData.plant_overview.production_rate_current.toFixed(0)} TPH (Target: ${dashboardData.plant_overview.production_rate_target} TPH)
- Energy Consumption: ${dashboardData.plant_overview.energy_consumption_current.toFixed(1)} kWh/ton (Target: ${dashboardData.plant_overview.energy_consumption_target} kWh/ton)
- Quality Score: ${dashboardData.plant_overview.quality_score_avg.toFixed(1)}

Process Parameters:
- Kiln Temperature: ${dashboardData.current_parameters.kiln_temperature.toFixed(0)}°C
- Raw Mill Power: ${dashboardData.current_parameters.raw_mill_power.toFixed(0)} kW
- Cement Mill Power: ${dashboardData.current_parameters.cement_mill_power.toFixed(0)} kW
- Alternative Fuel Rate: ${dashboardData.current_parameters.alternative_fuel_rate.toFixed(1)}%

Environmental Data:
- CO2 Emissions: ${dashboardData.environmental_data.co2_emissions.toFixed(0)} kg/ton
- Alternative Fuel Substitution: ${dashboardData.environmental_data.alternative_fuel_substitution.toFixed(1)}%

Please provide:
1. Top 3 optimization opportunities
2. Specific parameter adjustments
3. Expected benefits
4. Implementation priority

Focus on energy efficiency, environmental impact, and production optimization.
`;

    return this.askGemini(prompt, dashboardData);
  }

  /**
   * Explain anomalies or alerts
   */
  async explainAnomaly(
    anomalyType: string, 
    currentValue: number, 
    normalRange: string,
    dashboardData?: DashboardData
  ): Promise<GeminiResponse> {
    const prompt = `
Explain the following cement plant anomaly:

Anomaly Type: ${anomalyType}
Current Value: ${currentValue}
Normal Range: ${normalRange}

Please explain:
1. What this anomaly indicates
2. Potential root causes
3. Immediate actions to take
4. Long-term prevention strategies
5. Impact on production and quality

Provide clear, actionable guidance for plant operators.
`;

    return this.askGemini(prompt, dashboardData);
  }

  /**
   * Build system prompt for cement plant context
   */
  private buildSystemPrompt(): string {
    // Use custom system prompt if set, otherwise use default
    if (this.customSystemPrompt) {
      return this.customSystemPrompt;
    }
    
    // Default system prompt for cement plant operations
    return `
You are CementAI Nexus Assistant, an expert AI system for cement plant operations. You have deep knowledge of:

1. Cement Manufacturing Process:
   - Raw material preparation and grinding
   - Pyroprocessing in rotary kilns
   - Clinker cooling and cement grinding
   - Quality control and testing

2. Equipment and Systems:
   - Rotary kilns, preheaters, and coolers
   - Raw mills and cement mills
   - Fans, separators, and conveyors
   - Control systems and instrumentation

3. Process Optimization:
   - Energy efficiency improvements
   - Alternative fuel utilization
   - Emissions reduction strategies
   - Quality optimization techniques

4. Operational Excellence:
   - Preventive maintenance
   - Safety procedures
   - Environmental compliance
   - Cost optimization

Always provide:
- Clear, actionable recommendations
- Specific technical explanations
- Safety considerations
- Environmental impact awareness
- Cost-benefit analysis when relevant

Keep responses concise but comprehensive, suitable for plant operators and engineers.
`;
  }

  /**
   * Build contextual prompt with current plant data
   */
  private buildContextualPrompt(
    question: string, 
    dashboardData?: DashboardData,
    plantContext?: ProcessParameters
  ): string {
    let contextPrompt = `Question: ${question}\n\n`;

    if (dashboardData) {
      contextPrompt += `Current Plant Status:\n`;
      contextPrompt += `- Overall Efficiency: ${dashboardData.plant_overview.overall_efficiency.toFixed(1)}%\n`;
      contextPrompt += `- Production Rate: ${dashboardData.plant_overview.production_rate_current.toFixed(0)} TPH\n`;
      contextPrompt += `- Energy Consumption: ${dashboardData.plant_overview.energy_consumption_current.toFixed(1)} kWh/ton\n`;
      contextPrompt += `- Quality Score: ${dashboardData.plant_overview.quality_score_avg.toFixed(1)}\n`;
      contextPrompt += `- Active Alerts: ${dashboardData.plant_overview.active_alerts_count}\n\n`;

      contextPrompt += `Key Process Parameters:\n`;
      contextPrompt += `- Kiln Temperature: ${dashboardData.current_parameters.kiln_temperature.toFixed(0)}°C\n`;
      contextPrompt += `- Raw Mill Power: ${dashboardData.current_parameters.raw_mill_power.toFixed(0)} kW\n`;
      contextPrompt += `- Cement Mill Power: ${dashboardData.current_parameters.cement_mill_power.toFixed(0)} kW\n`;
      contextPrompt += `- Alternative Fuel Rate: ${dashboardData.current_parameters.alternative_fuel_rate.toFixed(1)}%\n\n`;

      contextPrompt += `Environmental Metrics:\n`;
      contextPrompt += `- CO2 Emissions: ${dashboardData.environmental_data.co2_emissions.toFixed(0)} kg/ton\n`;
      contextPrompt += `- Alternative Fuel Substitution: ${dashboardData.environmental_data.alternative_fuel_substitution.toFixed(1)}%\n\n`;
    }

    return contextPrompt;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<any> {
    try {
      console.log('🌐 Making API call to Gemini...');
      
      // Make actual API call to Google Gemini
      const response = await fetch(this.baseURL + `?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Check if response has expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Unexpected Gemini API response structure:', JSON.stringify(data));
        throw new Error('Invalid response structure from Gemini API');
      }

      return data;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Fallback to a generic response if API call fails
      return {
        candidates: [{
          content: {
            parts: [{
              text: `I apologize, but I'm having trouble connecting to the AI service right now. 

However, based on your question, I can provide general guidance:

For cement plant operations, the key areas to focus on are:
- **Process Control**: Maintaining stable kiln temperature, consistent raw meal feed, and optimal mill operations
- **Quality Assurance**: Regular testing of cement properties, monitoring fineness and strength development
- **Energy Efficiency**: Optimizing fuel consumption, utilizing alternative fuels, and reducing specific energy consumption
- **Environmental Compliance**: Managing emissions, dust control, and sustainable practices

Please try your question again, or feel free to ask more specific questions about:
- Kiln operation and temperature control
- Quality parameters and testing
- Energy optimization strategies
- Environmental compliance
- Maintenance and reliability

I'll do my best to provide detailed, context-aware recommendations based on your current plant data.`
            }]
          }
        }]
      };
    }
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(response: any): GeminiResponse {
    try {
      const text = response.candidates[0].content.parts[0].text;
      
      // Extract recommendations if present
      const recommendations = this.extractRecommendations(text);
      
      return {
        response: text,
        confidence: 0.85, // Mock confidence score
        recommendations,
        context_used: ['plant_data', 'process_parameters', 'environmental_metrics']
      };
    } catch (error) {
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Extract actionable recommendations from response text
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    
    // Simple pattern matching for recommendations
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('Reduce') || line.includes('Increase') || line.includes('Optimize') || 
          line.includes('Adjust') || line.includes('Monitor') || line.includes('Check')) {
        const cleaned = line.replace(/^\W+/, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      }
    });

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Generate energy efficiency insights
   */
  async generateEnergyInsights(processData: ProcessParameters): Promise<GeminiResponse> {
    const prompt = `
Analyze current energy consumption patterns and provide efficiency insights:

Current Energy Consumption: ${processData.energy_consumption.toFixed(1)} kWh/ton
Raw Mill Power: ${processData.raw_mill_power.toFixed(0)} kW
Cement Mill Power: ${processData.cement_mill_power.toFixed(0)} kW
Kiln Temperature: ${processData.kiln_temperature.toFixed(0)}°C
Alternative Fuel Rate: ${processData.alternative_fuel_rate.toFixed(1)}%

Provide specific insights on:
1. Energy consumption benchmark comparison
2. Optimization opportunities
3. Expected savings potential
4. Implementation roadmap
`;

    return this.askGemini(prompt);
  }

  /**
   * Detect input fluctuations and provide proactive quality corrections
   */
  async detectQualityFluctuations(
    currentData: DashboardData,
    historicalData?: ProcessParameters[]
  ): Promise<GeminiResponse> {
    const { current_parameters, plant_overview, environmental_data } = currentData;
    
    // Analyze current vs target parameters
    const kilnTempDeviation = Math.abs(current_parameters.kiln_temperature - 1450) / 1450 * 100; // Assuming 1450°C is optimal
    const productionDeviation = Math.abs(plant_overview.production_rate_current - plant_overview.production_rate_target) / plant_overview.production_rate_target * 100;
    const energyDeviation = Math.abs(plant_overview.energy_consumption_current - plant_overview.energy_consumption_target) / plant_overview.energy_consumption_target * 100;
    
    const prompt = `
PERFORM REAL-TIME QUALITY FLUCTUATION ANALYSIS:

CURRENT PROCESS STATUS:
- Kiln Temperature: ${current_parameters.kiln_temperature.toFixed(0)}°C (Deviation: ${kilnTempDeviation.toFixed(1)}% from optimal)
- Production Rate: ${plant_overview.production_rate_current.toFixed(0)} TPH vs Target: ${plant_overview.production_rate_target} TPH (Deviation: ${productionDeviation.toFixed(1)}%)
- Energy Consumption: ${plant_overview.energy_consumption_current.toFixed(1)} vs Target: ${plant_overview.energy_consumption_target} kWh/ton (Deviation: ${energyDeviation.toFixed(1)}%)
- Quality Score: ${plant_overview.quality_score_avg.toFixed(1)}/10
- Active Alerts: ${plant_overview.active_alerts_count}

PROCESS PARAMETERS:
- Raw Mill Power: ${current_parameters.raw_mill_power.toFixed(0)} kW
- Cement Mill Power: ${current_parameters.cement_mill_power.toFixed(0)} kW
- Raw Meal Flow: ${current_parameters.raw_meal_flow.toFixed(1)} TPH
- Alternative Fuel Rate: ${current_parameters.alternative_fuel_rate.toFixed(1)}%
- Exhaust Fan Speed: ${current_parameters.exhaust_fan_speed.toFixed(0)} RPM

ENVIRONMENTAL METRICS:
- CO2 Emissions: ${environmental_data.co2_emissions.toFixed(0)} kg/ton
- NOx Emissions: ${environmental_data.nox_emissions.toFixed(1)} mg/Nm³
- Dust Emissions: ${environmental_data.dust_emissions.toFixed(1)} mg/Nm³

ANALYZE AND PROVIDE:

1. FLUCTUATION DETECTION:
   - Identify any concerning parameter deviations
   - Rate severity level (LOW/MEDIUM/HIGH)
   - Predict potential quality impact

2. ROOT CAUSE ANALYSIS:
   - Primary factors causing fluctuations
   - Interconnected parameter relationships
   - Historical pattern analysis

3. PROACTIVE CORRECTIONS:
   - Immediate adjustment recommendations
   - Parameter optimization sequence
   - Quality prevention strategies

4. PREDICTIVE INSIGHTS:
   - Short-term quality risk assessment
   - Recommended monitoring focus areas
   - Process stability recommendations

5. IMPLEMENTATION PRIORITY:
   - Critical actions (next 15 minutes)
   - Medium-term adjustments (next hour)
   - Long-term optimization (next shift)

Provide specific, actionable guidance for plant operators to maintain consistent cement quality.
`;

    return this.askGemini(prompt, currentData);
  }

  /**
   * Analyze quality trends and predict potential issues
   */
  async analyzeQualityTrends(
    qualityHistory: any[],
    currentData: DashboardData
  ): Promise<GeminiResponse> {
    const prompt = `
QUALITY TREND ANALYSIS & PREDICTIVE INSIGHTS:

CURRENT QUALITY STATUS:
- Overall Quality Score: ${currentData.plant_overview.quality_score_avg.toFixed(1)}/10
- Quality Variation Indicator: ${currentData.plant_overview.active_alerts_count} active alerts
- Production Efficiency: ${currentData.plant_overview.overall_efficiency.toFixed(1)}%

QUALITY TREND ANALYSIS REQUEST:
Analyze the following patterns and provide predictive quality insights:

1. TREND IDENTIFICATION:
   - Identify quality degradation patterns
   - Seasonal or cyclical variations
   - Process drift indicators

2. PREDICTIVE QUALITY ASSESSMENT:
   - Next 4-hour quality forecast
   - Risk probability assessment
   - Early warning indicators

3. PREVENTIVE RECOMMENDATIONS:
   - Process adjustments to prevent quality issues
   - Optimal parameter ranges for stability
   - Quality assurance checkpoints

4. CONTINUOUS IMPROVEMENT:
   - Long-term quality optimization strategies
   - Best practice implementation
   - Quality control enhancement suggestions

Provide data-driven insights for proactive quality management.
`;

    return this.askGemini(prompt, currentData);
  }

  /**
   * Generate real-time process optimization recommendations
   */
  async generateRealTimeOptimization(
    currentData: DashboardData,
    targetObjective: 'quality' | 'energy' | 'production' | 'environment'
  ): Promise<GeminiResponse> {
    const objectivePrompts = {
      quality: 'Focus on maintaining and improving cement quality consistency',
      energy: 'Optimize for minimum energy consumption while maintaining quality',
      production: 'Maximize production throughput while ensuring quality standards',
      environment: 'Minimize environmental impact and emissions'
    };

    const prompt = `
REAL-TIME PROCESS OPTIMIZATION REQUEST:

OBJECTIVE: ${objectivePrompts[targetObjective]}

CURRENT PLANT STATUS:
- Overall Efficiency: ${currentData.plant_overview.overall_efficiency.toFixed(1)}%
- Production Rate: ${currentData.plant_overview.production_rate_current.toFixed(0)}/${currentData.plant_overview.production_rate_target} TPH
- Energy Consumption: ${currentData.plant_overview.energy_consumption_current.toFixed(1)}/${currentData.plant_overview.energy_consumption_target} kWh/ton
- Quality Score: ${currentData.plant_overview.quality_score_avg.toFixed(1)}/10

PROCESS PARAMETERS:
- Kiln Temperature: ${currentData.current_parameters.kiln_temperature.toFixed(0)}°C
- Raw Mill Power: ${currentData.current_parameters.raw_mill_power.toFixed(0)} kW
- Cement Mill Power: ${currentData.current_parameters.cement_mill_power.toFixed(0)} kW
- Alternative Fuel Rate: ${currentData.current_parameters.alternative_fuel_rate.toFixed(1)}%
- Raw Meal Flow: ${currentData.current_parameters.raw_meal_flow.toFixed(1)} TPH
- Exhaust Fan Speed: ${currentData.current_parameters.exhaust_fan_speed.toFixed(0)} RPM

PROVIDE REAL-TIME OPTIMIZATION:

1. IMMEDIATE ADJUSTMENTS (Next 15 minutes):
   - Critical parameter modifications
   - Safety considerations
   - Expected immediate impact

2. SHORT-TERM OPTIMIZATION (Next 1-2 hours):
   - Gradual parameter tuning
   - Process stabilization steps
   - Quality monitoring checkpoints

3. MEDIUM-TERM STRATEGY (Next 4-8 hours):
   - Sustained optimization approach
   - Performance target achievement
   - Continuous improvement actions

4. RISK ASSESSMENT:
   - Potential optimization risks
   - Mitigation strategies
   - Rollback procedures if needed

5. SUCCESS METRICS:
   - Key performance indicators to monitor
   - Expected improvement percentages
   - Validation criteria

Provide specific, implementable optimization steps with clear timelines and expected outcomes.
`;

    return this.askGemini(prompt, currentData);
  }

  /**
   * Generate proactive quality corrections based on input fluctuations
   */
  async generateProactiveCorrections(
    currentData: DashboardData,
    fluctuations: any[],
    historicalTrends: any[]
  ): Promise<GeminiResponse> {
    const prompt = `
PROACTIVE QUALITY CORRECTIONS ANALYSIS:

OBJECTIVE: Generate specific corrective actions to prevent quality issues based on detected input fluctuations.

CURRENT PLANT DATA:
- Quality Score: ${currentData.plant_overview.quality_score_avg.toFixed(1)}/10
- Overall Efficiency: ${currentData.plant_overview.overall_efficiency.toFixed(1)}%
- Production Rate: ${currentData.plant_overview.production_rate_current.toFixed(0)} TPH
- Energy Consumption: ${currentData.plant_overview.energy_consumption_current.toFixed(1)} kWh/ton

CRITICAL PROCESS PARAMETERS:
- Kiln Temperature: ${currentData.current_parameters.kiln_temperature.toFixed(0)}°C
- Raw Mill Power: ${currentData.current_parameters.raw_mill_power.toFixed(0)} kW
- Cement Mill Power: ${currentData.current_parameters.cement_mill_power.toFixed(0)} kW
- Raw Meal Flow: ${currentData.current_parameters.raw_meal_flow.toFixed(1)} TPH
- Alternative Fuel Rate: ${currentData.current_parameters.alternative_fuel_rate.toFixed(1)}%

DETECTED FLUCTUATIONS:
${fluctuations.length > 0 ? 
  fluctuations.map(f => `- ${f.parameter}: ${f.current_value} (${f.deviation_percent?.toFixed(1)}% deviation, ${f.severity} severity)`).join('\n') :
  '- No significant fluctuations detected'
}

PROVIDE PROACTIVE QUALITY CORRECTIONS:

1. IMMEDIATE CORRECTIVE ACTIONS (0-15 minutes):
   - Parameter adjustments to prevent quality drift
   - Critical control interventions
   - Operator alert priorities

2. PREVENTIVE MEASURES (15 minutes - 1 hour):
   - Process stabilization steps
   - Quality assurance checkpoints
   - Monitoring intensification areas

3. ROOT CAUSE ELIMINATION (1-4 hours):
   - Systematic parameter optimization
   - Process control improvements
   - Quality consistency enhancement

4. PREDICTIVE PREVENTION (4+ hours):
   - Long-term stability measures
   - Quality control system optimization
   - Continuous improvement actions

5. SUCCESS VALIDATION:
   - Key quality indicators to monitor
   - Expected improvement timelines
   - Quality consistency metrics

6. RISK MITIGATION:
   - Potential side effects of corrections
   - Safety considerations
   - Process stability risks

Focus on actionable, specific corrections that plant operators can implement immediately to ensure quality consistency.
`;

    return this.askGemini(prompt, currentData);
  }

  /**
   * Analyze input parameter fluctuations and stability
   */
  async analyzeInputFluctuations(
    parameters: ProcessParameters,
    thresholds: any,
    historicalData: any[]
  ): Promise<GeminiResponse> {
    const prompt = `
INPUT FLUCTUATION STABILITY ANALYSIS:

CURRENT PARAMETERS:
- Kiln Temperature: ${parameters.kiln_temperature.toFixed(0)}°C
- Raw Mill Power: ${parameters.raw_mill_power.toFixed(0)} kW  
- Cement Mill Power: ${parameters.cement_mill_power.toFixed(0)} kW
- Raw Meal Flow: ${parameters.raw_meal_flow.toFixed(1)} TPH
- Alternative Fuel Rate: ${parameters.alternative_fuel_rate.toFixed(1)}%
- Clinker Temperature: ${parameters.clinker_temperature.toFixed(0)}°C
- Exhaust Fan Speed: ${parameters.exhaust_fan_speed.toFixed(0)} RPM

STABILITY ANALYSIS REQUEST:

1. FLUCTUATION ASSESSMENT:
   - Parameter stability evaluation
   - Deviation from optimal ranges
   - Trend analysis and patterns

2. IMPACT PREDICTION:
   - Quality impact assessment
   - Production efficiency effects
   - Energy consumption implications

3. STABILIZATION RECOMMENDATIONS:
   - Immediate control actions
   - Parameter tuning strategies
   - Process optimization steps

4. MONITORING PRIORITIES:
   - Critical parameters to watch
   - Alert threshold recommendations
   - Quality assurance checkpoints

5. PREVENTIVE MEASURES:
   - Proactive control strategies
   - Process improvement opportunities
   - Long-term stability enhancement

Provide specific guidance for maintaining input parameter stability and ensuring consistent cement quality.
`;

    return this.askGemini(prompt);
  }
}

// Factory function to create Gemini service instance
export function createGeminiService(): GeminiService {
  const apiKey = process.env.GEMINI_API_KEY || 'demo-key';
  
  if (!apiKey || apiKey === 'demo-key') {
    console.warn('⚠️ WARNING: Gemini API key not found. Using demo mode.');
  } else {
    console.log('✅ Gemini API initialized successfully');
  }
  
  return new GeminiService(apiKey);
}