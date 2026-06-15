import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CheckCircle2, Circle, Play, AlertTriangle } from 'lucide-react-native';

export default function MatrixDetailModal({ visible, onClose, quadrant, tasks, onToggle, onDetail }: any) {
    const router = useRouter();

    if (!quadrant) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.content, { borderColor: quadrant.color + '40' }]}>
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.qId, { color: quadrant.color }]}>{quadrant.id}</Text>
                            <Text style={styles.title}>{quadrant.label}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {tasks.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No tasks in this quadrant yet.</Text>
                            </View>
                        ) : (
                            tasks.map((task: any) => (
                                <View key={task.id} style={[
                                    styles.taskItemContainer, 
                                    task.isOverloaded 
                                        ? { borderColor: '#ef4444', borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.05)' }
                                        : (!task.done ? {
                                            borderColor: task.isFixed ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                                            borderWidth: 1,
                                            backgroundColor: task.isFixed ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                                        } : {})
                                ]}>
                                    <TouchableOpacity 
                                        style={styles.taskInfoArea}
                                        onPress={() => onDetail(task)}
                                    >
                                        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone, task.isOverloaded && { color: '#ef4444' }]}>
                                            {task.title}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Text style={styles.taskTime}>{task.time || (task.remainingDuration + ' phút')}</Text>
                                            {task.isOverloaded && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                                    <AlertTriangle size={12} color="#ef4444" />
                                                    <Text style={{ fontSize: 10, color: '#ef4444', marginLeft: 2 }}>Quá tải</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.playIcon}
                                        onPress={() => {
                                            onClose();
                                            router.push({
                                                pathname: '/(tabs)/focus',
                                                params: { taskId: task.id, taskTitle: task.title }
                                            });
                                        }}
                                    >
                                        <Play size={18} color="#8b5cf6" fill="#8b5cf6" />
                                    </TouchableOpacity>
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
        backgroundColor: '#130f1e',
        borderRadius: 32,
        width: '100%',
        maxHeight: '80%',
        borderWidth: 1,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    qId: {
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 4,
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
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
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
    },
    taskInfoArea: {
        flex: 1,
        paddingVertical: 16,
        paddingLeft: 20,
    },
    playIcon: {
        paddingLeft: 16,
        paddingRight: 20,
    },
    taskInfo: {
        flex: 1,
        marginLeft: 16,
    },
    taskTitle: {
        color: '#f3f4f6',
        fontSize: 16,
        fontWeight: '500',
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
    },
    taskTime: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#4b5563',
        textAlign: 'center',
    }
});
