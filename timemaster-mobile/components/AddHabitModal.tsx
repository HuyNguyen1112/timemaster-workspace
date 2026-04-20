import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X, Flame, Droplets, Book, Dumbbell, Code, Brain, Music, Plus, Minus } from 'lucide-react-native';

interface AddHabitModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (habit: any) => void;
}

export default function AddHabitModal({ visible, onClose, onAdd }: AddHabitModalProps) {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('1');
    const [unit, setUnit] = useState('times');
    const [selectedIcon, setSelectedIcon] = useState('Flame');
    const [selectedColor, setSelectedColor] = useState('#fb923c');

    const icons = [
        { name: 'Flame', component: <Flame size={24} /> },
        { name: 'Droplets', component: <Droplets size={24} /> },
        { name: 'Book', component: <Book size={24} /> },
        { name: 'Dumbbell', component: <Dumbbell size={24} /> },
        { name: 'Code', component: <Code size={24} /> },
        { name: 'Brain', component: <Brain size={24} /> },
        { name: 'Music', component: <Music size={24} /> },
    ];

    const colors = ['#fb923c', '#60a5fa', '#c084fc', '#4ade80', '#f87171', '#fbbf24', '#2dd4bf'];

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd({
            name: title,
            icon: selectedIcon,
            dailyGoal: parseInt(goal) || 1,
            unit: unit || 'times',
            colorCode: selectedColor,
            frequency: 'DAILY'
        });
        setTitle('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Brand New Habit</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Name your habit</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Read for 30 mins"
                            placeholderTextColor="#4b5563"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Goal & Unit</Text>
                        <View style={styles.goalRow}>
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => setGoal(Math.max(1, parseInt(goal) - 1).toString())} style={styles.stepBtn}>
                                    <Minus size={18} color="#ffffff" />
                                </TouchableOpacity>
                                <TextInput 
                                    style={styles.goalText}
                                    value={goal}
                                    onChangeText={(val) => setGoal(val.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity onPress={() => setGoal((parseInt(goal) + 1).toString())} style={styles.stepBtn}>
                                    <Plus size={18} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.input, { flex: 1, marginLeft: 12 }]}
                                placeholder="unit (e.g. times, mins)"
                                placeholderTextColor="#4b5563"
                                value={unit}
                                onChangeText={setUnit}
                            />
                        </View>

                        <Text style={styles.label}>Icon</Text>
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

                        <Text style={styles.label}>Color</Text>
                        <View style={styles.colorRow}>
                            {colors.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.selectedColorCircle]}
                                    onPress={() => setSelectedColor(color)}
                                />
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: selectedColor }]} onPress={handleSubmit}>
                            <Text style={styles.addBtnText}>Start Habit</Text>
                        </TouchableOpacity>
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
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
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
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    selectedColorCircle: {
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    addBtn: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    addBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
