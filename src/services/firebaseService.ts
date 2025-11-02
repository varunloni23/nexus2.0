import admin from 'firebase-admin';
import { DashboardData, SensorReading, ProcessParameters } from '../data/models';

export class FirebaseService {
  private db: admin.database.Database | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      console.log('📝 Firebase running in demo mode (local storage only)');
      console.log('   ℹ️  Data will be processed locally without cloud persistence');
      this.isInitialized = true;
      this.db = null;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Store real-time dashboard data to Firebase
   */
  async storeDashboardData(data: DashboardData): Promise<void> {
    if (!this.isInitialized || !this.db) {
      console.log('🔄 Firebase not initialized, skipping data storage');
      return;
    }

    try {
      const timestamp = Date.now();
      const dataRef = this.db.ref('plant-data/dashboard');
      
      await dataRef.set({
        ...data,
        timestamp,
        last_updated: new Date().toISOString()
      });

      // Also store in historical data
      const historyRef = this.db.ref(`plant-data/history/${timestamp}`);
      await historyRef.set({
        plant_overview: data.plant_overview,
        current_parameters: data.current_parameters,
        environmental_data: data.environmental_data,
        timestamp,
        date: new Date().toISOString()
      });

      console.log('📊 Dashboard data stored to Firebase successfully');
    } catch (error) {
      console.error('❌ Error storing dashboard data to Firebase:', error);
    }
  }

  /**
   * Store sensor readings to Firebase
   */
  async storeSensorReadings(readings: SensorReading[]): Promise<void> {
    if (!this.isInitialized || !this.db) return;

    try {
      const timestamp = Date.now();
      const sensorsRef = this.db.ref('plant-data/sensors');
      
      const sensorData = readings.reduce((acc, reading) => {
        acc[reading.sensor_id] = {
          ...reading,
          timestamp
        };
        return acc;
      }, {} as any);

      await sensorsRef.set(sensorData);
      console.log(`📡 ${readings.length} sensor readings stored to Firebase`);
    } catch (error) {
      console.error('❌ Error storing sensor readings to Firebase:', error);
    }
  }

  /**
   * Store AI recommendations to Firebase
   */
  async storeAIRecommendations(recommendations: any[], context: string): Promise<void> {
    if (!this.isInitialized || !this.db) return;

    try {
      const timestamp = Date.now();
      const aiRef = this.db.ref('ai-insights/recommendations');
      
      await aiRef.push({
        recommendations,
        context,
        timestamp,
        date: new Date().toISOString()
      });

      console.log('🤖 AI recommendations stored to Firebase');
    } catch (error) {
      console.error('❌ Error storing AI recommendations to Firebase:', error);
    }
  }

  /**
   * Store quality analysis results to Firebase
   */
  async storeQualityAnalysis(analysis: any): Promise<void> {
    if (!this.isInitialized || !this.db) return;

    try {
      const timestamp = Date.now();
      const qualityRef = this.db.ref('quality-monitoring/analysis');
      
      await qualityRef.push({
        ...analysis,
        timestamp,
        date: new Date().toISOString()
      });

      console.log('🔍 Quality analysis stored to Firebase');
    } catch (error) {
      console.error('❌ Error storing quality analysis to Firebase:', error);
    }
  }

  /**
   * Retrieve dashboard data from Firebase
   */
  async getDashboardData(): Promise<DashboardData | null> {
    if (!this.isInitialized || !this.db) return null;

    try {
      const dataRef = this.db.ref('plant-data/dashboard');
      const snapshot = await dataRef.once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📊 Dashboard data retrieved from Firebase');
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error retrieving dashboard data from Firebase:', error);
      return null;
    }
  }

  /**
   * Retrieve historical data for analysis
   */
  async getHistoricalData(hoursBack: number = 24): Promise<any[]> {
    if (!this.isInitialized || !this.db) return [];

    try {
      const endTime = Date.now();
      const startTime = endTime - (hoursBack * 60 * 60 * 1000);
      
      const historyRef = this.db.ref('plant-data/history')
        .orderByKey()
        .startAt(startTime.toString())
        .endAt(endTime.toString());
      
      const snapshot = await historyRef.once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historicalData = Object.values(data);
        console.log(`📈 Retrieved ${historicalData.length} historical records from Firebase`);
        return historicalData;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error retrieving historical data from Firebase:', error);
      return [];
    }
  }

  /**
   * Set up real-time listeners for dashboard updates
   */
  setupRealtimeListeners(callback: (data: DashboardData) => void): void {
    if (!this.isInitialized || !this.db) {
      console.log('🔄 Firebase not initialized, skipping real-time listeners');
      return;
    }

    try {
      const dataRef = this.db.ref('plant-data/dashboard');
      
      dataRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          callback(data);
          console.log('🔄 Real-time data update received from Firebase');
        }
      });

      console.log('👂 Firebase real-time listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up Firebase real-time listeners:', error);
    }
  }

  /**
   * Check Firebase connection status
   */
  isConnected(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Firebase project info
   */
  getProjectInfo() {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      isConnected: this.isInitialized,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    };
  }
}

// Factory function to create Firebase service instance
export function createFirebaseService(): FirebaseService {
  return new FirebaseService();
}