import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Droplets, Book, Flame, Plus, ChevronRight, Zap, Target, Dumbbell, Code, Brain, Music } from 'lucide-react-native';
import AddHabitModal from '../../components/AddHabitModal';
import { useAuth } from '../../context/AuthContext';
import { habitService, Habit } from '../../services/habit.service';
import { useFocusEffect } from 'expo-router';

export default function HabitsScreen() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const iconMap: any = {
        Flame: <Flame size={24} />,
        Droplets: <Droplets size={24} />,
        Book: <Book size={24} />,
        Dumbbell: <Dumbbell size={24} />,
        Code: <Code size={24} />,
        Brain: <Brain size={24} />,
        Music: <Music size={24} />,
    };

    const loadHabits = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await habitService.getHabits(user.userId);
            setHabits(data);
        } catch (error) {
            console.error('Failed to load habits:', error);
            Alert.alert('Error', 'Failed to load habits.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadHabits();
        }, [loadHabits])
    );

    const addHabit = async (newHabit: any) => {
        if (!user) return;
        try {
            await habitService.createHabit(user.userId, newHabit);
            loadHabits();
        } catch (error) {
            console.error('Failed to create habit:', error);
            Alert.alert('Error', 'Failed to create habit.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Habits</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Streak Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Zap size={20} color="#facc15" />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Best Streak</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Target size={20} color="#22c55e" />
                        <Text style={styles.statValue}>0%</Text>
                        <Text style={styles.statLabel}>Success Rate</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Habits</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtnIcon}>
                        <Plus size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color="#8b5cf6" style={{ marginTop: 40 }} />
                ) : habits.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No active habits. Time to start one!</Text>
                    </View>
                ) : (
                    habits.map(habit => (
                        <TouchableOpacity key={habit.id} style={styles.habitCard}>
                            <View style={[styles.iconBox, { backgroundColor: (habit.colorCode || '#8b5cf6') + '15' }]}>
                                {habit.icon && iconMap[habit.icon] 
                                    ? React.cloneElement(iconMap[habit.icon] as React.ReactElement, { color: habit.colorCode || '#8b5cf6' } as any) 
                                    : <Target color={habit.colorCode || '#8b5cf6'} />}
                            </View>
                            <View style={styles.habitInfo}>
                                <Text style={styles.habitTitle}>{habit.name}</Text>
                                <Text style={styles.habitSub}>{habit.currentStreak} day streak • Goal: {habit.dailyGoal} {habit.unit}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${(habit.completedToday ? 1 : 0) * 100}%`, backgroundColor: habit.colorCode || '#8b5cf6' }]} />
                                </View>
                            </View>
                            <ChevronRight size={20} color="#4b5563" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <AddHabitModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addHabit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#130f1e',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 120,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.1)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addBtnIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    habitInfo: {
        flex: 1,
    },
    habitTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    habitSub: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
        marginBottom: 10,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#4b5563',
        fontStyle: 'italic',
        textAlign: 'center',
    }
});
