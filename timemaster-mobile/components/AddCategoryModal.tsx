import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X, Briefcase, Heart, BookOpen, User, Star, Coffee, Gamepad2 } from 'lucide-react-native';

interface AddCategoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (category: any) => void;
    category?: any; // To support edit mode
}

export default function AddCategoryModal({ visible, onClose, onSave, category }: AddCategoryModalProps) {
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Briefcase');
    const [selectedColor, setSelectedColor] = useState('#60a5fa');

    useEffect(() => {
        if (category) {
            setName(category.name || '');
            setSelectedIcon(category.iconName || 'Briefcase');
            setSelectedColor(category.color || '#60a5fa');
        } else if (visible) {
            setName('');
            setSelectedIcon('Briefcase');
            setSelectedColor('#60a5fa');
        }
    }, [category, visible]);

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

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ 
            id: category?.id, // Include ID if editing
            name, 
            iconName: selectedIcon, 
            color: selectedColor 
        });
        setName('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{category ? 'Edit Category' : 'New Category'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Personal Projects"
                            placeholderTextColor="#4b5563"
                            value={name}
                            onChangeText={setName}
                        />

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

                        <Text style={styles.label}>Theme Color</Text>
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
                            <Text style={styles.addBtnText}>{category ? 'Update Category' : 'Create Category'}</Text>
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
