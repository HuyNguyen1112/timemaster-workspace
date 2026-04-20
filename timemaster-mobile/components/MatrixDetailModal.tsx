import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, CheckCircle2, Circle, Play } from 'lucide-react-native';

export default function MatrixDetailModal({ visible, onClose, quadrant, tasks, onToggle, onDetail }: any) {
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
                                <View key={task.id} style={styles.taskItemContainer}>
                                    <TouchableOpacity 
                                        style={styles.toggleArea} 
                                        onPress={() => onToggle(task.id)}
                                    >
                                        {task.done ? <CheckCircle2 size={24} color="#22c55e" /> : <Circle size={24} color="#6b7280" />}
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.taskInfoArea}
                                        onPress={() => onDetail(task)}
                                    >
                                        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                                        <Text style={styles.taskTime}>{task.time}</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.playIcon}>
                                        <Play size={18} color="#4b5563" />
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
    toggleArea: {
        padding: 16,
        paddingRight: 8,
    },
    taskInfoArea: {
        flex: 1,
        paddingVertical: 16,
    },
    playIcon: {
        padding: 16,
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
