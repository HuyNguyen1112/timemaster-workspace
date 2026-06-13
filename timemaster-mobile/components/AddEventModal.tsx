import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, Calendar, Clock, Flag, Layout, Ban, AlignLeft, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2 } from 'lucide-react-native';
import { useCustomAlert } from './CustomAlertContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddEventModal({ visible, onClose, onAdd, event, contexts }: any) {
    const { showAlert } = useCustomAlert();
    const [title, setTitle] = useState('');
    const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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
        if (event && visible) {
            setTitle(event.title || '');
            setSelectedContextId(event.contextId || null);
            if (event.startTime) {
                const startDate = new Date(event.startTime);
                setDate(startDate);
                setStartTime(startDate);
            }
            if (event.endTime) {
                setEndTime(new Date(event.endTime));
            }
        } else if (visible) {
            setTitle(''); setSelectedContextId(null); 
            setDate(new Date()); 
            setStartTime(new Date()); 
            const end = new Date();
            end.setHours(end.getHours() + 1);
            setEndTime(end);
        }
    }, [event, visible]);

    const handleAdd = () => {
        if (!title.trim()) return;

        const startDateTime = new Date(date);
        startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

        const endDateTime = new Date(date);
        endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        if (endDateTime <= startDateTime) {
            showAlert({
                title: 'Thời gian không hợp lệ',
                message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.',
                type: 'warning'
            });
            return;
        }

        // Format to ISO without Z (Local time)
        const formatLocalISO = (d: Date) => {
            const pad = (num: number) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        };

        onAdd({ 
            id: event?.id, 
            title, 
            contextId: selectedContextId,
            startTime: formatLocalISO(startDateTime),
            endTime: formatLocalISO(endDateTime),
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
                            <Text style={styles.title}>{(event && event.id) ? 'Edit Event' : 'New Event'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Event Title</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Team Meeting..."
                                    placeholderTextColor="#6b7280"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Context (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} nestedScrollEnabled={true}>
                                    <TouchableOpacity 
                                        style={[styles.contextMiniItem, selectedContextId === null && styles.contextMiniItemActive]}
                                        onPress={() => setSelectedContextId(null)}
                                    >
                                        <Ban size={18} color={selectedContextId === null ? '#ffffff' : '#9ca3af'} />
                                    </TouchableOpacity>

                                    {contexts?.map((ctx: any) => (
                                        <TouchableOpacity 
                                            key={ctx.id}
                                            style={[styles.contextMiniItem, selectedContextId === ctx.id && { backgroundColor: ctx.colorCode, borderColor: ctx.colorCode }]}
                                            onPress={() => setSelectedContextId(ctx.id)}
                                        >
                                            {ctx.iconName && iconMap[ctx.iconName] ? React.cloneElement(iconMap[ctx.iconName], { 
                                                size: 18, color: selectedContextId === ctx.id ? '#ffffff' : ctx.colorCode 
                                            }) : <Star size={18} color={selectedContextId === ctx.id ? '#ffffff' : ctx.colorCode} />}
                                            <Text style={[styles.contextMiniLabel, selectedContextId === ctx.id && { color: '#ffffff' }]}>
                                                {ctx.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Date</Text>
                                <TouchableOpacity style={styles.iconInput} onPress={() => setShowDatePicker(true)}>
                                    <Calendar size={16} color="#4b5563" />
                                    <Text style={styles.dateValue}>{date.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                    <Text style={styles.label}>Start Time</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowStartTimePicker(true)}>
                                        <Clock size={16} color="#4b5563" />
                                        <Text style={styles.dateValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>End Time</Text>
                                    <TouchableOpacity style={styles.iconInput} onPress={() => setShowEndTimePicker(true)}>
                                        <Clock size={16} color="#4b5563" />
                                        <Text style={styles.dateValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        {showDatePicker && (
                            <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                        )}
                        {showStartTimePicker && (
                            <DateTimePicker value={startTime} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />
                        )}
                        {showEndTimePicker && (
                            <DateTimePicker value={endTime} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />
                        )}

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                            <Text style={styles.submitBtnText}>{event ? 'Save Changes' : 'Create Event'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    content: { backgroundColor: '#18181b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    inputGroup: { marginBottom: 24 },
    label: { color: '#9ca3af', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, color: '#ffffff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    row: { flexDirection: 'row' },
    iconInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
    dateValue: { color: '#ffffff', fontSize: 14 },
    contextMiniItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
    contextMiniItemActive: { backgroundColor: '#3f3f46', borderColor: '#3f3f46' },
    contextMiniLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
    submitBtn: { backgroundColor: '#3f3f46', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
    submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
