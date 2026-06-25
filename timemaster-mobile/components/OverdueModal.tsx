import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { X, Calendar, Edit2, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useCustomAlert } from './CustomAlertContext';

interface OverdueModalProps {
    visible: boolean;
    onClose: () => void;
    tasks: any[];
    onCancelTask: (taskId: number) => void;
    onEditTask: (task: any) => void;
}

export default function OverdueModal({ visible, onClose, tasks, onCancelTask, onEditTask }: OverdueModalProps) {
    const { showAlert } = useCustomAlert();

    if (!visible) return null;

    const handleCancel = (taskId: number) => {
        showAlert({
            title: 'Hủy công việc',
            message: 'Công việc này sẽ bị đánh dấu hủy (Cancelled) và loại bỏ khỏi lịch của bạn. Bạn chắc chắn chứ?',
            type: 'warning',
            confirmText: 'Đồng ý Hủy',
            cancelText: 'Quay lại',
            onConfirm: () => {
                onCancelTask(taskId);
            }
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.iconBox}>
                                <AlertCircle size={24} color={Colors.error} />
                            </View>
                            <View style={{ marginLeft: 16 }}>
                                <Text style={styles.qId}>NEEDS REVIEW</Text>
                                <Text style={styles.title}>Hộp chờ xử lý</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color={Colors.textDim} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Bạn có {tasks.length} công việc đã quá hạn. Hãy dời lịch (Edit) hoặc hủy bỏ (Cancel) để dọn dẹp danh sách nhé.
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {tasks.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>Tuyệt vời! Không có công việc nào bị lỡ.</Text>
                            </View>
                        ) : (
                            tasks.map((task: any) => (
                                <View key={task.id} style={styles.taskItemContainer}>
                                    <View style={styles.taskInfoArea}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Calendar size={12} color={Colors.error} />
                                            <Text style={styles.taskTime}> Lỡ hạn: {task.date}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.actionArea}>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}
                                            onPress={() => onEditTask(task)}
                                        >
                                            <Edit2 size={16} color={Colors.primary} />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                                            onPress={() => handleCancel(task.id)}
                                        >
                                            <X size={16} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
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
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: Colors.background,
        borderRadius: 32,
        width: '100%',
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qId: {
        color: Colors.error,
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 4,
    },
    title: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        color: Colors.textDim,
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    list: {
        paddingBottom: 20,
    },
    taskItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    taskInfoArea: {
        flex: 1,
        paddingVertical: 16,
        paddingLeft: 20,
    },
    taskTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskTime: {
        color: Colors.error,
        fontSize: 13,
    },
    actionArea: {
        flexDirection: 'row',
        paddingRight: 16,
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textDim,
        fontSize: 14,
        fontStyle: 'italic',
    }
});
