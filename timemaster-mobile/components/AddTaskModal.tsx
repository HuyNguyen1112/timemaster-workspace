import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { X, Calendar, Clock, Flag, Layout, Ban, AlignLeft, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTaskModal({ visible, onClose, onAdd, task, categories }: any) {
    // ... (state and logic remain the same)
    const [title, setTitle] = useState('');
    const [matrix, setMatrix] = useState('Q1');
    const [duration, setDuration] = useState('60');
    const [description, setDescription] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const iconMap: any = {
        Briefcase: <Briefcase size={20} />,
        Heart: <Heart size={20} />,
        BookOpen: <BookOpen size={20} />,
        User: <User size={20} />,
        Star: <Star size={20} />,
        Coffee: <Coffee size={20} />,
        Gamepad2: <Gamepad2 size={20} />,
    };

    React.useEffect(() => {
        if (task && visible) {
            setTitle(task.title || '');
            setMatrix(task.matrix || 'Q1');
            setDuration(task.duration?.toString() || '60');
            setDescription(task.description || '');
            setSelectedCategoryId(task.categoryId || null);
            if (task.date) setDate(new Date(task.date));
            if (task.time) {
                const [hours, minutes] = task.time.split(':');
                const t = new Date();
                t.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                setTime(t);
            }
        } else if (visible) {
            setTitle(''); setMatrix('Q1'); setDuration('60'); setDescription(''); setSelectedCategoryId(null); setDate(new Date()); setTime(new Date());
        }
    }, [task, visible]);

    const handleAdd = () => {
        if (!title.trim()) return;
        const now = new Date();
        const selectedDateTime = new Date(date);
        selectedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
        if (selectedDateTime < now) {
            Alert.alert('Invalid Time', 'Cannot save tasks in the past.');
            return;
        }
        onAdd({ 
            id: task?.id, title, description, matrix, categoryId: selectedCategoryId,
            duration: parseInt(duration) || 60, date: date.toISOString().split('T')[0],
            time: time.toTimeString().split(' ')[0].substring(0, 5)
        });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.overlay}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{(task && task.id) ? 'Edit Task' : 'New Task'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 24 }}
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>What needs to be done?</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Task title..."
                                    placeholderTextColor="#6b7280"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <View style={[styles.input, { minHeight: 80, paddingTop: 12 }]}>
                                    <TextInput
                                        style={{ color: '#ffffff', fontSize: 16, textAlignVertical: 'top' }}
                                        placeholder="Add notes..."
                                        placeholderTextColor="#6b7280"
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category</Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    contentContainerStyle={{ gap: 12 }}
                                    nestedScrollEnabled={true}
                                >
                                    <TouchableOpacity 
                                        style={[styles.categoryMiniItem, selectedCategoryId === null && styles.categoryMiniItemActive]}
                                        onPress={() => setSelectedCategoryId(null)}
                                    >
                                        <Ban size={18} color={selectedCategoryId === null ? '#ffffff' : '#9ca3af'} />
                                    </TouchableOpacity>

                                    {categories?.map((cat: any) => (
                                        <TouchableOpacity 
                                            key={cat.id}
                                            style={[styles.categoryMiniItem, selectedCategoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                                            onPress={() => setSelectedCategoryId(cat.id)}
                                        >
                                            {iconMap[cat.iconName] ? React.cloneElement(iconMap[cat.iconName], { 
                                                size: 18, color: selectedCategoryId === cat.id ? '#ffffff' : cat.color 
                                            }) : <Star size={18} color={selectedCategoryId === cat.id ? '#ffffff' : cat.color} />}
                                            <Text style={[styles.categoryMiniLabel, selectedCategoryId === cat.id && { color: '#ffffff' }]}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Eisenhower Matrix</Text>
                                <View style={styles.matrixGrid}>
                                    {[
                                        { id: 'Q1', label: 'Urgent & Important', color: '#f97316' },
                                        { id: 'Q2', label: 'Important, Not Urgent', color: '#3b82f6' },
                                        { id: 'Q3', label: 'Urgent, Not Important', color: '#6b7280' },
                                        { id: 'Q4', label: 'Casual', color: '#22c55e' },
                                    ].map((opt) => (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={[styles.matrixItem, matrix === opt.id && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
                                            onPress={() => setMatrix(opt.id)}
                                        >
                                            <Text style={[styles.matrixId, { color: opt.color }]}>{opt.id}</Text>
                                            <Text style={styles.matrixLabel}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                    <Text style={styles.label}>Date</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowDatePicker(true)}>
                                        <Calendar size={16} color="#a855f7" />
                                        <Text style={styles.dateValue}>{date.toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Start Time</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowTimePicker(true)}>
                                        <Clock size={16} color="#a855f7" />
                                        <Text style={styles.dateValue}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Estimated Duration (mins)</Text>
                                <View style={styles.iconInput}>
                                    <Layout size={16} color="#9ca3af" />
                                    <TextInput
                                        style={styles.smallInput}
                                        keyboardType="numeric"
                                        value={duration.toString()}
                                        onChangeText={setDuration}
                                        placeholderTextColor="#6b7280"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        {showDatePicker && (
                            <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                        )}
                        {showTimePicker && (
                            <DateTimePicker value={time} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowTimePicker(false); if (t) setTime(t); }} />
                        )}

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                            <Text style={styles.submitBtnText}>{task ? 'Save Changes' : 'Create Task'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#130f1e',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        color: '#ffffff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    matrixGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    matrixItem: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    matrixId: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    matrixLabel: {
        color: '#d1d5db',
        fontSize: 12,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
    },
    iconInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 10,
    },
    smallInput: {
        color: '#ffffff',
        fontSize: 14,
        flex: 1,
    },
    dateValue: {
        color: '#ffffff',
        fontSize: 14,
    },
    categoryMiniItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 8,
    },
    categoryMiniItemActive: {
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
    },
    categoryMiniLabel: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#8b5cf6',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
