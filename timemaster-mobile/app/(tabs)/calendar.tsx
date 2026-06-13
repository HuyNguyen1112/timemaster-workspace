import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Plus, ChevronLeft, ChevronRight, Lock, Unlock, Anchor, Calendar as CalendarIcon, Zap } from 'lucide-react-native';
import AddTaskModal from '../../components/AddTaskModal';
import AddEventModal from '../../components/AddEventModal';
import { useAuth } from '../../context/AuthContext';
import { taskService, Task } from '../../services/task.service';
import { contextService, Context } from '../../services/context.service';
import { eventService, Event } from '../../services/event.service';
import { scheduleService, TimeBlock } from '../../services/schedule.service';
import { notificationService } from '../../services/notification.service';
import { useFocusEffect } from 'expo-router';
import { useCustomAlert } from '../../components/CustomAlertContext';

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
            if (eventData.id) {
                await eventService.updateEvent(eventData.id, eventData);
            } else {
                await eventService.createEvent(eventData);
            }
            setShowAddEvent(false);
            loadData();
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.response?.data?.message || 'Failed to save event.', type: 'error' });
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
                        <CalendarIcon size={18} color="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleAddClick}>
                        <Plus size={20} color="#8b5cf6" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Navigator */}
            <View style={styles.dateNavigator}>
                <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
                    <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                    <ChevronRight size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#8b5cf6" style={{ marginTop: 40 }} />
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
                            return (
                                <TouchableOpacity key={`ft-${ft.id}`} style={[styles.fixedTaskBlock, { top: startMins, height: height }]} onPress={() => { setSelectedTask(ft); setShowAddTask(true); }}>
                                    <View style={styles.fixedHeader}>
                                        <Anchor size={14} color="#f59e0b" />
                                        <Text style={styles.fixedTaskTitle}>{ft.title}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Flex Time Blocks */}
                        {timeBlocks.map(tb => {
                            const startMins = timeToMinutes(tb.startTime);
                            const endMins = timeToMinutes(tb.endTime);
                            const height = Math.max(endMins - startMins, 20);
                            return (
                                <View key={`tb-${tb.id}`} style={[styles.timeBlock, { top: startMins, height: height, borderColor: tb.isLocked ? '#f59e0b' : '#3b82f6' }]}>
                                    <View style={styles.timeBlockHeader}>
                                        <Zap size={14} color="#3b82f6" />
                                        <Text style={styles.timeBlockTitle} numberOfLines={1}>{tb.taskTitle}</Text>
                                    </View>
                                    {height >= 40 && (
                                        <Text style={styles.timeBlockSub}>{tb.contextName} • {tb.matrixType}</Text>
                                    )}
                                    <TouchableOpacity 
                                        style={styles.lockBtn} 
                                        onPress={() => handleToggleLock(tb.id, !tb.isLocked)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {tb.isLocked ? <Lock size={16} color="#f59e0b" /> : <Unlock size={16} color="#9ca3af" />}
                                    </TouchableOpacity>
                                </View>
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
                task={selectedTask}
                contexts={contexts}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#130f1e' },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
    headerActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    dateNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
    navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    dateText: { fontSize: 16, fontWeight: '600', color: '#f3f4f6' },
    
    timelineContent: { position: 'relative', height: 24 * HOUR_HEIGHT + 100, paddingBottom: 100 },
    gridLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16 },
    hourText: { width: 45, color: '#6b7280', fontSize: 12, fontWeight: '500', marginTop: -8 },
    gridLineDash: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 0 },
    
    eventsContainer: { position: 'absolute', left: 60, right: 16, top: 0, bottom: 0 },
    
    contextRegion: { position: 'absolute', left: 0, right: 0, borderLeftWidth: 4, borderRadius: 8, padding: 8, zIndex: 0 },
    contextRegionText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 },
    
    eventBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: '#3f3f46', borderRadius: 8, padding: 8, zIndex: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#52525b' },
    eventStripes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', opacity: 0.1 },
    eventTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
    timeTextSmall: { color: '#a1a1aa', fontSize: 10, marginTop: 4 },
    
    fixedTaskBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 8, padding: 8, zIndex: 11, borderWidth: 1, borderColor: '#f59e0b' },
    fixedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fixedTaskTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
    
    timeBlock: { position: 'absolute', left: 4, right: 4, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 8, padding: 8, zIndex: 12, borderWidth: 1, borderLeftWidth: 4, flexDirection: 'column' },
    timeBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 24 },
    timeBlockTitle: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
    timeBlockSub: { color: '#9ca3af', fontSize: 10, marginTop: 4 },
    lockBtn: { position: 'absolute', top: 8, right: 8, zIndex: 20 },
});
