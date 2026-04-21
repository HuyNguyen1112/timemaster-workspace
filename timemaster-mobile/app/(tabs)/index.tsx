import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Plus, LayoutGrid, ChevronRight, Briefcase, Heart, User, BookOpen, Star, Coffee, Gamepad2, Calendar } from 'lucide-react-native';
import AddTaskModal from '../../components/AddTaskModal';
import MatrixDetailModal from '../../components/MatrixDetailModal';
import CategoryDetailModal from '../../components/CategoryDetailModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import { taskService, Task } from '../../services/task.service';
import { categoryService, Category } from '../../services/category.service';
import { notificationService } from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [realCategories, setRealCategories] = useState<Category[]>([]);

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [allTaskDates, setAllTaskDates] = useState<string[]>([]);

  const quadrants = [
    { id: 'Q1', label: 'Urgent & Important', color: '#f97316' },
    { id: 'Q2', label: 'Important, Not Urgent', color: '#3b82f6' },
    { id: 'Q3', label: 'Urgent, Not Important', color: '#6b7280' },
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

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setRealCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch both today's tasks and ALL tasks (for calendar dots)
      const [todayData, allData] = await Promise.all([
        taskService.getTasksByDate(user.userId, today),
        taskService.getTasks(user.userId)
      ]);

      const mappedTasks = todayData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        matrix: t.matrixType,
        time: t.startTime ? t.startTime.substring(0, 5) : 'Anytime',
        done: t.status === 'COMPLETED',
        category: t.categoryName || 'General',
        categoryId: t.categoryId,
        date: t.targetDate,
        duration: Math.round(t.estimatedDuration * 60)
      })).sort((a, b) => {
        if (a.time === 'Anytime') return 1;
        if (b.time === 'Anytime') return -1;
        return a.time.localeCompare(b.time);
      });
      setTasks(mappedTasks);

      // Extract unique dates that have tasks
      const dates = Array.from(new Set(allData.map(t => t.targetDate)));
      setAllTaskDates(dates);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchCategories()]);
    setRefreshing(false);
  }, [fetchTasks, fetchCategories]);

  const searchParams = useLocalSearchParams();

  const lastResponse = Notifications.useLastNotificationResponse();
  
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchCategories();
    }, [fetchTasks, fetchCategories])
  );

  const handleDeepLink = useCallback((tid: number) => {
    const openTask = (t: any) => {
      setSelectedTaskForDetail({
        id: t.id,
        title: t.title,
        description: t.description,
        matrix: t.matrixType || t.matrix,
        time: t.startTime ? t.startTime.substring(0, 5) : (t.time || 'Anytime'),
        done: (t.status === 'COMPLETED' || t.done),
        category: t.categoryName || t.category || 'General',
        categoryId: t.categoryId,
        date: t.targetDate || t.date,
        duration: t.estimatedDuration ? Math.round(t.estimatedDuration * 60) : (t.duration || 60)
      });
      setShowDetailModal(true);
    };

    // Always fetch fresh for deep link to ensure we have the correct data regardless of current date
    taskService.getTasks(user?.userId || 0).then(allTasks => {
      const t = allTasks.find(item => item.id === tid);
      if (t) openTask(t);
    }).catch(err => console.error('Deep link fetch failed', err));
  }, [user?.userId]);

  // Handle both URL params and native notification responses
  useEffect(() => {
    const tidFromUrl = searchParams.taskId ? Number(searchParams.taskId) : null;
    const tidFromNotify = lastResponse?.notification.request.content.data?.taskId;

    const finalTid = tidFromNotify || tidFromUrl;

    if (finalTid) {
      console.log('[Dashboard] Deep link triggered for taskId:', finalTid);
      handleDeepLink(Number(finalTid));
      
      // Clear URL param if it exists
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
    } catch (error) {
      console.error('Toggle failed', error);
      fetchTasks();
    }
  };

  const handleTaskPress = (task: any) => {
    setSelectedTaskForDetail(task);
    setShowDetailModal(true);
  };

  const handleAddTask = async (taskData: any, isForced: boolean = false) => {
    try {
      if (!user) return;
      const payload = {
        title: taskData.title,
        description: taskData.description || '',
        targetDate: taskData.date,
        startTime: taskData.time + ':00',
        estimatedDuration: taskData.duration / 60,
        matrixType: taskData.matrix,
        categoryId: taskData.categoryId,
        force: isForced
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
        if (error.response?.status === 409) {
            const conflictInfo = error.response.data;
            Alert.alert(
                'Schedule Conflict',
                `${conflictInfo.message}\n\nConflicts:\n- ${conflictInfo.conflicts.join('\n- ')}\n\nDo you want to save anyway?`,
                Platform.OS === 'ios' ? [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save Anyway', onPress: () => handleAddTask(taskData, true) }
                ] : [
                    { text: 'Save Anyway', onPress: () => handleAddTask(taskData, true) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } else {
            console.error('Operation failed', error);
            Alert.alert('Error', 'Operation failed. Please check inputs.');
        }
    }
  };

  const handleSaveCategory = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        iconName: data.iconName,
        colorCode: data.color
      };

      if (data.id) {
        await categoryService.updateCategory(data.id, payload);
        Alert.alert('Success', 'Category updated successfully!');
      } else {
        await categoryService.createCategory(payload);
        Alert.alert('Success', 'Category created successfully!');
      }
      
      fetchCategories();
      setCategoryToEdit(null);
    } catch (error) {
      console.error('Save category failed:', error);
      Alert.alert('Error', 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
      fetchTasks(); // Refresh tasks as their categoryIds might have changed to null
    } catch (error) {
      console.error('Delete category failed:', error);
      Alert.alert('Error', 'Failed to delete category.');
    }
  };

  const getTodayTasksForCategory = (catId: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.categoryId === catId && t.date === todayStr);
  };

  const handleDeleteTask = async (id: number) => {
    try {
      if (!user) return;
      await taskService.deleteTask(user.userId, id);
      await notificationService.cancelTaskNotification(id);
      setShowDetailModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => {
                setCategoryToEdit(null);
                setShowAddCategoryModal(true);
            }} style={styles.addBtnIcon}>
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitScroll}>
            {realCategories.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => setSelectedCategory(cat)}>
                <View style={[styles.categoryIconCircle, { borderColor: cat.color + '40' }]}>
                  {iconMap[cat.iconName] ? React.cloneElement(iconMap[cat.iconName], { color: cat.color }) : <Star size={20} color={cat.color} />}
                </View>
                <Text style={styles.categoryLabel}>{cat.name}</Text>
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
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                setSelectedTaskForDetail({ date: today, time: currentTime });
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
                      <View key={t.id} style={styles.miniTask}>
                        <View style={[styles.miniDot, { backgroundColor: t.done ? '#4b5563' : q.color }]} />
                        <Text style={[styles.miniText, t.done && styles.miniTextDone]} numberOfLines={1}>{t.title}</Text>
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
        task={selectedTaskForDetail}
        categories={realCategories}
      />

      <AddCategoryModal
        visible={showAddCategoryModal}
        onClose={() => {
            setShowAddCategoryModal(false);
            setCategoryToEdit(null);
        }}
        onSave={handleSaveCategory}
        category={categoryToEdit}
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
        onEdit={(task) => {
            setSelectedTaskForDetail(task);
            setShowAddModal(true);
        }}
        onDelete={handleDeleteTask}
        onToggle={async (id) => {
            await toggleTask(id);
            setSelectedTaskForDetail((prev: any) => prev ? { ...prev, done: !prev.done } : null);
        }}
      />

      <CategoryDetailModal
        visible={!!selectedCategory}
        category={selectedCategory}
        items={selectedCategory ? getTodayTasksForCategory(selectedCategory.id) : []}
        onDelete={handleDeleteCategory}
        onToggle={toggleTask}
        onDetail={handleTaskPress}
        onEdit={(cat: any) => {
            setSelectedCategory(null);
            setCategoryToEdit(cat);
            setShowAddCategoryModal(true);
        }}
        onClose={() => setSelectedCategory(null)}
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
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginTop: 4,
  },
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
  miniTaskList: { gap: 6 },
  miniTask: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 4, height: 4, borderRadius: 2 },
  miniText: { color: '#9ca3af', fontSize: 11, flex: 1 },
  miniTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  moreText: { color: '#4b5563', fontSize: 10, marginTop: 2 },
  emptyText: { color: '#333', fontSize: 11, fontStyle: 'italic' },
  habitScroll: { gap: 16, flexDirection: 'row' },
  categoryItem: { alignItems: 'center', marginRight: 16 },
  categoryIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryLabel: { fontSize: 12, fontWeight: '500', color: '#9ca3af' }
});
