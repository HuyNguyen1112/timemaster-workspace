import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { X, Calendar, Clock, Layout, Edit2, Trash2, CheckCircle2, Circle, AlignLeft, Tag } from 'lucide-react-native';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: any;
    onEdit: (task: any) => void;
    onDelete: (taskId: number) => void;
    onToggle: (taskId: number) => void;
}

export default function TaskDetailModal({ visible, onClose, task, onEdit, onDelete, onToggle }: TaskDetailModalProps) {
    if (!task) return null;

    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            Platform.OS === 'ios' ? [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => {
                    onDelete(task.id);
                    onClose();
                  } 
                }
            ] : [
                { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => {
                    onDelete(task.id);
                    onClose();
                  } 
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const matrixColors: any = { Q1: '#f97316', Q2: '#3b82f6', Q3: '#6b7280', Q4: '#22c55e' };
    const matrixLabels: any = { 
        Q1: 'Urgent & Important', 
        Q2: 'Important, Not Urgent', 
        Q3: 'Urgent, Not Important', 
        Q4: 'Casual / Relax' 
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.content, { borderLeftColor: matrixColors[task.matrix] || '#8b5cf6', borderLeftWidth: 8 }]}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.statusToggle} onPress={() => onToggle(task.id)}>
                            {task.done ? <CheckCircle2 size={24} color="#22c55e" /> : <Circle size={24} color="#4b5563" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={[styles.title, task.done && styles.titleDone]}>{task.title}</Text>
                        
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
                            {task.category && (
                                <View style={styles.infoRow}>
                                    <Tag size={16} color="#a855f7" />
                                    <View style={styles.catTag}>
                                        <Text style={styles.catTagText}>{task.category}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => {
                                onEdit(task);
                                onClose();
                            }}
                        >
                            <Edit2 size={18} color="#3b82f6" />
                            <Text style={[styles.actionText, { color: '#3b82f6' }]}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                            <Trash2 size={18} color="#ef4444" />
                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
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
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
