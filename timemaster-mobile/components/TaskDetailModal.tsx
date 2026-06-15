import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { X, Calendar, Clock, Layout, Edit2, Trash2, CheckCircle2, Circle, AlignLeft, Tag, AlertTriangle, Play, Wrench } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: any;
    onEdit: (task: any) => void;
    onDelete: (taskId: number) => void;
    onToggle: (taskId: number) => void;
}

import { useCustomAlert } from './CustomAlertContext';

export default function TaskDetailModal({ visible, onClose, task, onEdit, onDelete, onToggle }: TaskDetailModalProps) {
    const { showAlert } = useCustomAlert();
    const router = useRouter();
    if (!task) return null;

    const handleDelete = () => {
        showAlert({
            title: 'Delete Task',
            message: 'Are you sure you want to delete this task?',
            type: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => {
                onDelete(task.id);
                onClose();
            }
        });
    };

    const matrixColors: any = { Q1: '#f97316', Q2: '#3b82f6', Q3: '#6b7280', Q4: '#22c55e' };
    const matrixLabels: any = { 
        Q1: 'Urgent & Important', 
        Q2: 'Important, Not Urgent', 
        Q3: 'Urgent, Not Important', 
        Q4: 'Casual / Relax' 
    };

    const totalEstimatedMins = (task.estimatedDuration || 1) * 60;
    const remainingMins = task.remainingDuration !== undefined ? task.remainingDuration : totalEstimatedMins;
    
    const focusedMins = Math.max(0, totalEstimatedMins - remainingMins);
    
    const percent = Math.min(100, Math.round((focusedMins / totalEstimatedMins) * 100));

    const formatMinToHours = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.content, { borderLeftColor: matrixColors[task.matrix] || '#8b5cf6', borderLeftWidth: 8 }]}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <TouchableOpacity onPress={() => { onEdit(task); onClose(); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                                <Wrench size={18} color="#f59e0b" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={[styles.title, task.done && styles.titleDone]}>{task.title}</Text>
                        
                        {task.isOverloaded && (
                            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <AlertTriangle size={20} color="#ef4444" />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14 }}>Cảnh báo Quá tải</Text>
                                    <Text style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>
                                        Hệ thống không thể sắp xếp đủ thời lượng {task.remainingDuration} phút cho công việc này trước Deadline.
                                    </Text>
                                </View>
                            </View>
                        )}
                        
                        {task.description && task.description.trim() !== '' && (
                            <View style={styles.descriptionSection}>
                                <View style={styles.descriptionHeader}>
                                    <AlignLeft size={16} color="#8b5cf6" />
                                    <Text style={styles.descriptionLabel}>Mô tả</Text>
                                </View>
                                <Text style={styles.descriptionText}>{task.description}</Text>
                            </View>
                        )}

                        <View style={styles.infoGrid}>
                            <View style={styles.infoRow}>
                                <Calendar size={16} color="#8b5cf6" />
                                <Text style={styles.infoText}>{task.date || 'Today'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Clock size={16} color="#8b5cf6" />
                                <Text style={styles.infoText}>{task.time || 'Anytime'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Layout size={16} color="#8b5cf6" />
                                <Text style={styles.infoText}>{matrixLabels[task.matrix]}</Text>
                            </View>
                            {task.context && (
                                <View style={styles.infoRow}>
                                    <Tag size={16} color="#a855f7" />
                                    <View style={styles.catTag}>
                                        <Text style={styles.catTagText}>{task.context}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Progress Section */}
                    {!task.isFixed && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Task Overall Progress</Text>
                                <Text style={styles.progressPercent}>{percent}%</Text>
                            </View>
                            
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                            </View>

                            <View style={styles.progressStats}>
                                <Text style={styles.statText}>
                                    Focused: <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMinToHours(focusedMins)}</Text>
                                </Text>
                                <Text style={styles.statText}>
                                    Total Est: <Text style={{ color: '#ffffff' }}>{formatMinToHours(totalEstimatedMins)}</Text>
                                </Text>
                            </View>
                            
                            {remainingMins > 0 && (
                                <Text style={styles.remainingText}>
                                    {formatMinToHours(remainingMins)} left to complete this task
                                </Text>
                            )}
                            {remainingMins <= 0 && (
                                <Text style={[styles.remainingText, { color: '#10b981' }]}>
                                    Task completed!
                                </Text>
                            )}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.startFocusBtn} 
                        onPress={() => {
                            onClose();
                            router.push({
                                pathname: '/(tabs)/focus',
                                params: { taskId: task.id, taskTitle: task.title }
                            });
                        }}
                    >
                        <Play size={18} color="#8b5cf6" fill="#8b5cf6" />
                        <Text style={styles.startFocusBtnText}>Bắt đầu Focus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: '#130f1e',
        borderRadius: 24,
        padding: 24,
        paddingBottom: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusToggle: {
        padding: 4,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    titleDone: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    descriptionSection: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    descriptionLabel: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    descriptionText: {
        color: '#9ca3af',
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    infoGrid: {
        gap: 16,
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        color: '#d1d5db',
        fontSize: 16,
    },
    catTag: {
        backgroundColor: 'rgba(168,85,247,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.2)',
    },
    catTagText: {
        color: '#c084fc',
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressContainer: {
        marginTop: 16,
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#374151'
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    progressLabel: {
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: '600'
    },
    progressPercent: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 14
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#374151',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 5
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    statText: {
        color: '#9ca3af',
        fontSize: 13
    },
    remainingText: {
        textAlign: 'center',
        color: '#f59e0b',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic'
    },
    startFocusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
        backgroundColor: '#8b5cf6' + '20',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8b5cf6' + '40'
    },
    startFocusBtnText: {
        color: '#8b5cf6',
        fontWeight: '600',
        fontSize: 15
    }
});
