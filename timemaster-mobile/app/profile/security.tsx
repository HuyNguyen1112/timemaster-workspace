import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Shield } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { useCustomAlert } from '../../components/CustomAlertContext';

export default function SecurityScreen() {
    const router = useRouter();
    const { showAlert } = useCustomAlert();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert({
                title: 'Lỗi',
                message: 'Vui lòng nhập đầy đủ thông tin mật khẩu.',
                type: 'error'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert({
                title: 'Lỗi',
                message: 'Mật khẩu mới và xác nhận không khớp.',
                type: 'error'
            });
            return;
        }

        if (newPassword.length < 6) {
            showAlert({
                title: 'Lỗi',
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
                type: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);
            await authService.changePassword(currentPassword, newPassword);
            showAlert({
                title: 'Thành công',
                message: 'Mật khẩu đã được thay đổi an toàn.',
                type: 'success'
            });
            router.back();
        } catch (error: any) {
            console.error(error);
            showAlert({
                title: 'Đổi mật khẩu thất bại',
                message: error.response?.data?.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.',
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
                <Text style={styles.headerTitle}>Privacy & Security</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconSection}>
                    <View style={styles.iconCircle}>
                        <Shield size={40} color={Colors.success} />
                    </View>
                    <Text style={styles.sectionDesc}>
                        Change your password to keep your account secure.
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={Colors.textDim}
                        secureTextEntry
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password (min. 6 chars)"
                        placeholderTextColor={Colors.textDim}
                        secureTextEntry
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter new password"
                        placeholderTextColor={Colors.textDim}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
                    onPress={handleChangePassword}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={Colors.surface} />
                    ) : (
                        <>
                            <Check size={20} color={Colors.surface} />
                            <Text style={styles.saveBtnText}>Update Password</Text>
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
    iconSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textDim,
        textAlign: 'center',
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
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.success,
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
