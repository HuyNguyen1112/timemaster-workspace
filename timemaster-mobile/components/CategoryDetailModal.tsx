import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { X, CheckCircle2, Circle, Target, Flame, Trash2, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2, Wrench } from 'lucide-react-native';

export default function CategoryDetailModal({ visible, onClose, category, items, onDelete, onToggle, onDetail, onEdit }: any) {
    if (!category) return null;

    const iconMap: any = {
        Briefcase: <Briefcase size={24} />,
        Heart: <Heart size={24} />,
        BookOpen: <BookOpen size={24} />,
        User: <User size={24} />,
        Star: <Star size={24} />,
        Coffee: <Coffee size={24} />,
        Gamepad2: <Gamepad2 size={24} />,
    };

    const renderIcon = () => {
        const icon = iconMap[category.iconName] || <Star size={24} />;
        return React.cloneElement(icon as any, { color: category.color });
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Category",
            "Are you sure you want to delete this category? Linked tasks will not be deleted but will have no category.",
            Platform.OS === 'ios' ? [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        onDelete(category.id);
                        onClose();
                    } 
                }
            ] : [
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        onDelete(category.id);
                        onClose();
                    } 
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.content, { borderColor: category.color + '40', borderWidth: 1.5, borderBottomWidth: 0 }]}>
                    <View style={styles.header}>
                        <View style={styles.titleInfo}>
                            <View style={[styles.iconBox, { backgroundColor: category.color + '20' }]}>
                                {renderIcon()}
                            </View>
                            <View>
                                <Text style={styles.title}>{category.name}</Text>
                                <Text style={styles.sub}>{items.length} items today</Text>
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(category)} style={styles.actionBtnSmall}>
                                <Wrench size={18} color="#60a5fa" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={styles.actionBtnSmall}>
                                <Trash2 size={18} color="#f87171" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.actionBtnSmall}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {items.length === 0 ? (
                            <Text style={styles.empty}>No tasks today in this category.</Text>
                        ) : (
                            items.map((item: any) => (
                                <View key={item.id} style={styles.taskItemContainer}>
                                    <TouchableOpacity 
                                        style={styles.toggleArea} 
                                        onPress={() => onToggle(item.id)}
                                    >
                                        {item.done ? <CheckCircle2 size={22} color="#22c55e" /> : <Circle size={22} color="#6b7280" />}
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.taskInfoArea}
                                        onPress={() => onDetail(item)}
                                    >
                                        <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>{item.title}</Text>
                                        <View style={styles.taskMetaRow}>
                                            <Target size={12} color="#60a5fa" />
                                            <Text style={styles.taskMetaText}>{item.matrix || 'Task'}</Text>
                                            <Text style={styles.taskTime}>{item.time}</Text>
                                        </View>
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#130f1e',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: '50%',
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    titleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sub: {
        color: '#6b7280',
        fontSize: 12,
    },
    actionBtnSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    list: {
        paddingBottom: 40,
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
    taskTitle: {
        color: '#f3f4f6',
        fontSize: 16,
        fontWeight: '500',
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    taskMetaText: {
        color: '#60a5fa',
        fontSize: 11,
        fontWeight: '600',
    },
    taskTime: {
        color: '#6b7280',
        fontSize: 12,
        marginLeft: 4,
    },
    empty: {
        color: '#4b5563',
        textAlign: 'center',
        marginTop: 40,
    }
});
