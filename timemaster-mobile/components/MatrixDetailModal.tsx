import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CheckCircle2, Circle, Play, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { focusTargetService } from '../services/pomodoro.service';

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
                            <X size={20} color={Colors.textDim} />
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
                                        ? { borderColor: Colors.error, borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.05)' }
                                        : (!task.done ? {
                                            borderColor: task.isFixed ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                                            borderWidth: 1,
                                            backgroundColor: task.isFixed ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                                        } : {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderWidth: 1,
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)'
                                        })
                                ]}>
                                    <TouchableOpacity 
                                        style={styles.taskInfoArea}
                                        onPress={() => onDetail(task)}
                                    >
                                        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone, task.isOverloaded && { color: Colors.error }]}>
                                            {task.title}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Text style={styles.taskTime}>{task.time || (task.remainingDuration + ' phút')}</Text>
                                            {task.isOverloaded && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                                    <AlertTriangle size={12} color={Colors.error} />
                                                    <Text style={{ fontSize: 10, color: Colors.error, marginLeft: 2 }}>Quá tải</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.playIcon}
                                        onPress={() => {
                                            onClose();
                                            focusTargetService.setTarget({ type: 'TASK', id: task.id, title: task.title });
                                            router.navigate('/(tabs)/focus');
                                        }}
                                    >
                                        <Play size={18} color={Colors.primary} fill={Colors.primary} />
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
        backgroundColor: Colors.background,
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
        color: Colors.text,
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
        color: Colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        color: Colors.textDim,
    },
    taskTime: {
        color: Colors.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textDim,
        textAlign: 'center',
    }
});
