import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, BarChart3, Award } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import { useCustomAlert } from '../../components/CustomAlertContext';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useCustomAlert();

    const handleLogout = async () => {
        showAlert({
            title: 'Đăng xuất',
            message: 'Bạn có chắc chắn muốn thoát không? Các thói quen và mục tiêu của bạn đang chờ bạn đó!',
            type: 'notification',
            confirmText: 'Đăng xuất ngay',
            cancelText: 'Ở lại',
            onConfirm: async () => {
                await signOut();
            }
        });
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                    <Settings size={22} color={Colors.text} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=${Colors.primary.replace('#', '')}&color=fff` }} style={styles.avatar} />
                        <TouchableOpacity style={styles.editBadge}>
                            <User size={14} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.fullName || 'TimeMaster User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'đang tải...'}</Text>

                    <View style={styles.levelBadge}>
                        <Award size={14} color={Colors.warning} />
                        <Text style={styles.levelText}>Productivity Master • Lvl 1</Text>
                    </View>
                </View>

                {/* Main Menu */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>

                    <MenuLink 
                        icon={<User size={20} color={Colors.matrix.q3} />} 
                        label="Personal Information" 
                        onPress={() => router.push('/profile/info')}
                    />
                    <MenuLink 
                        icon={<BarChart3 size={20} color={Colors.primary} />} 
                        label="Detailed Analytics" 
                        onPress={() => router.push('/analytics')}
                    />
                    <MenuLink 
                        icon={<Shield size={20} color={Colors.success} />} 
                        label="Privacy & Security" 
                        onPress={() => router.push('/profile/security')}
                    />
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, { marginTop: 12, backgroundColor: Colors.primary + '10', borderColor: Colors.primary, borderWidth: 1 }]}
                        onPress={async () => {
                            await notificationService.testNotificationNow();
                        }}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
                                <Bell size={20} color={Colors.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: Colors.primary }]}>Test Báo Thức (5 giây tới)</Text>
                        </View>
                        <ChevronRight size={18} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Đăng Xuất</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>TimeMaster v1.0.0 (Beta)</Text>
            </ScrollView>
        </View>
    );
}

function MenuLink({ icon, label, onPress }: any) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={styles.iconCircle}>{icon}</View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textDim} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 120,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 32,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: Colors.primary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.surface,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(250,204,21,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
    },
    levelText: {
        color: Colors.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239,68,68,0.05)',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.1)',
    },
    logoutText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textDim,
        fontSize: 12,
        marginTop: 32,
    }
});
