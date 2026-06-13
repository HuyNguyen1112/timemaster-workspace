import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Flame, Zap } from 'lucide-react-native';
import { pomodoroService, PomodoroDashboardResponse } from '../../services/pomodoro.service';
import { useFocusEffect } from 'expo-router';

export default function AnalyticsScreen() {
    const [dashboard, setDashboard] = useState<PomodoroDashboardResponse | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const data = await pomodoroService.getDashboard();
            setDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const maxFocus = dashboard?.focusTimeLast7Days?.reduce((max, d) => Math.max(max, d.focusMinutes), 0) || 1;

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Your Progress</Text>
                <Text style={styles.subtitle}>Track your productivity journey here.</Text>
            </View>

            <View style={styles.kpiContainer}>
                <View style={[styles.kpiCard, styles.orangeBorder]}>
                    <Flame size={24} color="#f97316" style={styles.icon} />
                    <View>
                        <View style={styles.kpiValueRow}>
                            <Text style={styles.kpiValue}>{dashboard?.currentStreak || 0}</Text>
                            <Text style={styles.kpiUnit}>Days</Text>
                        </View>
                        <Text style={styles.kpiLabel}>Current Streak</Text>
                    </View>
                </View>

                <View style={[styles.kpiCard, styles.blueBorder]}>
                    <Zap size={24} color="#60a5fa" style={styles.icon} />
                    <View>
                        <Text style={styles.kpiValue}>{dashboard?.totalSessionsCompleted || 0}</Text>
                        <Text style={styles.kpiLabel}>Total Sessions</Text>
                    </View>
                </View>
            </View>

            <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Focus Time (Last 7 Days)</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{dashboard?.comparisonWithLastWeek || '+0%'}</Text>
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    {dashboard?.focusTimeLast7Days?.length ? (
                        dashboard.focusTimeLast7Days.map((d, i) => {
                            const heightPercentage = Math.max(5, (d.focusMinutes / maxFocus) * 100);
                            const dateObj = new Date(d.date);
                            const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
                            return (
                                <View key={i} style={styles.barCol}>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { height: `${heightPercentage}%`, backgroundColor: d.focusMinutes > 0 ? '#8b5cf6' : 'rgba(255,255,255,0.05)' }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{dayLetter}</Text>
                                </View>
                            );
                        })
                    ) : (
                        [0, 0, 0, 0, 0, 0, 0].map((h, i) => (
                            <View key={i} style={styles.barCol}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { height: '5%' }]} />
                                </View>
                                <Text style={styles.barLabel}>-</Text>
                            </View>
                        ))
                    )}
                </View>
                {(!dashboard?.focusTimeLast7Days || dashboard.totalSessionsCompleted === 0) && (
                    <Text style={styles.emptyChartText}>No focus data available yet.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#130f1e',
    },
    content: {
        padding: 24,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 32,
        marginTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    kpiContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#161618',
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        minHeight: 140,
    },
    orangeBorder: {
        borderLeftWidth: 2,
        borderColor: '#f97316',
    },
    blueBorder: {
        borderLeftWidth: 2,
        borderColor: '#3b82f6',
    },
    icon: {
        marginBottom: 16,
    },
    kpiValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    kpiValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
    },
    kpiUnit: {
        fontSize: 16,
        color: '#9ca3af',
        marginLeft: 4,
    },
    kpiLabel: {
        fontSize: 10,
        color: '#9ca3af',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginTop: 4,
    },
    chartSection: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d1d5db',
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
    },
    chartContainer: {
        flexDirection: 'row',
        height: 128,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    barCol: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    barTrack: {
        width: '100%',
        flex: 1,
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '80%',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barLabel: {
        fontSize: 10,
        color: '#6b7280',
    },
    emptyChartText: {
        color: '#4b5563',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
