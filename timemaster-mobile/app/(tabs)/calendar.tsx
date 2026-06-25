import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Plus, ChevronLeft, ChevronRight, Lock, Unlock, Anchor, Calendar as CalendarIcon, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import AddTaskModal from '../../components/AddTaskModal';
import AddEventModal from '../../components/AddEventModal';
import TimeBlockDetailModal from '../../components/TimeBlockDetailModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import OverdueModal from '../../components/OverdueModal';
import { useAuth } from '../../context/AuthContext';
import { taskService, Task, mapTaskToUI } from '../../services/task.service';
import { contextService, Context } from '../../services/context.service';
import { eventService, Event } from '../../services/event.service';
import { scheduleService, TimeBlock } from '../../services/schedule.service';
import { notificationService } from '../../services/notification.service';
import { useFocusEffect } from 'expo-router';
import { useCustomAlert } from '../../components/CustomAlertContext';
import { Colors } from '../../constants/theme';

const HOUR_HEIGHT = 60; // 1 pixel per minute

export default function CalendarScreen() {
    const { showAlert } = useCustomAlert();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Data states
    const [contexts, setContexts] = useState<Context[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [fixedTasks, setFixedTasks] = useState<Task[]>([]);
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showTimeBlockDetail, setShowTimeBlockDetail] = useState(false);
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [overdueTasksForModal, setOverdueTasksForModal] = useState<any[]>([]);

    const formatLocalISOString = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const timeToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const t = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const dateStr = formatLocalISOString(selectedDate);
            
            const [contextsData, eventsData, allTasks, blocks] = await Promise.all([
                contextService.getContexts(),
                eventService.getEventsByDate(dateStr),
                taskService.getTasksByDate(user.userId, dateStr),
                scheduleService.getSchedule(dateStr)
            ]);

            setContexts(contextsData);
            setEvents(eventsData);
            setFixedTasks(allTasks.filter(t => t.isFixed));
            setTimeBlocks(blocks);
            
            // Sync timeblock notifications
            await notificationService.syncTimeBlockNotifications(dateStr, blocks);
            
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const handleToggleLock = async (blockId: number, locked: boolean) => {
        try {
            // Optimistic update
            setTimeBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isLocked: locked } : b));
            await scheduleService.lockTimeBlock(blockId, locked);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to lock time block.', type: 'error' });
            loadData(); // Revert
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!user) return;
        try {
            await taskService.deleteTask(user.userId, taskId);
            setShowTimeBlockDetail(false);
            setShowTaskDetail(false);
            showAlert({ title: 'Thành công', message: 'Đã xóa công việc.', type: 'success' });
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Lỗi', message: error.response?.data?.message || 'Không thể xóa công việc.', type: 'error' });
        }
    };

    const handleTaskPress = (t: Task) => {
        if (t.isOverdue) {
            setOverdueTasksForModal([mapTaskToUI(t)]);
            setShowOverdueModal(true);
        } else {
            setSelectedTask(mapTaskToUI(t));
            setShowTaskDetail(true);
        }
    };

    const handleCancelOverdueTask = async (taskId: number) => {
        if (!user) return;
        try {
            await taskService.cancelTask(user.userId, taskId);
            setShowOverdueModal(false);
            showAlert({ title: 'Thành công', message: 'Đã hủy công việc quá hạn.', type: 'success' });
            loadData();
        } catch (error) {
            showAlert({ title: 'Lỗi', message: 'Không thể hủy công việc.', type: 'error' });
        }
    };

    const handleEditTaskFromBlock = async (taskId: number) => {
        if (!user) return;
        try {
            const allTasksResponse = await taskService.getTasks(user.userId);
            const foundTask = allTasksResponse.find(t => t.id === taskId);
            if (foundTask) {
                setShowTimeBlockDetail(false);
                setSelectedTask(foundTask);
                setShowAddTask(true);
            } else {
                showAlert({ title: 'Lỗi', message: 'Không tìm thấy thông tin công việc để sửa.', type: 'error' });
            }
        } catch (error) {
            showAlert({ title: 'Lỗi', message: 'Không thể tải thông tin công việc.', type: 'error' });
        }
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
            
            let savedTask;
            if (taskData.id) {
                savedTask = await taskService.updateTask(user.userId, taskData.id, payload);
            } else {
                savedTask = await taskService.createTask(user.userId, payload);
            }

            if (savedTask) {
                await notificationService.scheduleTaskNotification(savedTask);
            }
            setShowAddTask(false);
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.response?.data?.message || 'Operation failed.', type: 'error' });
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
            setShowAddTask(false);
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.response?.data?.message || 'Failed to save event.', type: 'error' });
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        try {
            await eventService.deleteEvent(eventId);
            setShowAddTask(false);
            showAlert({ title: 'Thành công', message: 'Đã xóa sự kiện.', type: 'success' });
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Lỗi', message: error.response?.data?.message || 'Không thể xóa sự kiện.', type: 'error' });
        }
    };

    const handleAutoSchedule = async () => {
        try {
            setLoading(true);
            const dateStr = formatLocalISOString(selectedDate);
            await scheduleService.recalculateSchedule(dateStr);
            showAlert({ title: 'Thành công', message: 'Đã tự động xếp lịch thành công!', type: 'success' });
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Lỗi', message: error.response?.data?.message || 'Không thể xếp lịch.', type: 'error' });
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setSelectedTask(null);
        setShowAddTask(true);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Schedule</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleAutoSchedule}>
                        <CalendarIcon size={18} color={Colors.matrix.q1} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleAddClick}>
                        <Plus size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Navigator */}
            <View style={styles.dateNavigator}>
                <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                    <ChevronRight size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
                    {/* Grid Background */}
                    {Array.from({ length: 25 }).map((_, i) => (
                        <View key={`grid-${i}`} style={[styles.gridLine, { top: i * HOUR_HEIGHT }]}>
                            <Text style={styles.hourText}>{`${i.toString().padStart(2, '0')}:00`}</Text>
                            <View style={styles.gridLineDash} />
                        </View>
                    ))}

                    <View style={styles.eventsContainer}>
                        {/* Context Regions */}
                        {contexts.map(ctx => {
                            const currentDayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
                            const dailySchedules = ctx.schedules?.filter(s => s.dayOfWeek === currentDayOfWeek) || [];
                            
                            return dailySchedules.map(sch => {
                                const startMins = timeToMinutes(sch.startTime);
                                const endMins = timeToMinutes(sch.endTime);
                                const height = endMins - startMins;
                                return (
                                    <View key={`ctx-${sch.id}`} style={[styles.contextRegion, { 
                                        top: startMins, 
                                        height: height, 
                                        backgroundColor: ctx.colorCode + '15', 
                                        borderLeftColor: ctx.colorCode 
                                    }]}>
                                        <Text style={[styles.contextRegionText, { color: ctx.colorCode }]}>{ctx.name.toUpperCase()}</Text>
                                    </View>
                                );
                            });
                        })}

                        {/* Events */}
                        {events.map(ev => {
                            const startMins = timeToMinutes(ev.startTime);
                            const endMins = timeToMinutes(ev.endTime);
                            const height = Math.max(endMins - startMins, 30);
                            return (
                                <TouchableOpacity key={`ev-${ev.id}`} style={[styles.eventBlock, { top: startMins, height: height }]} onPress={() => { setSelectedTask({ ...ev, isEvent: true }); setShowAddTask(true); }}>
                                    <View style={styles.eventStripes} />
                                    <Text style={styles.eventTitle}>{ev.title}</Text>
                                    <Text style={styles.timeTextSmall}>{ev.startTime.split('T')[1].substring(0,5)} - {ev.endTime.split('T')[1].substring(0,5)}</Text>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Fixed Tasks */}
                        {fixedTasks.map(ft => {
                            const startMins = timeToMinutes(ft.startTime);
                            const height = Math.max((ft.estimatedDuration || 1) * 60, 30);
                            const isOverdue = ft.isOverdue;
                            const isDone = ft.status === 'COMPLETED' || ft.done;
                            const isCancelled = ft.status === 'CANCELLED';
                            return (
                                <TouchableOpacity 
                                    key={`ft-${ft.id}`} 
                                    style={[
                                        styles.fixedTaskBlock, 
                                        { top: startMins, height: height },
                                        isOverdue && !isDone && !isCancelled && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: Colors.error },
                                        isDone && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: Colors.success },
                                        isCancelled && { backgroundColor: 'rgba(156, 163, 175, 0.1)', borderColor: Colors.textDim }
                                    ]} 
                                    onPress={() => handleTaskPress(ft)}
                                >
                                    <View style={styles.fixedHeader}>
                                        {isCancelled ? (
                                            <XCircle size={14} color={Colors.textDim} />
                                        ) : isDone ? (
                                            <CheckCircle size={14} color={Colors.success} />
                                        ) : isOverdue ? (
                                            <AlertTriangle size={14} color={Colors.error} />
                                        ) : (
                                            <Anchor size={14} color={Colors.warning} />
                                        )}
                                        <Text style={[
                                            styles.fixedTaskTitle, 
                                            isOverdue && !isDone && !isCancelled && { color: Colors.error },
                                            isDone && { color: Colors.success, textDecorationLine: 'line-through' },
                                            isCancelled && { color: Colors.textDim, textDecorationLine: 'line-through' }
                                        ]}>{ft.title}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Flex Time Blocks */}
                        {timeBlocks.map(tb => {
                            const startMins = timeToMinutes(tb.startTime);
                            const endMins = timeToMinutes(tb.endTime);
                            const height = Math.max(endMins - startMins, 20);
                            const isDone = tb.remainingDuration === 0 || tb.taskStatus === 'COMPLETED';
                            const isCancelled = tb.taskStatus === 'CANCELLED';
                            return (
                                <TouchableOpacity 
                                    key={`tb-${tb.id}`} 
                                    style={[
                                        styles.timeBlock, 
                                        { top: startMins, height: height, borderColor: tb.isLocked ? Colors.warning : Colors.matrix.q2 },
                                        isDone && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: Colors.success },
                                        isCancelled && { backgroundColor: 'rgba(156, 163, 175, 0.1)', borderColor: Colors.textDim }
                                    ]}
                                    onPress={() => { setSelectedTimeBlock(tb); setShowTimeBlockDetail(true); }}
                                >
                                    <View style={styles.timeBlockHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 4 }}>
                                            {isCancelled ? (
                                                <XCircle size={14} color={Colors.textDim} />
                                            ) : isDone ? (
                                                <CheckCircle size={14} color={Colors.success} />
                                            ) : (
                                                <Zap size={14} color={tb.isOverloaded ? Colors.error : Colors.matrix.q2} />
                                            )}
                                            <Text style={[
                                                styles.timeBlockTitle, 
                                                tb.isOverloaded && !isDone && !isCancelled && { color: Colors.error },
                                                isDone && { color: Colors.success, textDecorationLine: 'line-through' },
                                                isCancelled && { color: Colors.textDim, textDecorationLine: 'line-through' }
                                            ]} numberOfLines={1}>{tb.taskTitle}</Text>
                                        </View>
                                        {tb.isOverloaded && !isDone && <AlertTriangle size={14} color={Colors.error} style={{ marginRight: 24 }} />}
                                    </View>
                                    {height >= 40 && (
                                        <Text style={[
                                            styles.timeBlockSub,
                                            isDone && { color: Colors.success },
                                            isCancelled && { color: Colors.textDim }
                                        ]}>{tb.contextName} • {tb.matrixType}</Text>
                                    )}
                                    <TouchableOpacity 
                                        style={styles.lockBtn} 
                                        onPress={(e) => { e.stopPropagation(); handleToggleLock(tb.id, !tb.isLocked); }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {tb.isLocked ? <Lock size={16} color={Colors.warning} /> : <Unlock size={16} color={Colors.textDim} />}
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            <AddTaskModal
                visible={showAddTask}
                onClose={() => setShowAddTask(false)}
                onAdd={handleAddTask}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                task={selectedTask}
                contexts={contexts}
            />

            <TimeBlockDetailModal 
                visible={showTimeBlockDetail} 
                onClose={() => setShowTimeBlockDetail(false)} 
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTaskFromBlock}
                timeBlock={selectedTimeBlock} 
            />

            <TaskDetailModal
                visible={showTaskDetail}
                onClose={() => setShowTaskDetail(false)}
                task={selectedTask}
                onEdit={(task: any) => {
                    setSelectedTask(task);
                    setShowAddTask(true);
                }}
                onDelete={handleDeleteTask}
                onToggle={async () => {}}
            />

            <OverdueModal
                visible={showOverdueModal}
                onClose={() => setShowOverdueModal(false)}
                tasks={overdueTasksForModal}
                onCancelTask={handleCancelOverdueTask}
                onEditTask={(task: any) => {
                    setShowOverdueModal(false);
                    setSelectedTask(task);
                    setShowAddTask(true);
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
    headerActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    dateNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
    navBtn: { padding: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12 },
    dateText: { fontSize: 16, fontWeight: '600', color: Colors.text },
    
    timelineContent: { position: 'relative', height: 24 * HOUR_HEIGHT + 100, paddingBottom: 100 },
    gridLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16 },
    hourText: { width: 45, color: Colors.textDim, fontSize: 12, fontWeight: '500', marginTop: -8 },
    gridLineDash: { flex: 1, height: 1, backgroundColor: Colors.border, marginTop: 0 },
    
    eventsContainer: { position: 'absolute', left: 60, right: 16, top: 0, bottom: 0 },
    
    contextRegion: { position: 'absolute', left: 0, right: 0, borderLeftWidth: 4, borderRadius: 8, padding: 8, zIndex: 0 },
    contextRegionText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 },
    
    eventBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: Colors.surface, borderRadius: 8, padding: 8, zIndex: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    eventStripes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', opacity: 0.1 },
    eventTitle: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },
    timeTextSmall: { color: Colors.textDim, fontSize: 10, marginTop: 4 },
    
    fixedTaskBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 8, padding: 8, zIndex: 11, borderWidth: 1, borderColor: '#f59e0b' },
    fixedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fixedTaskTitle: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },
    
    timeBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 8, padding: 8, zIndex: 12, borderWidth: 1, borderLeftWidth: 4, flexDirection: 'column' },
    timeBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 24 },
    timeBlockTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
    timeBlockSub: { color: Colors.textDim, fontSize: 10, marginTop: 4 },
    lockBtn: { position: 'absolute', top: 8, right: 8, zIndex: 20 },
});
