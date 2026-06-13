import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { X, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2, Plus, Trash2, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCustomAlert } from './CustomAlertContext';

interface ScheduleBlock {
    days: number[];
    startTime: string;
    endTime: string;
}

interface AddContextModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (ctx: any) => void;
    context?: any; // To support edit mode
}

export default function AddContextModal({ visible, onClose, onSave, context }: AddContextModalProps) {
    const { showAlert } = useCustomAlert();
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Briefcase');
    const [selectedColor, setSelectedColor] = useState('#60a5fa');
    const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState<{ index: number, field: 'startTime' | 'endTime' } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        if (context) {
            setName(context.name || '');
            setSelectedIcon(context.iconName || 'Briefcase');
            setSelectedColor(context.colorCode || context.color || '#60a5fa');
            // Group existing schedules by startTime & endTime
            const existingSchedules = context.schedules || [];
            const blocks: ScheduleBlock[] = [];
            existingSchedules.forEach((sch: any) => {
                const existingBlock = blocks.find(b => b.startTime === sch.startTime && b.endTime === sch.endTime);
                if (existingBlock) {
                    if (!existingBlock.days.includes(sch.dayOfWeek)) {
                        existingBlock.days.push(sch.dayOfWeek);
                    }
                } else {
                    blocks.push({ days: [sch.dayOfWeek], startTime: sch.startTime, endTime: sch.endTime });
                }
            });
            if (blocks.length === 0) {
                blocks.push({ days: [2,3,4,5,6], startTime: '08:00', endTime: '17:00' });
            }
            setSchedules(blocks);
        } else if (visible) {
            setName('');
            setSelectedIcon('Briefcase');
            setSelectedColor('#60a5fa');
            setSchedules([{ days: [2,3,4,5,6], startTime: '08:00', endTime: '17:00' }]);
        }
    }, [context, visible]);

    const icons = [
        { name: 'Briefcase', component: <Briefcase size={24} /> },
        { name: 'Heart', component: <Heart size={24} /> },
        { name: 'BookOpen', component: <BookOpen size={24} /> },
        { name: 'User', component: <User size={24} /> },
        { name: 'Star', component: <Star size={24} /> },
        { name: 'Coffee', component: <Coffee size={24} /> },
        { name: 'Gamepad2', component: <Gamepad2 size={24} /> },
    ];

    const colors = ['#60a5fa', '#ef4444', '#a855f7', '#22c55e', '#f97316', '#facc15', '#ec4899'];

    const daysOfWeek = [
        { label: 'T2', value: 2 },
        { label: 'T3', value: 3 },
        { label: 'T4', value: 4 },
        { label: 'T5', value: 5 },
        { label: 'T6', value: 6 },
        { label: 'T7', value: 7 },
        { label: 'CN', value: 1 },
    ];

    const handleSubmit = () => {
        if (!name.trim()) {
            showAlert({
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập tên cho Context!',
                type: 'warning',
                confirmText: 'Đã hiểu',
            });
            return;
        }

        // Validation for identical times
        for (let i = 0; i < schedules.length; i++) {
            for (let j = i + 1; j < schedules.length; j++) {
                if (schedules[i].startTime === schedules[j].startTime && schedules[i].endTime === schedules[j].endTime) {
                    showAlert({
                        title: 'Lỗi trùng lịch trình',
                        message: 'Có 2 cụm lịch trình trùng thời gian với nhau. Hãy gộp chúng lại vào 1 cụm để chọn nhiều ngày!',
                        type: 'error',
                        confirmText: 'Đã hiểu',
                    });
                    return;
                }
            }
        }

        const finalSchedules: any[] = [];
        schedules.forEach(block => {
            block.days.forEach(day => {
                finalSchedules.push({ dayOfWeek: day, startTime: block.startTime, endTime: block.endTime });
            });
        });

        onSave({ 
            id: context?.id,
            name, 
            iconName: selectedIcon, 
            colorCode: selectedColor,
            schedules: finalSchedules
        });
        setName('');
        onClose();
    };

    const addSchedule = () => {
        setSchedules([...schedules, { days: [2], startTime: '08:00', endTime: '17:00' }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    const toggleScheduleDay = (index: number, day: number) => {
        const newSchedules = [...schedules];
        const block = newSchedules[index];
        if (block.days.includes(day)) {
            block.days = block.days.filter(d => d !== day);
        } else {
            block.days.push(day);
        }
        setSchedules(newSchedules);
    };

    const openTimePicker = (index: number, field: 'startTime' | 'endTime', currentDateStr: string) => {
        const [hours, minutes] = currentDateStr.split(':').map(Number);
        const d = new Date();
        d.setHours(hours || 0);
        d.setMinutes(minutes || 0);
        d.setSeconds(0);
        setTempDate(d);
        setTimePickerTarget({ index, field });
        setShowTimePicker(true);
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedDate && timePickerTarget) {
            const timeStr = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
            const newSchedules = [...schedules];
            newSchedules[timePickerTarget.index][timePickerTarget.field] = timeStr;
            setSchedules(newSchedules);
            setTempDate(selectedDate);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{context ? 'Chỉnh sửa Context' : 'Context mới'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        <Text style={styles.label}>Tên Context</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="vd: Công việc, Cá nhân..."
                            placeholderTextColor="#4b5563"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Biểu tượng</Text>
                        <View style={styles.grid}>
                            {icons.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={[styles.iconBox, selectedIcon === icon.name && { borderColor: selectedColor, backgroundColor: selectedColor + '20' }]}
                                    onPress={() => setSelectedIcon(icon.name)}
                                >
                                    {React.cloneElement(icon.component as any, { color: selectedIcon === icon.name ? selectedColor : '#4b5563' })}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Màu chủ đạo</Text>
                        <View style={styles.colorRow}>
                            {colors.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.selectedColorCircle]}
                                    onPress={() => setSelectedColor(color)}
                                />
                            ))}
                        </View>

                        <View style={styles.schedulesSection}>
                            <View style={styles.scheduleHeader}>
                                <Text style={styles.label}>Lịch trình (Schedules)</Text>
                                    <TouchableOpacity style={styles.addScheduleBtn} onPress={addSchedule}>
                                        <Plus size={16} color={selectedColor} />
                                        <Text style={[styles.addScheduleText, { color: selectedColor }]}>Thêm</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {schedules.map((sch, index) => (
                                    <View key={index} style={styles.scheduleCard}>
                                        {schedules.length > 1 && (
                                            <TouchableOpacity style={styles.deleteScheduleBtn} onPress={() => removeSchedule(index)}>
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.daySelectorRow}>
                                            {daysOfWeek.map((day) => (
                                                <TouchableOpacity
                                                    key={day.value}
                                                    style={[
                                                        styles.dayCircle,
                                                        sch.days.includes(day.value) && { backgroundColor: selectedColor, borderColor: selectedColor }
                                                    ]}
                                                    onPress={() => toggleScheduleDay(index, day.value)}
                                                >
                                                    <Text style={[
                                                        styles.dayText,
                                                        sch.days.includes(day.value) && styles.dayTextActive
                                                    ]}>
                                                        {day.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <View style={styles.timeSelectorRow}>
                                            <View style={styles.timeBlock}>
                                                <Text style={styles.timeLabel}>Từ</Text>
                                                <TouchableOpacity 
                                                    style={styles.timePickerBtn}
                                                    onPress={() => openTimePicker(index, 'startTime', sch.startTime)}
                                                >
                                                    <Clock size={14} color="#9ca3af" />
                                                    <Text style={styles.timeValueText}>{sch.startTime}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.timeDivider} />
                                            <View style={styles.timeBlock}>
                                                <Text style={styles.timeLabel}>Đến</Text>
                                                <TouchableOpacity 
                                                    style={styles.timePickerBtn}
                                                    onPress={() => openTimePicker(index, 'endTime', sch.endTime)}
                                                >
                                                    <Clock size={14} color="#9ca3af" />
                                                    <Text style={styles.timeValueText}>{sch.endTime}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: selectedColor, marginTop: 24 }]} onPress={handleSubmit}>
                            <Text style={styles.addBtnText}>{context ? 'Cập nhật Context' : 'Tạo mới'}</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {showTimePicker && (
                        <DateTimePicker
                            value={tempDate}
                            mode="time"
                            is24Hour={true}
                            display="default"
                            onChange={handleTimeChange}
                        />
                    )}
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
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeBtn: {
        padding: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 16,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        color: '#ffffff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedColorCircle: {
        borderColor: '#ffffff',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    labelSwitch: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    schedulesSection: {
        marginTop: 8,
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addScheduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        marginTop: 4,
    },
    addScheduleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyScheduleText: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 4,
    },
    scheduleCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    deleteScheduleBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
        zIndex: 10,
    },
    daySelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 4,
        paddingRight: 24,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4b5563',
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
    },
    dayTextActive: {
        color: '#ffffff',
    },
    timeSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBlock: {
        alignItems: 'center',
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 6,
    },
    timePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6,
    },
    timeValueText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    timeDivider: {
        width: 16,
        height: 2,
        backgroundColor: '#4b5563',
        marginHorizontal: 8,
        marginTop: 20,
    },
    addBtn: {
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    addBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
