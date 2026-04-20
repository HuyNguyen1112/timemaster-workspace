import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Plus, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import AddTaskModal from '../../components/AddTaskModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import { useAuth } from '../../context/AuthContext';
import { taskService, Task } from '../../services/task.service';
import { categoryService, Category } from '../../services/category.service';
import { notificationService } from '../../services/notification.service';
import { useFocusEffect } from 'expo-router';

export default function CalendarScreen() {
    const { user } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const [agenda, setAgenda] = useState<Task[]>([]);
    const [allTaskDates, setAllTaskDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [realCategories, setRealCategories] = useState<Category[]>([]);
    
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Dynamic Date Logic
    const [viewDate, setViewDate] = useState(new Date()); 
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Calculate days and layout
    const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const fetchCategories = useCallback(async () => {
        try {
            const data = await categoryService.getCategories();
            setRealCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const loadTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
            
            // Fetch selected date tasks AND all tasks for dots
            const [selectedData, allData] = await Promise.all([
                taskService.getTasksByDate(user.userId, formattedDate),
                taskService.getTasks(user.userId)
            ]);

            const sortedAgenda = selectedData.sort((a, b) => {
                const timeA = a.startTime || '99:99';
                const timeB = b.startTime || '99:99';
                return timeA.localeCompare(timeB);
            });

            setAgenda(sortedAgenda);
            
            // Extract unique dates for indicators
            const dates = Array.from(new Set(allData.map(t => t.targetDate)));
            setAllTaskDates(dates);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate, currentYear, currentMonth]);

    useFocusEffect(
        useCallback(() => {
            loadTasks();
            fetchCategories();
        }, [loadTasks, fetchCategories])
    );

    const handlePrevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
        setSelectedDate(1);
    };

    const handleNextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
        setSelectedDate(1);
    };

    const getMatrixColor = (type: string) => {
        const colors: any = { Q1: '#ef4444', Q2: '#8b5cf6', Q3: '#3b82f6', Q4: '#22c55e' };
        return colors[type] || '#8b5cf6';
    };

    const toggleTask = async (taskId: number) => {
        try {
            if (!user) return;
            const item = agenda.find(i => i.id === taskId);
            const isCompleting = item?.status !== 'COMPLETED';
            
            setAgenda(prev => prev.map(item => 
                item.id === taskId ? { ...item, status: item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : item
            ));
            await taskService.completeTask(user.userId, taskId);
            
            if (isCompleting) {
                await notificationService.cancelTaskNotification(taskId);
            }
        } catch (error) {
            console.error('Toggle failed:', error);
            loadTasks(); 
        }
    };

    const handleTaskPress = (item: Task) => {
        const mappedTask = {
            id: item.id,
            title: item.title,
            description: item.description,
            matrix: item.matrixType,
            category: item.categoryName,
            categoryId: item.categoryId,
            date: item.targetDate,
            time: item.startTime?.substring(0, 5),
            done: item.status === 'COMPLETED',
            duration: Math.round(item.estimatedDuration * 60)
        };
        setSelectedTask(mappedTask);
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

            // Schedule notification
            if (savedTask) {
                await notificationService.scheduleTaskNotification(savedTask);
            }

            setShowAddModal(false);
            loadTasks();
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
                console.error('Operation failed:', error);
                Alert.alert('Error', 'Operation failed. Please check inputs.');
            }
        }
    };

    const handleDeleteTask = async (id: number) => {
        try {
            if (!user) return;
            await taskService.deleteTask(user.userId, id);
            await notificationService.cancelTaskNotification(id);
            setShowDetailModal(false);
            loadTasks();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                        <ChevronLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{monthNames[currentMonth]} {currentYear}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                        <ChevronRight size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.calendarCard}>
                <View style={styles.weekHeader}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <Text key={i} style={styles.weekDay}>{d}</Text>
                    ))}
                </View>
                <View style={styles.daysGrid}>
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
                    {daysInMonth.map(day => {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const hasTasks = allTaskDates.includes(dateStr);
                        const isSelected = selectedDate === day;

                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayCell, isSelected && styles.activeDayCell]}
                                onPress={() => setSelectedDate(day)}
                            >
                                <Text style={[styles.dayText, isSelected && styles.activeDayText]}>{day}</Text>
                                {hasTasks && <View style={[styles.dot, isSelected && { backgroundColor: '#ffffff' }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.agendaContent} showsVerticalScrollIndicator={false}>
                <View style={styles.agendaHeader}>
                    <Text style={styles.agendaTitle}>Schedule for {monthNames[currentMonth].substring(0, 3)} {selectedDate}</Text>
                    {(() => {
                        const now = new Date();
                        const todayStr = now.toISOString().split('T')[0];
                        const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                        const isPast = selectedDateStr < todayStr;

                        if (isPast) return null;

                        return (
                            <TouchableOpacity style={styles.addButton} onPress={() => {
                                const isToday = selectedDateStr === todayStr;
                                
                                const formattedTime = isToday 
                                    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` 
                                    : '00:00';
                                    
                                setSelectedTask({ date: selectedDateStr, time: formattedTime });
                                setShowAddModal(true);
                            }}>
                                <Plus size={20} color="#ffffff" />
                            </TouchableOpacity>
                        );
                    })()}
                </View>

                {loading ? (
                    <ActivityIndicator color="#8b5cf6" style={{ marginTop: 20 }} />
                ) : agenda.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No tasks for this day. Rest is productive too!</Text>
                    </View>
                ) : (
                    agenda.map((item) => (
                        <View key={item.id} style={styles.agendaItem}>
                            <Text style={styles.timeText}>{item.startTime?.substring(0, 5) || '--:--'}</Text>
                            <View style={[styles.taskCard, { borderLeftColor: getMatrixColor(item.matrixType), borderLeftWidth: 4 }]}>
                                <TouchableOpacity 
                                    style={styles.taskCardContent}
                                    onPress={() => handleTaskPress(item)}
                                >
                                    <Text style={[styles.taskTitle, item.status === 'COMPLETED' && styles.taskTitleDone]}>{item.title}</Text>
                                    <View style={styles.taskSubRow}>
                                        <Text style={styles.taskSub}>{item.matrixType} • {item.estimatedDuration}h</Text>
                                        {item.categoryName && <Text style={styles.catBadge}>{item.categoryName}</Text>}
                                    </View>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.statusIconContainer}
                                    onPress={() => toggleTask(item.id)}
                                >
                                    {item.status === 'COMPLETED' ? (
                                        <CheckCircle2 size={22} color="#22c55e" />
                                    ) : (
                                        <Circle size={22} color="#4b5563" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddTask}
                task={selectedTask}
                categories={realCategories}
            />

            <TaskDetailModal
                visible={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                task={selectedTask}
                onEdit={(task) => {
                    setSelectedTask(task);
                    setShowAddModal(true);
                }}
                onDelete={handleDeleteTask}
                onToggle={async (id) => {
                    await toggleTask(id);
                    setSelectedTask((prev: any) => prev ? { ...prev, done: !prev.done } : null);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#130f1e' },
    header: { padding: 24, paddingTop: 48, paddingBottom: 16 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { padding: 4 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
    calendarCard: { backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 24, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
    weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    weekDay: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', width: '13%', textAlign: 'center' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 8 },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginBottom: 4, paddingBottom: 4 },
    activeDayCell: { backgroundColor: '#8b5cf6' },
    dayText: { color: '#d1d5db', fontSize: 14, fontWeight: '500' },
    activeDayText: { color: '#ffffff', fontWeight: 'bold' },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8b5cf6',
        marginTop: 2,
    },
    agendaContent: { padding: 24, paddingTop: 0, paddingBottom: 120 },
    agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    agendaTitle: { color: '#f3f4f6', fontSize: 18, fontWeight: '600' },
    addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
    agendaItem: { flexDirection: 'row', marginBottom: 16 },
    timeText: { width: 60, color: '#9ca3af', fontSize: 12, marginTop: 16, fontWeight: '600' },
    taskCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    taskCardContent: { flex: 1, padding: 16 },
    statusIconContainer: { padding: 16, justifyContent: 'center', alignItems: 'center' },
    taskTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    taskTitleDone: { textDecorationLine: 'line-through', color: '#4b5563', opacity: 0.7 },
    taskSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    taskSub: { color: '#9ca3af', fontSize: 12 },
    catBadge: { color: '#a855f7', fontSize: 10, backgroundColor: 'rgba(168,85,247,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
    emptyText: { color: '#4b5563', fontSize: 14, textAlign: 'center' }
});
