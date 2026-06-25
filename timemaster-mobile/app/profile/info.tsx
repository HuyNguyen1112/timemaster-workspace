import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, User } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCustomAlert } from '../../components/CustomAlertContext';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const { showAlert } = useCustomAlert();
    
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            showAlert({
                title: 'Lỗi',
                message: 'Tên không được để trống.',
                type: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);
            await updateUser(fullName);
            showAlert({
                title: 'Thành công',
                message: 'Đã cập nhật thông tin cá nhân.',
                type: 'success'
            });
            router.back();
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Lỗi',
                message: 'Không thể cập nhật thông tin lúc này.',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Info</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <User size={40} color={Colors.primary} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name"
                        placeholderTextColor={Colors.textDim}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address (Read-only)</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={user?.email || ''}
                        editable={false}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={Colors.surface} />
                    ) : (
                        <>
                            <Check size={20} color={Colors.surface} />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        paddingTop: 60,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDim,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
    },
    disabledInput: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        color: Colors.textDim,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: Colors.surface,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
