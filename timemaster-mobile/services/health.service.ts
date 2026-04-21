import { Platform } from 'react-native';

// Optional import because it might not be available in Expo Go
let HealthConnect: any = null;
try {
  if (Platform.OS === 'android') {
    HealthConnect = require('react-native-health-connect');
  }
} catch (e) {
  console.log('Health Connect not available. Custom build required.');
}

export const healthService = {
  isAvailable: () => {
    try {
      // The package uses a Proxy that throws on any access if unlinked
      return !!HealthConnect && typeof HealthConnect.initialize === 'function';
    } catch (e) {
      return false;
    }
  },

  initialize: async () => {
    if (!HealthConnect) return false;
    try {
      return await HealthConnect.initialize();
    } catch (e) {
      console.error('Failed to initialize Health Connect:', e);
      return false;
    }
  },

  requestPermissions: async () => {
    if (!HealthConnect) return false;
    try {
      const granted = await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
      ]);
      return granted;
    } catch (e) {
      console.error('Failed to request permissions:', e);
      return false;
    }
  },

  getDailyMetrics: async (date: string) => {
    if (!HealthConnect) return { steps: 0, distance: 0 };
    
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Fetch Steps
      const stepRecords = await HealthConnect.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      const totalSteps = stepRecords.records.reduce((acc: number, cur: any) => acc + cur.count, 0);

      // Fetch Distance
      const distanceRecords = await HealthConnect.readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      const totalDistance = distanceRecords.records.reduce((acc: number, cur: any) => acc + cur.distance.inMeters, 0);

      return {
        steps: totalSteps,
        distance: totalDistance / 1000, // convert meters to km
      };
    } catch (e) {
      console.error('Failed to fetch health data:', e);
      return { steps: 0, distance: 0 };
    }
  }
};
