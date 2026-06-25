import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { X, Calendar, Clock, Layout, Ban, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2, Zap, Anchor, Trash2 } from 'lucide-react-native';
import { useCustomAlert } from './CustomAlertContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/theme';

export default function AddTaskModal({ visible, onClose, onAdd, onAddEvent, onDeleteEvent, task, contexts }: any) {
    const { showAlert } = useCustomAlert();
    const [title, setTitle] = useState('');
    const [matrix, setMatrix] = useState('Q1');
    const [durationHours, setDurationHours] = useState('1');
    const [durationMins, setDurationMins] = useState('0');
    const [description, setDescription] = useState('');
    const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [mode, setMode] = useState<'flex'|'fixed'|'event'>('flex');

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
            setMatrix(task.matrix || task.matrixType || 'Q1');
            const totalMins = task.duration !== undefined ? task.duration : (task.estimatedDuration ? Math.round(task.estimatedDuration * 60) : 60);
            setDurationHours(String(Math.floor(totalMins / 60)));
            setDurationMins(String(totalMins % 60));
            setDescription(task.description || '');
            setSelectedContextId(task.contextId || null);
            setMode(task.isEvent ? 'event' : (task.isFixed ? 'fixed' : 'flex'));
            if (task.date) setDate(new Date(task.date));
            if (task.time || task.startTime) {
                const timeStr = task.time || (task.startTime && task.startTime.split('T')[1]);
                if (timeStr) {
                    const [hours, minutes] = timeStr.split(':');
                    const t = new Date();
                    t.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setTime(t);
                }
            }
            if (task.endTime) {
                const timeStr = task.endTime.split('T')[1];
                if (timeStr) {
                    const [hours, minutes] = timeStr.split(':');
                    const t = new Date();
                    t.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setEndTime(t);
                }
            }
        } else if (visible) {
            setTitle(''); setMatrix('Q1'); setDurationHours('1'); setDurationMins('0'); setDescription(''); setSelectedContextId(null); setDate(new Date()); setTime(new Date()); 
            const end = new Date(); end.setHours(end.getHours() + 1); setEndTime(end);
            setMode('flex');
        }
    }, [task, visible]);

    const handleAdd = () => {
        if (!title.trim()) {
            showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tên công việc.', type: 'warning' });
            return;
        }

        if (mode === 'event') {
            const startDateTime = new Date(date);
            startDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

            const endDateTime = new Date(date);
            endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

            if (endDateTime <= startDateTime) {
                showAlert({ title: 'Thời gian không hợp lệ', message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.', type: 'warning' });
                return;
            }

            const formatLocalISO = (d: Date) => {
                const pad = (num: number) => num.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
            };

            if (onAddEvent) {
                onAddEvent({ 
                    id: task?.id, 
                    title, 
                    contextId: selectedContextId,
                    startTime: formatLocalISO(startDateTime),
                    endTime: formatLocalISO(endDateTime),
                });
            }
            return;
        }

        if (mode === 'flex' && !selectedContextId) {
            showAlert({ title: 'Missing Context', message: 'Flex tasks require a Context.', type: 'warning' });
            return;
        }

        const now = new Date();
        const selectedDateTime = new Date(date);
        selectedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
        
        if (mode === 'fixed' && selectedDateTime < now) {
            showAlert({ title: 'Invalid Time', message: 'Cannot schedule fixed task in the past.', type: 'warning' });
            return;
        }

        onAdd({ 
            id: task?.id, 
            title, 
            description, 
            matrix, 
            contextId: selectedContextId,
            duration: ((parseInt(durationHours) || 0) + (parseInt(durationMins) || 0) / 60) || 1.0, 
            date: date.toISOString().split('T')[0],
            time: mode === 'fixed' ? time.toTimeString().split(' ')[0].substring(0, 5) : null,
            isFixed: mode === 'fixed'
        });
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
                            <Text style={styles.title}>{(task && task.id) ? (task.isEvent ? 'Edit Event' : 'Edit Task') : 'New Task'}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {task?.id && task?.isEvent && onDeleteEvent && (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            showAlert({
                                                title: "Xác nhận xóa",
                                                message: "Bạn có chắc chắn muốn xóa sự kiện này?",
                                                type: "warning",
                                                confirmText: "Xóa",
                                                cancelText: "Hủy",
                                                onConfirm: () => onDeleteEvent(task.id)
                                            });
                                        }} 
                                        style={[styles.closeBtn, { marginRight: 8 }]}
                                    >
                                        <Trash2 size={20} color={Colors.error} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <X size={20} color={Colors.textDim} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                            
                            {/* Mode Toggle */}
                            {!task?.id && (
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity 
                                        style={[styles.toggleBtn, mode === 'flex' && styles.toggleBtnActiveFlex]}
                                        onPress={() => setMode('flex')}
                                    >
                                        <Zap size={14} color={mode === 'flex' ? Colors.text : Colors.textDim} />
                                        <Text style={[styles.toggleText, mode === 'flex' && { color: Colors.text }]} numberOfLines={1}>Flex Task</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.toggleBtn, mode === 'fixed' && styles.toggleBtnActiveFixed]}
                                        onPress={() => setMode('fixed')}
                                    >
                                        <Anchor size={14} color={mode === 'fixed' ? Colors.text : Colors.textDim} />
                                        <Text style={[styles.toggleText, mode === 'fixed' && { color: Colors.text }]} numberOfLines={1}>Fixed Task</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.toggleBtn, mode === 'event' && { backgroundColor: '#f97316', borderColor: '#f97316' }]}
                                        onPress={() => setMode('event')}
                                    >
                                        <Calendar size={14} color={mode === 'event' ? Colors.text : Colors.textDim} />
                                        <Text style={[styles.toggleText, mode === 'event' && { color: Colors.text }]} numberOfLines={1}>Event</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>What needs to be done?</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Task title..."
                                    placeholderTextColor={Colors.textDim}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            {mode !== 'event' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Description</Text>
                                    <View style={[styles.input, { minHeight: 80, paddingTop: 12 }]}>
                                        <TextInput
                                            style={{ color: Colors.text, fontSize: 16, textAlignVertical: 'top' }}
                                            placeholder="Add notes..."
                                            placeholderTextColor={Colors.textDim}
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>
                                </View>
                            )}

                            {mode !== 'fixed' && mode !== 'event' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Context (Required for Flex)</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} nestedScrollEnabled={true}>
                                        <TouchableOpacity 
                                            style={[styles.contextMiniItem, selectedContextId === null && styles.contextMiniItemActive]}
                                            onPress={() => setSelectedContextId(null)}
                                        >
                                            <Ban size={18} color={selectedContextId === null ? Colors.text : Colors.textDim} />
                                        </TouchableOpacity>

                                        {contexts?.map((ctx: any) => (
                                            <TouchableOpacity 
                                                key={ctx.id}
                                                style={[styles.contextMiniItem, selectedContextId === ctx.id && { backgroundColor: ctx.colorCode, borderColor: ctx.colorCode }]}
                                                onPress={() => setSelectedContextId(ctx.id)}
                                            >
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedContextId === ctx.id ? '#fff' : ctx.colorCode }} />
                                                <Text style={[styles.contextMiniLabel, selectedContextId === ctx.id && { color: Colors.text }]}>
                                                    {ctx.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {mode !== 'event' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Eisenhower Matrix</Text>
                                    <View style={styles.matrixGrid}>
                                        {[
                                            { id: 'Q1', label: 'Urgent & Important', color: Colors.matrix.q1 },
                                            { id: 'Q2', label: 'Important, Not Urgent', color: Colors.matrix.q2 },
                                            { id: 'Q3', label: 'Urgent, Not Important', color: Colors.matrix.q3 },
                                            { id: 'Q4', label: 'Casual', color: Colors.matrix.q4 },
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
                            )}

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: mode === 'fixed' || mode === 'event' ? 12 : 0 }]}>
                                    <Text style={styles.label}>{mode === 'fixed' || mode === 'event' ? 'Date' : 'Target Date'}</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowDatePicker(true)}>
                                        <Calendar size={16} color={Colors.primary} />
                                        <Text style={styles.dateValue}>{date.toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                </View>
                                {(mode === 'fixed' || mode === 'event') && (
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>{mode === 'event' ? 'Start Time' : 'Time'}</Text>
                                        <TouchableOpacity style={styles.iconInput} onPress={() => setShowTimePicker(true)}>
                                            <Clock size={16} color={Colors.primary} />
                                            <Text style={styles.dateValue}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {mode === 'event' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>End Time</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowEndTimePicker(true)}>
                                        <Clock size={16} color={Colors.primary} />
                                        <Text style={styles.dateValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {mode !== 'event' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Thời lượng ước tính</Text>
                                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                                        <View style={[styles.iconInput, { flex: 1 }]}>
                                            <Text style={{ color: Colors.textDim, fontSize: 13 }}>Giờ</Text>
                                            <TextInput
                                                style={styles.smallInput}
                                                keyboardType="numeric"
                                                value={durationHours}
                                                onChangeText={v => setDurationHours(v.replace(/[^0-9]/g, ''))}
                                                placeholderTextColor={Colors.textDim}
                                                maxLength={2}
                                            />
                                            <Text style={{ color: Colors.textDim, fontSize: 12 }}>h</Text>
                                        </View>
                                        <View style={[styles.iconInput, { flex: 1 }]}>
                                            <Text style={{ color: Colors.textDim, fontSize: 13 }}>Phút</Text>
                                            <TextInput
                                                style={styles.smallInput}
                                                keyboardType="numeric"
                                                value={durationMins}
                                                onChangeText={v => {
                                                    const n = parseInt(v.replace(/[^0-9]/g, '')) || 0;
                                                    setDurationMins(String(Math.min(59, n)));
                                                }}
                                                placeholderTextColor={Colors.textDim}
                                                maxLength={2}
                                            />
                                            <Text style={{ color: Colors.textDim, fontSize: 12 }}>m</Text>
                                        </View>
                                    </View>
                                    {/* Quick presets */}
                                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                        {[{label:'30m',h:0,m:30},{label:'1h',h:1,m:0},{label:'1h30',h:1,m:30},{label:'2h',h:2,m:0},{label:'4h',h:4,m:0},{label:'8h',h:8,m:0}].map(p => {
                                            const active = parseInt(durationHours||'0')===p.h && parseInt(durationMins||'0')===p.m;
                                            return (
                                                <TouchableOpacity
                                                    key={p.label}
                                                    style={[{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: active ? Colors.primary : Colors.border, backgroundColor: active ? Colors.primary + '20' : Colors.background }]}
                                                    onPress={() => { setDurationHours(String(p.h)); setDurationMins(String(p.m)); }}
                                                >
                                                    <Text style={{ color: active ? Colors.primary : Colors.textDim, fontSize: 13, fontWeight: active ? '700' : '400' }}>{p.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {showDatePicker && (
                            <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                        )}
                        {showTimePicker && (
                            <DateTimePicker value={time} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowTimePicker(false); if (t) setTime(t); }} />
                        )}
                        {showEndTimePicker && (
                            <DateTimePicker value={endTime} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12 },
    toggleContainer: { flexDirection: 'row', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 4, marginBottom: 24 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    toggleBtnActiveFlex: { backgroundColor: Colors.primary },
    toggleBtnActiveFixed: { backgroundColor: Colors.warning },
    toggleText: { color: Colors.textDim, fontSize: 14, fontWeight: '600' },
    inputGroup: { marginBottom: 24 },
    label: { color: Colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    input: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, color: Colors.text, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    matrixItem: { width: '48%', backgroundColor: Colors.background, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
    matrixId: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    matrixLabel: { color: Colors.text, fontSize: 12, fontWeight: '500' },
    row: { flexDirection: 'row' },
    iconInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
    smallInput: { color: Colors.text, fontSize: 14, flex: 1 },
    dateValue: { color: Colors.text, fontSize: 14 },
    contextMiniItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, gap: 8 },
    contextMiniItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    contextMiniLabel: { color: Colors.textDim, fontSize: 13, fontWeight: '600' },
    submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10 },
    submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
