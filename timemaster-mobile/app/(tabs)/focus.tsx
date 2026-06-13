import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, TextInput, Keyboard, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrainCircuit, Play, Pause, ChevronRight, Square, Settings2, Plus, Minus, Check, Target, Zap } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/task.service';
import { habitService } from '../../services/habit.service';
import { pomodoroService } from '../../services/pomodoro.service';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCustomAlert } from '../../components/CustomAlertContext';

export default function FocusScreen() {
    const { showAlert } = useCustomAlert();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { habitId, habitTitle } = useLocalSearchParams();
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);          // dùng cho Pomodoro (đếm xuống)
    const [elapsed, setElapsed] = useState(0);                   // dùng cho Custom Focus (đếm lên)
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>({ id: 'none', title: 'No task selected', type: 'NONE' });
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [todayItems, setTodayItems] = useState<any[]>([]);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [lastSyncTime, setLastSyncTime] = useState(0); // To prevent double sync
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

    const loadFocusData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [tasks, habits] = await Promise.all([
                taskService.getTasksByDate(user.userId, today),
                habitService.getHabits(user.userId)
            ]);

            const mappedTasks = tasks
                .filter(t => t.status !== 'COMPLETED')
                .map(t => ({
                    id: `task-${t.id}`,
                    realId: t.id,
                    title: t.title,
                    type: 'TASK',
                    color: '#8b5cf6'
                }));
    
            const mappedHabits = habits
                .filter(h => !h.completedToday)
                .map(h => ({
                    id: `habit-${h.id}`,
                    realId: h.id,
                    title: h.name,
                    type: 'HABIT',
                    color: '#22c55e'
                }));
    
            setTodayItems([...mappedTasks, ...mappedHabits]);
        } catch (error) {
            console.error('Failed to load focus data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadFocusData();
            
            // Handle automatic selection from Habit Detail
            if (habitId && habitTitle) {
                setSelectedEntity({
                    id: `habit-${habitId}`,
                    realId: Number(habitId),
                    title: habitTitle as string,
                    type: 'HABIT',
                    color: '#22c55e'
                });
            }
        }, [loadFocusData, habitId, habitTitle])
    );

    useEffect(() => {
        if (isPlaying && !sessionStartTime) {
            setSessionStartTime(new Date());
        } else if (!isPlaying && sessionStartTime) {
            // Reset start time if stopped/paused manually (for now, we treat pause as interruption if we were logging interruptions, but here we just reset it for simplicity or we can keep it until completed)
        }
    }, [isPlaying]);

    useEffect(() => {
        let interval: any = null;
        if (isCustomMode) {
            // Stopwatch: đếm lên
            if (isPlaying) {
                interval = setInterval(() => {
                    setElapsed(prev => prev + 1);
                }, 1000);
            }
        } else {
            // Pomodoro: đếm xuống
            if (isPlaying && timeLeft > 0) {
                interval = setInterval(() => {
                    setTimeLeft(prev => prev - 1);
                }, 1000);
            } else if (timeLeft === 0 && isPlaying) {
                setIsPlaying(false);
                handleSessionComplete();
            }
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft, isCustomMode]);

    const handleSessionComplete = async () => {
        if (!user || selectedEntity.id === 'none') return;
        
        // Prevent accidental double sync
        const now = Date.now();
        if (now - lastSyncTime < 2000) return;
        setLastSyncTime(now);

        // Custom mode dùng elapsed (đồng hồ bấm giờ), Pomodoro dùng initialTime
        const sessionMinutes = isCustomMode
            ? Math.max(1, Math.floor(elapsed / 60))
            : Math.floor(initialTime / 60);
        
        try {
            const startStr = sessionStartTime ? sessionStartTime.toISOString() : new Date(Date.now() - sessionMinutes * 60000).toISOString();
            const endStr = new Date().toISOString();
            
            await pomodoroService.saveSession({
                taskId: selectedEntity.type === 'TASK' ? selectedEntity.realId : undefined,
                habitId: selectedEntity.type === 'HABIT' ? selectedEntity.realId : undefined,
                startTime: startStr,
                endTime: endStr,
                durationMinutes: sessionMinutes,
                status: 'COMPLETED'
            });
            
            showAlert({
                title: 'Session Complete!', 
                message: `Added ${sessionMinutes} mins to your ${selectedEntity.type.toLowerCase()}: ${selectedEntity.title}`,
                type: 'success'
            });
            setSessionStartTime(null);
            loadFocusData(); // Reload to reflect any status changes
        } catch (error) {
            console.error('Failed to sync session progress:', error);
            showAlert({
                title: 'Error', 
                message: 'Failed to save focus session.',
                type: 'error'
            });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const adjustTime = (amount: number) => {
        if (isPlaying) return;
        const newTime = timeLeft + amount;
        if (newTime > 0 && newTime <= 120 * 60) {
            setTimeLeft(newTime);
            setInitialTime(newTime); // Update initial time when adjusted
        }
    };

    const doReset = async (sessionMinutes: number, elapsedSecs: number) => {
        setIsPlaying(false);
        if (sessionMinutes >= 10 && sessionStartTime && user && selectedEntity.id !== 'none') {
            try {
                await pomodoroService.saveSession({
                    taskId: selectedEntity.type === 'TASK' ? selectedEntity.realId : undefined,
                    habitId: selectedEntity.type === 'HABIT' ? selectedEntity.realId : undefined,
                    startTime: sessionStartTime.toISOString(),
                    endTime: new Date().toISOString(),
                    durationMinutes: sessionMinutes,
                    status: isCustomMode ? 'COMPLETED' : 'INTERRUPTED'
                });
            } catch (e) {
                console.error('Failed to save session:', e);
            }
        }
        setTimeLeft(25 * 60);
        setElapsed(0);
        setSessionStartTime(null);
    };

    const resetTimer = async () => {
        // Nếu không có session đang dở thì reset luôn
        if (!sessionStartTime || selectedEntity.id === 'none') {
            setIsPlaying(false);
            setTimeLeft(25 * 60);
            setElapsed(0);
            setSessionStartTime(null);
            return;
        }

        const elapsedSecs = isCustomMode ? elapsed : (initialTime - timeLeft);
        const sessionMinutes = Math.floor(elapsedSecs / 60);

        if (sessionMinutes < 10) {
            // Chưa đủ 10 phút → hỏi người dùng
            setIsPlaying(false); // tạm dừng trong lúc hỏi
            showAlert({
                title: 'Session chưa đủ 10 phút',
                message: `Bạn mới tập trung được ${sessionMinutes > 0 ? sessionMinutes + ' phút' : 'chưa đến 1 phút'}. Session ngắn sẽ không được lưu lại.`,
                type: 'warning',
                confirmText: 'Hủy session',
                cancelText: 'Tiếp tục tập trung',
                onConfirm: () => doReset(sessionMinutes, elapsedSecs),
                onCancel: () => setIsPlaying(true)
            });
        } else {
            await doReset(sessionMinutes, elapsedSecs);
        }
    };

    const toggleMode = () => {
        if (isPlaying) return;
        const newMode = !isCustomMode;
        setIsCustomMode(newMode);
        setTimeLeft(25 * 60);
        setElapsed(0);
        setSessionStartTime(null);
        setIsEditingTime(false);
    };

    const handleTimeSubmit = () => {
        const mins = parseInt(inputValue);
        if (!isNaN(mins) && mins > 0 && mins <= 180) {
            const newTime = mins * 60;
            setTimeLeft(newTime);
            setInitialTime(newTime); // Update initial time when submitted from keyboard
        }
        setIsEditingTime(false);
        Keyboard.dismiss();
    };

    const startEditing = () => {
        if (isPlaying) return;
        if (!isCustomMode) {
            setIsCustomMode(true);
        }
        setInputValue(Math.floor(timeLeft / 60).toString());
        setIsEditingTime(true);
    };

    return (
        <View style={styles.container}>
            {/* Header & Mode Toggle */}
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <View style={styles.badge}>
                        <BrainCircuit size={16} color="#60a5fa" />
                        <Text style={styles.badgeText}>{isCustomMode ? 'Custom Focus' : 'Pomodoro'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleButton, isCustomMode && styles.toggleButtonActive]}
                        onPress={toggleMode}
                    >
                        <Settings2 size={18} color={isCustomMode ? '#ffffff' : '#9ca3af'} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.targetCard, sessionStartTime && styles.targetCardLocked]} 
                    onPress={() => !sessionStartTime && setShowPicker(true)}
                    activeOpacity={sessionStartTime ? 1 : 0.7}
                >
                    <Text style={styles.subtitle}>Focusing on</Text>
                    <View style={styles.targetInfo}>
                        <Target size={16} color={sessionStartTime ? '#6b7280' : '#a855f7'} />
                        <Text style={[styles.title, sessionStartTime && { color: '#9ca3af' }]}>{selectedEntity.title}</Text>
                        {!sessionStartTime && <ChevronRight size={16} color="#6b7280" />}
                        {!!sessionStartTime && <View style={styles.lockBadge}><Text style={styles.lockText}>🔒 Reset để đổi</Text></View>}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Timer */}
            <View style={styles.timerWrapper}>
                <View style={styles.timerContainer}>
                    <TouchableOpacity 
                        style={[styles.timerRing, isPlaying && styles.timerRingActive]}
                        activeOpacity={1}
                        disabled={true}
                    >
                        <Text style={styles.timeText}>
                            {isCustomMode ? formatTime(elapsed) : formatTime(timeLeft)}
                        </Text>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{selectedEntity.type}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lower Controls */}
            <View style={[styles.controls, { bottom: insets.bottom + 110 }]}>
                <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                    <Square size={20} color="#9ca3af" fill="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => setIsPlaying(!isPlaying)}
                >
                    {isPlaying ? <Pause size={32} color="#ffffff" fill="#ffffff" /> : <Play size={36} color="#ffffff" fill="#ffffff" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                {/* Zap: đổi Task/Habit — khoá khi đang có session */}
                <TouchableOpacity 
                    style={[styles.controlButton, !!sessionStartTime && { opacity: 0.3 }]} 
                    onPress={() => !sessionStartTime && setShowPicker(true)}
                    disabled={!!sessionStartTime}
                >
                    <Zap size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Entity Picker Modal */}
            <Modal visible={showPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Link to Task or Habit</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Text style={styles.closeText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.pickerList}>
                            {loading ? (
                                <ActivityIndicator color="#8b5cf6" style={{ marginTop: 20 }} />
                            ) : todayItems.length === 0 ? (
                                <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>No tasks or habits for today.</Text>
                            ) : (
                                todayItems.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.pickerItem, selectedEntity.id === item.id && styles.pickerItemActive]}
                                        onPress={() => { setSelectedEntity(item); setShowPicker(false); }}
                                    >
                                        <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                                            <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.type[0]}</Text>
                                        </View>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        {selectedEntity.id === item.id && <Check size={18} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#130f1e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 24,
        position: 'absolute',
        top: 60,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59,130,246,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
    },
    badgeText: {
        color: '#60a5fa',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    toggleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#60a5fa',
    },
    targetCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        alignItems: 'center',
    },
    targetCardLocked: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    lockBadge: {
        backgroundColor: 'rgba(168,85,247,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.2)',
    },
    lockText: {
        color: '#c084fc',
        fontSize: 11,
        fontWeight: '600',
    },
    targetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    timerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    adjustButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerContainer: {
        width: 260,
        height: 260,
    },
    timerRing: {
        width: 260,
        height: 260,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'solid',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
    },
    timerRingActive: {
        borderColor: '#a855f7',
        borderWidth: 3,
        shadowColor: '#a855f7',
        shadowOpacity: 0.8,
        shadowRadius: 40,
    },
    timeText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#ffffff',
        fontFamily: 'System',
    },
    typeBadge: {
        backgroundColor: 'rgba(168,85,247,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    typeBadgeText: {
        color: '#c084fc',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        position: 'absolute',
        bottom: 120,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#161618',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        color: '#8b5cf6',
        fontWeight: 'bold',
    },
    pickerList: {
        marginBottom: 20,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginBottom: 12,
    },
    pickerItemActive: {
        borderColor: '#8b5cf6',
        borderWidth: 1,
        backgroundColor: 'rgba(139,92,246,0.1)',
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemTitle: {
        color: '#f3f4f6',
        fontSize: 16,
        flex: 1,
    },
    // Input Styles
    inputWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeInput: {
        fontSize: 80,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
        minWidth: 120,
    },
    minLabel: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: -10,
    }
});
