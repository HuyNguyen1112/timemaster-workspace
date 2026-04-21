import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { Task } from './task.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async initLocalNotifications() {
    // Only ask for basic permissions, no push token logic
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    if (Platform.OS === 'android') {
      const settings = (await Notifications.getPermissionsAsync()) as any;
      if (!settings.android?.allowsExactAlarms) {
        console.log('[Notification] Exact alarms not allowed. Please check system settings if alarms are late.');
      }

      await Notifications.setNotificationChannelAsync('tm-alarms', {
        name: 'TimeMaster Alarms',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
    }
  }

  async scheduleTaskNotification(task: Task) {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      if (!task.id || !task.startTime || !task.targetDate) return;

      await this.cancelTaskNotification(task.id);

      const triggerDate = this.calculateTriggerDate(task.targetDate, task.startTime);
      if (!triggerDate) return;

      const now = Date.now();
      const diffMs = triggerDate.getTime() - now;
      const secondsUntil = Math.floor(diffMs / 1000);

      if (secondsUntil < -30) {
        console.log(`[Notification] Task "${task.title}" is in the past. Skipping.`);
        return;
      }

      const finalSeconds = secondsUntil <= 2 ? 2 : secondsUntil;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Đến giờ: ${task.title}`,
          body: task.description || 'Đã đến giờ thực hiện công việc bạn đã lên lịch!',
          data: { taskId: task.id },
          sound: 'default',
          priority: Notifications.AndroidImportance.MAX as any,
          android: {
            channelId: 'tm-alarms',
          },
        } as any,
        trigger: {
          type: 'timeInterval',
          seconds: finalSeconds,
          repeats: false,
          preciseAlarm: true, // Key for exact timing on Android 12+
        } as any,
      });

      console.log(`[Notification] Scheduled #${id} for task ${task.id} in ${finalSeconds}s.`);
      return id;
    } catch (error: any) {
      console.error('[Notification] Error scheduling:', error);
    }
  }

  async testNotificationNow() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await this.initLocalNotifications();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Kiểm tra Chuông TimeMaster',
          body: 'Hệ thống báo thức đã sẵn sàng! Chuông sẽ reo sau 5 giây.',
          sound: 'default',
          priority: Notifications.AndroidImportance.MAX as any,
          android: {
            channelId: 'tm-alarms',
          },
        } as any,
        trigger: {
          type: 'timeInterval',
          seconds: 5,
          preciseAlarm: true,
        } as any,
      });
      
      Alert.alert('Thành công', 'Chuông sẽ reo sau đúng 5 giây nữa!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    }
  }

  async cancelTaskNotification(taskId: number) {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const notificationsToCancel = scheduled.filter(n => n.content.data?.taskId === taskId);
      
      for (const n of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
        console.log(`Cancelled notification ${n.identifier} for task ${taskId}`);
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  private calculateTriggerDate(targetDate: any, startTime: any): Date | null {
    try {
      // Handle targetDate (could be string "2026-04-19" or Date object)
      let year, month, day;
      if (typeof targetDate === 'string') {
        [year, month, day] = targetDate.split('-').map(Number);
      } else if (Array.isArray(targetDate)) {
        [year, month, day] = targetDate;
      } else {
        const d = new Date(targetDate);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }

      // Handle startTime (could be string "23:10:00" or array [23, 10])
      let hour, minute;
      if (typeof startTime === 'string') {
        const parts = startTime.split(':').map(Number);
        hour = parts[0];
        minute = parts[1];
      } else if (Array.isArray(startTime)) {
        [hour, minute] = startTime;
      } else {
        return null;
      }
      
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        return null;
      }

      return new Date(year, month - 1, day, hour, minute, 0);
    } catch (e) {
      console.error('Error parsing notification date:', e);
      return null;
    }
  }

  // Singleton storage for the last task ID clicked from a notification
  private lastClickedTaskId: number | null = null;

  setLastClickedTaskId(id: number) {
    this.lastClickedTaskId = id;
  }

  consumeLastClickedTaskId(): number | null {
    const id = this.lastClickedTaskId;
    this.lastClickedTaskId = null; // Clear after consuming
    return id;
  }
}

export const notificationService = new NotificationService();
