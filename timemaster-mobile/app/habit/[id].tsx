import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Flame, Droplets, Book, Dumbbell, Code, Brain, Music, Zap, Target, Award, Calendar, Trash2, Edit3, CheckCircle2, Plus } from 'lucide-react-native';
import { habitService, Habit } from '../../services/habit.service';
import { healthService } from '../../services/health.service';
import { focusTargetService } from '../../services/pomodoro.service';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomAlert } from '../../components/CustomAlertContext';
import { notificationService } from '../../services/notification.service';
import EditHabitModal from '../../components/EditHabitModal';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function HabitDetailScreen() {
    const { showAlert } = useCustomAlert();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [habit, setHabit] = useState<Habit | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [progressInput, setProgressInput] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [distanceKm, setDistanceKm] = useState(0);

    const handleEditHabit = async (updatedHabit: any) => {
        if (!user || !habit) return;
        try {
            const data = await habitService.updateHabit(user.userId, habit.id, updatedHabit);
            setHabit(data);
            showAlert({ title: 'Thành công', message: 'Đã cập nhật thói quen.', type: 'success' });
            setShowEditModal(false);
        } catch (error) {
            showAlert({ title: 'Lỗi', message: 'Không thể cập nhật thói quen.', type: 'error' });
        }
    };

    const iconMap: any = {
        Flame: <Flame size={32} />,
        Droplets: <Droplets size={32} />,
        Book: <Book size={32} />,
        Dumbbell: <Dumbbell size={32} />,
        Code: <Code size={32} />,
        Brain: <Brain size={32} />,
        Music: <Music size={32} />,
    };

    const loadHabit = useCallback(async (showLoading: boolean = true) => {
        if (!user || !id) return;
        if (showLoading) setLoading(true);
        try {
            const data = await habitService.getHabitById(user.userId, Number(id));
            setHabit(data);
            // Fetch real distance from Health Connect for step habits
            if (data.verificationSource === 'GOOGLE_FIT_STEPS' && healthService.isAvailable()) {
                try {
                    await healthService.initialize();
                    const today = new Date().toISOString().split('T')[0];
                    const metrics = await healthService.getDailyMetrics(today);
                    setDistanceKm(metrics.distanceKm);
                } catch (e) { /* silent */ }
            }
        } catch (error) {
            console.error('Failed to load habit details:', error);
            showAlert({ title: 'Error', message: 'Failed to load habit details.', type: 'error' });
            router.back();
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [user, id]);

    useEffect(() => {
        loadHabit();
    }, [loadHabit]);

    const handleCheckIn = async (value?: number, isIncrement: boolean = false) => {
        if (!user || !habit) return;
        setIsCheckingIn(true);
        try {
            await habitService.checkIn(user.userId, habit.id, {
                logDate: new Date().toISOString().split('T')[0],
                progressValue: value ?? habit.dailyGoal,
                isIncrement: isIncrement,
                completed: !isIncrement ? true : undefined
            });
            loadHabit(false); 
            setShowProgressModal(false);
            setProgressInput('');
        } catch (error) {
            console.error('Check-in failed:', error);
            showAlert({ title: 'Error', message: 'Failed to record progress.', type: 'error' });
        } finally {
            setIsCheckingIn(false);
        }
    };

    const isTimeUnit = (unit?: string) => {
        if (!unit) return false;
        const u = unit.toLowerCase();
        return u === 'min' || u === 'mins' || u === 'minutes' || u === 'hour' || u === 'hours' || u === 'h' || u === 'm';
    };

    const handleDelete = () => {
        showAlert({
            title: 'Delete Habit',
            message: 'Are you sure you want to delete this habit permanently?',
            type: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                if (!user || !habit) return;
                try {
                    await habitService.deleteHabit(user.userId, habit.id);
                    await notificationService.cancelHabitNotifications(habit.id);
                    router.back();
                } catch (error) {
                    showAlert({ title: 'Error', message: 'Failed to delete habit.', type: 'error' });
                }
            }
        });
    };

    if (loading || !habit) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const themeColor = habit.colorCode || Colors.primary;

    // Heatmap Logic: Last 30 days
    const renderHeatmap = () => {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const log = habit.recentLogs?.find(l => l.logDate === dateStr);
            
            let color = 'rgba(0,0,0,0.05)';
            if (log) {
                const percentage = (log.progressValue / (habit.dailyGoal || 1)) * 100;
                
                // Use themeColor with different opacities to represent intensity
                if (percentage >= 125) color = themeColor; // Full intensity
                else if (percentage >= 100) color = themeColor + 'CC'; // 80% opacity
                else if (percentage >= 70) color = themeColor + '99'; // 60% opacity
                else if (percentage >= 35) color = themeColor + '66'; // 40% opacity
                else if (percentage > 0) color = themeColor + '33'; // 20% opacity
            }
            
            days.push({ date: dateStr, color });
        }

        return (
            <View style={styles.heatmapGrid}>
                {days.map((day, idx) => (
                    <View 
                        key={idx} 
                        style={[
                            styles.heatmapCell, 
                            { backgroundColor: day.color }
                        ]} 
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[themeColor + '30', Colors.background]}
                style={styles.gradientBg}
            />
            
            {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft color={Colors.text} size={28} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowEditModal(true)}>
                            <Edit3 color={Colors.text} size={20} />
                        </TouchableOpacity>
                        {!habit.isSystemHabit && (
                            <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, { marginLeft: 12 }]}>
                                <Trash2 color={Colors.error} size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Icon & Title */}
                <View style={styles.titleSection}>
                    <View style={[styles.iconContainer, { backgroundColor: themeColor + '15' }]}>
                        {habit.icon && iconMap[habit.icon] 
                            ? React.cloneElement(iconMap[habit.icon], { color: themeColor }) 
                            : <Target color={themeColor} size={32} />}
                    </View>
                    <Text style={styles.title}>{habit.name}</Text>
                    {habit.description && <Text style={styles.description}>{habit.description}</Text>}
                </View>

                {/* Main Streak Card */}
                <View style={styles.streakCard}>
                    <LinearGradient
                        colors={[themeColor, themeColor + '80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.streakGradient}
                    >
                        <View style={styles.streakInfo}>
                            <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                            <View style={styles.streakValueContainer}>
                                <Text style={styles.streakValue}>{habit.currentStreak}</Text>
                                <Text style={styles.streakUnit}>days</Text>
                            </View>
                        </View>
                        <View style={styles.streakIconBg}>
                            <Flame size={64} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Zap size={20} color={Colors.warning} />
                        <Text style={styles.statTitle}>Daily Progress</Text>
                        <Text style={styles.statValue}>
                            {habit.progressToday || 0} / {habit.dailyGoal} {habit.unit === 'minutes' ? 'phút' : 'lần'}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Award size={20} color={themeColor} />
                        <Text style={styles.statTitle}>
                            {habit.verificationSource === 'GOOGLE_FIT_STEPS' ? 'Distance' : 'Goal Status'}
                        </Text>
                        <Text style={styles.statValue}>
                            {habit.verificationSource === 'GOOGLE_FIT_STEPS'
                                ? `${distanceKm} km`
                                : `${Math.round(((habit.progressToday || 0) / (habit.dailyGoal || 1)) * 100)}%`
                            }
                        </Text>
                    </View>
                </View>

                {/* Heatmap Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Calendar size={18} color={Colors.textDim} />
                        <Text style={styles.sectionTitle}>Consistency (Last 30 Days)</Text>
                    </View>
                    {renderHeatmap()}
                    <View style={styles.heatmapLegend}>
                        <Text style={styles.legendText}>Less</Text>
                        <View style={styles.legendCell} />
                        <View style={[styles.legendCell, { backgroundColor: themeColor }]} />
                        <Text style={styles.legendText}>Full</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {habit.verificationSource !== 'NONE' ? (
                    <View style={[styles.checkInBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}>
                        <Calendar color={Colors.success} size={20} />
                        <Text style={[styles.checkInText, { color: Colors.textDim }]}>Automated Sync Active</Text>
                    </View>
                ) : (
                    <View style={styles.actionBar}>
                        {isTimeUnit(habit.unit) ? (
                            <TouchableOpacity 
                                style={[styles.checkInBtn, { flex: 1, backgroundColor: themeColor }]}
                                onPress={() => {
                                    focusTargetService.setTarget({ type: 'HABIT', id: habit.id, title: habit.name });
                                    router.back();
                                    setTimeout(() => {
                                        router.navigate('/(tabs)/focus');
                                    }, 100);
                                }}
                            >
                                <Zap color="#ffffff" size={24} />
                                <Text style={styles.checkInText}>Start Focus</Text>
                            </TouchableOpacity>
                        ) : habit.dailyGoal > 1 ? (
                            <TouchableOpacity 
                                style={[styles.checkInBtn, { flex: 1, backgroundColor: themeColor }]}
                                onPress={() => handleCheckIn(1, true)}
                            >
                                <Plus color="#ffffff" size={24} />
                                <Text style={styles.checkInText}>+1 {habit.unit || 'Lần'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[
                                    styles.checkInBtn, 
                                    { flex: 1, backgroundColor: habit.completedToday ? Colors.success : themeColor },
                                ]}
                                onPress={() => handleCheckIn()}
                                disabled={isCheckingIn || habit.completedToday}
                            >
                                {habit.completedToday ? <CheckCircle2 color="#ffffff" size={24} /> : <Target color="#ffffff" size={24} />}
                                <Text style={styles.checkInText}>{habit.completedToday ? 'Done for Today' : 'Mark as Done'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Progress Modal */}
            <Modal visible={showProgressModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Progress</Text>
                            <TouchableOpacity onPress={() => setShowProgressModal(false)}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Bạn đã đạt được bao nhiêu {habit.unit === 'minutes' ? 'phút' : 'lần'}?</Text>
                        
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.progressInput}
                                value={progressInput}
                                onChangeText={(val) => setProgressInput(val.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                placeholderTextColor={Colors.textDim}
                                keyboardType="numeric"
                                autoFocus
                            />
                            <Text style={styles.unitText}>{habit.unit === 'minutes' ? 'phút' : 'lần'}</Text>
                        </View>

                        <View style={styles.quickAddRow}>
                            {[1, 5, 10, 15].map(val => (
                                <TouchableOpacity 
                                    key={val} 
                                    style={styles.quickAddBtn}
                                    onPress={() => setProgressInput(val.toString())}
                                >
                                    <Text style={styles.quickAddText}>+{val}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, { backgroundColor: themeColor }]}
                            onPress={() => handleCheckIn(Number(progressInput), true)}
                            disabled={isCheckingIn || !progressInput}
                        >
                            {isCheckingIn ? <ActivityIndicator color={Colors.text} /> : <Text style={styles.submitBtnText}>Add to Today's Progress</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {showEditModal && (
                <EditHabitModal
                    visible={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleEditHabit}
                    initialData={habit}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 150,
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: Colors.textDim,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    streakCard: {
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 10,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    streakGradient: {
        padding: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakInfo: {
        zIndex: 1,
    },
    streakLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    streakValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    streakValue: {
        fontSize: 56,
        fontWeight: '900',
        color: '#ffffff',
    },
    streakUnit: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 8,
    },
    streakIconBg: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statTitle: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 4,
    },
    section: {
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textDim,
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    heatmapCell: {
        width: (width - 48 - 48 - 40) / 7 - 8,
        height: (width - 48 - 48 - 40) / 7 - 8,
        borderRadius: 4,
    },
    heatmapLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 8,
    },
    legendCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    legendText: {
        fontSize: 10,
        color: Colors.textDim,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    checkInBtn: {
        height: 64,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    checkInText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    manualEntryBtn: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 32,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeText: {
        color: Colors.textDim,
        fontSize: 16,
    },
    modalSubtitle: {
        color: Colors.textDim,
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderRadius: 24,
        padding: 40,
        marginBottom: 32,
    },
    progressInput: {
        fontSize: 72,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    unitText: {
        fontSize: 20,
        color: Colors.textDim,
        marginLeft: 12,
        fontWeight: '600',
    },
    quickAddRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
        width: '100%',
    },
    quickAddBtn: {
        width: 60,
        height: 60,
        backgroundColor: Colors.background,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickAddText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    submitBtn: {
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: Colors.text,
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    submitBtnText: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    }
});
