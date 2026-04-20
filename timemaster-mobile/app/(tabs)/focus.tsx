import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { BrainCircuit, Play, Pause, ChevronRight, Square, Settings2, Plus, Minus, Check, Target, Zap } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/task.service';
import { habitService } from '../../services/habit.service';
import { useFocusEffect } from 'expo-router';

export default function FocusScreen() {
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>({ id: 'none', title: 'No task selected', type: 'NONE' });
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [todayItems, setTodayItems] = useState<any[]>([]);

    const loadFocusData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [tasks, habits] = await Promise.all([
                taskService.getTasksByDate(user.userId, today),
                habitService.getHabits(user.userId)
            ]);

            const mappedTasks = tasks.map(t => ({
                id: `task-${t.id}`,
                realId: t.id,
                title: t.title,
                type: 'TASK',
                color: '#8b5cf6'
            }));

            const mappedHabits = habits.map(h => ({
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
        }, [loadFocusData])
    );

    useEffect(() => {
        let interval: any = null;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

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
        }
    };

    const resetTimer = () => {
        setIsPlaying(false);
        setTimeLeft(isCustomMode ? timeLeft : 25 * 60);
    };

    const toggleMode = () => {
        if (isPlaying) return;
        const newMode = !isCustomMode;
        setIsCustomMode(newMode);
        if (!newMode) setTimeLeft(25 * 60);
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

                <TouchableOpacity style={styles.targetCard} onPress={() => setShowPicker(true)}>
                    <Text style={styles.subtitle}>Focusing on</Text>
                    <View style={styles.targetInfo}>
                        <Target size={16} color="#a855f7" />
                        <Text style={styles.title}>{selectedEntity.title}</Text>
                        <ChevronRight size={16} color="#6b7280" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Timer & Adjusters */}
            <View style={styles.timerWrapper}>
                {isCustomMode && !isPlaying && (
                    <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(-60)}>
                        <Minus size={32} color="#ffffff" />
                    </TouchableOpacity>
                )}

                <View style={styles.timerContainer}>
                    <View style={[styles.timerRing, isPlaying && styles.timerRingActive]}>
                        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{selectedEntity.type}</Text>
                        </View>
                    </View>
                </View>

                {isCustomMode && !isPlaying && (
                    <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(60)}>
                        <Plus size={32} color="#ffffff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Lower Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                    <Square size={20} color="#9ca3af" fill="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => setIsPlaying(!isPlaying)}
                >
                    {isPlaying ? <Pause size={32} color="#ffffff" fill="#ffffff" /> : <Play size={36} color="#ffffff" fill="#ffffff" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={() => setShowPicker(true)}>
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
        flex: 1,
        borderRadius: 130,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    timerRingActive: {
        borderColor: '#a855f7',
        shadowColor: '#a855f7',
        shadowOpacity: 0.8,
        shadowRadius: 40,
        elevation: 20,
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
    }
});
