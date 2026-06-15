import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, LayoutGrid, ChevronRight, Briefcase, Heart, User, BookOpen, Star, Coffee, Gamepad2, Calendar, AlertTriangle } from 'lucide-react-native';
import { useCustomAlert } from '../../components/CustomAlertContext';
import AddTaskModal from '../../components/AddTaskModal';
import MatrixDetailModal from '../../components/MatrixDetailModal';
import ContextDetailModal from '../../components/ContextDetailModal';
import AddContextModal from '../../components/AddContextModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import { taskService, Task, mapTaskToUI } from '../../services/task.service';
import { contextService, Context } from '../../services/context.service';
import { eventService } from '../../services/event.service';
import { notificationService } from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert } = useCustomAlert();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddContextModal, setShowAddContextModal] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<any>(null);
  const [selectedContext, setSelectedContext] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [realContexts, setRealContexts] = useState<Context[]>([]);

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [contextToEdit, setContextToEdit] = useState<any>(null);
  const [allTaskDates, setAllTaskDates] = useState<string[]>([]);

  const quadrants = [
    { id: 'Q1', label: 'Urgent & Important', color: '#ef4444' },
    { id: 'Q2', label: 'Important, Not Urgent', color: '#8b5cf6' },
    { id: 'Q3', label: 'Urgent, Not Important', color: '#3b82f6' },
    { id: 'Q4', label: 'Casual / Relax', color: '#22c55e' },
  ];

  const iconMap: any = {
    Briefcase: <Briefcase size={20} />,
    Heart: <Heart size={20} />,
    BookOpen: <BookOpen size={20} />,
    User: <User size={20} />,
    Star: <Star size={20} />,
    Coffee: <Coffee size={20} />,
    Gamepad2: <Gamepad2 size={20} />,
  };

  const fetchContexts = useCallback(async () => {
    try {
      const data = await contextService.getContexts();
      setRealContexts(data);
    } catch (error) {
      console.error('Failed to fetch contexts', error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      if (!user) return;
      const allData = await taskService.getTasks(user.userId);

      const mappedTasks = allData.map(mapTaskToUI).sort((a: any, b: any) => {
        if (a.time === 'Anytime') return 1;
        if (b.time === 'Anytime') return -1;
        return a.time.localeCompare(b.time);
      });
      setTasks(mappedTasks);

      const dates = Array.from(new Set(allData.map(t => t.targetDate)));
      setAllTaskDates(dates);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchContexts()]);
    setRefreshing(false);
  }, [fetchTasks, fetchContexts]);

  const searchParams = useLocalSearchParams();
  const lastResponse = Notifications.useLastNotificationResponse();
  
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchContexts();
    }, [fetchTasks, fetchContexts])
  );

  const handleDeepLink = useCallback((tid: number) => {
    const openTask = (t: any) => {
      setSelectedTaskForDetail(mapTaskToUI(t));
      setShowDetailModal(true);
    };

    taskService.getTasks(user?.userId || 0).then(allTasks => {
      const t = allTasks.find(item => item.id === tid);
      if (t) openTask(t);
    }).catch(err => console.error('Deep link fetch failed', err));
  }, [user?.userId]);

  useEffect(() => {
    const tidFromUrl = searchParams.taskId ? Number(searchParams.taskId) : null;
    const tidFromNotify = lastResponse?.notification.request.content.data?.taskId;
    const finalTid = tidFromNotify || tidFromUrl;

    if (finalTid) {
      handleDeepLink(Number(finalTid));
      if (searchParams.taskId) {
        router.setParams({ taskId: undefined });
      }
    }
  }, [searchParams.taskId, lastResponse, user?.userId]);

  const toggleTask = async (id: number) => {
    try {
      if (!user) return;
      const task = tasks.find(t => t.id === id);
      setTasks(prev => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      await taskService.completeTask(user.userId, id);
      
      if (task && !task.done) {
        await notificationService.cancelTaskNotification(id);
      }
    } catch (error: any) {
      console.log('Toggle failed', error.message);
      fetchTasks();
    }
  };

  const handleTaskPress = (task: any) => {
    setSelectedTaskForDetail(task);
    setShowDetailModal(true);
  };

  const handleAddTask = async (taskData: any) => {
    try {
      if (!user) return;
      const payload = {
        title: taskData.title,
        description: taskData.description || '',
        targetDate: taskData.date,
        startTime: taskData.time ? taskData.time + ':00' : undefined,
        estimatedDuration: taskData.duration,
        matrixType: taskData.matrix,
        contextId: taskData.contextId,
        isFixed: taskData.isFixed
      };

      let savedTask: Task;
      if (taskData.id) {
        savedTask = await taskService.updateTask(user.userId, taskData.id, payload);
      } else {
        savedTask = await taskService.createTask(user.userId, payload);
      }

      if (savedTask) {
        await notificationService.scheduleTaskNotification(savedTask);
      }

      setShowAddModal(false);
      fetchTasks();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Operation failed. Please check inputs.';
      showAlert({ title: 'Lỗi', message: msg, type: 'error' });
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      let savedEvent;
      if (eventData.id) {
        savedEvent = await eventService.updateEvent(eventData.id, eventData);
      } else {
        savedEvent = await eventService.createEvent(eventData);
      }
      await notificationService.scheduleEventNotification(savedEvent);
      setShowAddModal(false);
      showAlert({ title: 'Thành công', message: 'Tạo sự kiện thành công!', type: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save event.';
      showAlert({ title: 'Lỗi', message: msg, type: 'error' });
    }
  };

  const handleSaveContext = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        iconName: data.iconName,
        colorCode: data.color || data.colorCode,
        schedules: data.schedules
      };

      if (data.id) {
        await contextService.updateContext(data.id, payload);
        showAlert({ title: 'Thành công', message: 'Cập nhật Context thành công!', type: 'success' });
      } else {
        await contextService.createContext(payload);
        showAlert({ title: 'Thành công', message: 'Tạo Context thành công!', type: 'success' });
      }
      
      fetchContexts();
      setContextToEdit(null);
    } catch (error: any) {
      console.log('Save context failed:', error.message);
      const msg = error.response?.data?.message || 'Không thể lưu Context.';
      showAlert({ title: 'Lỗi', message: msg, type: 'error' });
    }
  };

  const handleDeleteContext = async (id: number) => {
    try {
      await contextService.deleteContext(id);
      fetchContexts();
      fetchTasks(); 
    } catch (error: any) {
      console.log('Delete context failed:', error.message);
      const msg = error.response?.data?.message || 'Không thể xóa ngữ cảnh.';
      // Dùng setTimeout để tránh xung đột với hideAlert của dialog confirm cha
      setTimeout(() => {
        showAlert({ title: 'Lỗi', message: msg, type: 'error' });
      }, 100);
    }
  };

  const getTasksForContext = (ctxId: number) => {
    return tasks.filter(t => t.contextId === ctxId);
  };

  const handleDeleteTask = async (id: number) => {
    try {
      if (!user) return;
      await taskService.deleteTask(user.userId, id);
      await notificationService.cancelTaskNotification(id);
      setShowDetailModal(false);
      fetchTasks();
      showAlert({ title: 'Thành công', message: 'Đã xóa công việc.', type: 'success' });
    } catch (error) {
      console.error('Delete failed:', error);
      showAlert({ title: 'Lỗi', message: 'Không thể xóa công việc.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Good Morning, {user?.fullName.split(' ')[0] || 'Master'}</Text>
            <Text style={styles.subText}>Ready to master your day?</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.calendarBanner} onPress={() => router.push('/calendar')}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const todayIdx = new Date().getDay();
            const adjustedToday = todayIdx === 0 ? 6 : todayIdx - 1;
            const isActive = i === adjustedToday;
            
            const dateObj = new Date(Date.now() + (i - adjustedToday) * 86400000);
            const dateStr = dateObj.toISOString().split('T')[0];
            const hasTasks = allTaskDates.includes(dateStr);

            return (
              <View key={i} style={styles.dayCol}>
                <Text style={[styles.dayText, isActive && styles.activeDayText]}>{day}</Text>
                <View style={[styles.dateCircle, isActive && styles.activeDateCircle]}>
                  <Text style={[styles.dateText, isActive && styles.activeDateText]}>
                    {dateObj.getDate()}
                  </Text>
                </View>
                {hasTasks && <View style={[styles.dateDot, isActive && { backgroundColor: '#a855f7' }]} />}
              </View>
            );
          })}
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contexts</Text>
            <TouchableOpacity onPress={() => {
                setContextToEdit(null);
                setShowAddContextModal(true);
            }} style={styles.addBtnIcon}>
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitScroll}>
            {realContexts.map(ctx => (
              <TouchableOpacity key={ctx.id} style={styles.contextItem} onPress={() => setSelectedContext(ctx)}>
                <View style={[styles.contextIconCircle, { borderColor: ctx.colorCode + '40' }]}>
                  {ctx.iconName && iconMap[ctx.iconName] ? React.cloneElement(iconMap[ctx.iconName], { color: ctx.colorCode }) : <Star size={20} color={ctx.colorCode} />}
                </View>
                <Text style={styles.contextLabel}>{ctx.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <LayoutGrid size={16} color="#9ca3af" />
              <View>
                <Text style={styles.sectionTitle}>Eisenhower Matrix</Text>
                <Text style={styles.sectionSubtitle}>
                  {(() => {
                    const d = new Date();
                    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
                  })()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                setSelectedTaskForDetail({ date: today, time: null, isFixed: false });
                setShowAddModal(true);
            }} style={styles.addBtnSmall}>
              <Plus size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.matrixGrid}>
            {quadrants.map(q => {
              const qTasks = tasks.filter(t => t.matrix === q.id);
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.matrixBox, { borderColor: q.color + '30' }]}
                  onPress={() => setSelectedQuadrant(q)}
                >
                  <View style={styles.boxHeader}>
                    <Text style={[styles.qLabel, { color: q.color }]}>{q.id}</Text>
                    <ChevronRight size={14} color="#4b5563" />
                  </View>
                  <Text style={styles.boxTitle} numberOfLines={1}>{q.label}</Text>

                  <View style={styles.miniTaskList}>
                    {qTasks.slice(0, 4).map(t => (
                      <View key={t.id} style={[
                        styles.miniTask, 
                        t.isOverloaded 
                          ? { borderColor: '#ef4444', borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          : (!t.done ? { 
                              borderColor: t.isFixed ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)', 
                              borderWidth: 1,
                              backgroundColor: t.isFixed ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                            } : { borderWidth: 1, borderColor: 'transparent' })
                      ]}>
                        <View style={[styles.miniDot, { backgroundColor: t.done ? '#4b5563' : (t.isOverloaded ? '#ef4444' : q.color) }]} />
                        <Text style={[styles.miniText, t.done && styles.miniTextDone, t.isOverloaded && { color: '#ef4444' }]} numberOfLines={1}>{t.title}</Text>
                        {t.isOverloaded && <AlertTriangle size={12} color="#ef4444" style={{ marginLeft: 4 }} />}
                      </View>
                    ))}
                    {qTasks.length > 4 && <Text style={styles.moreText}>+{qTasks.length - 4} more</Text>}
                    {qTasks.length === 0 && <Text style={styles.emptyText}>Empty</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
        onAddEvent={handleAddEvent}
        task={selectedTaskForDetail}
        contexts={realContexts}
      />

      <AddContextModal
        visible={showAddContextModal}
        onClose={() => {
            setShowAddContextModal(false);
            setContextToEdit(null);
        }}
        onSave={handleSaveContext}
        context={contextToEdit}
      />

      <MatrixDetailModal
        visible={!!selectedQuadrant}
        quadrant={selectedQuadrant}
        tasks={tasks.filter(t => t.matrix === selectedQuadrant?.id)}
        onClose={() => setSelectedQuadrant(null)}
        onToggle={toggleTask}
        onDetail={handleTaskPress}
      />

      <TaskDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={selectedTaskForDetail}
        onEdit={(task: any) => {
            setSelectedTaskForDetail(task);
            setShowAddModal(true);
        }}
        onDelete={handleDeleteTask}
        onToggle={async (id: number) => {
            await toggleTask(id);
            setSelectedTaskForDetail((prev: any) => prev ? { ...prev, done: !prev.done } : null);
        }}
      />

      <ContextDetailModal
        visible={!!selectedContext}
        context={selectedContext}
        items={selectedContext ? getTasksForContext(selectedContext.id) : []}
        onDelete={handleDeleteContext}
        onToggle={toggleTask}
        onDetail={handleTaskPress}
        onEdit={(ctx: any) => {
            setSelectedContext(null);
            setTimeout(() => {
                setContextToEdit(ctx);
                setShowAddContextModal(true);
            }, 300);
        }}
        onClose={() => setSelectedContext(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130f1e' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  subText: { fontSize: 14, color: '#a855f7', marginTop: 4, opacity: 0.8 },
  calendarBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: 32 },
  dayCol: { alignItems: 'center' },
  dayText: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  activeDayText: { color: '#a855f7' },
  dateCircle: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  activeDateCircle: { backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#d1d5db' },
  dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#6b7280', marginTop: 4 },
  activeDateText: { color: '#c084fc' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#f3f4f6', textTransform: 'uppercase', letterSpacing: 1 },
  sectionSubtitle: { fontSize: 11, color: '#8b5cf6', marginTop: 2, fontWeight: '600' },
  addBtnIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
  addBtnSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
  matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  matrixBox: { width: '48%', minHeight: 160, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  qLabel: { fontSize: 10, fontWeight: '900' },
  boxTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  miniTaskList: { gap: 4 },
  miniTask: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 6 },
  miniDot: { width: 4, height: 4, borderRadius: 2 },
  miniText: { color: '#9ca3af', fontSize: 11, flex: 1 },
  miniTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  moreText: { color: '#4b5563', fontSize: 10, marginTop: 2 },
  emptyText: { color: '#333', fontSize: 11, fontStyle: 'italic' },
  habitScroll: { gap: 16, flexDirection: 'row' },
  contextItem: { alignItems: 'center', marginRight: 16 },
  contextIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  contextLabel: { fontSize: 12, fontWeight: '500', color: '#9ca3af' }
});
