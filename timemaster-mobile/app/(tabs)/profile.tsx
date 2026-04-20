import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, BarChart3, Award } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn thoát không?",
            Platform.OS === 'ios' ? [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Đăng xuất", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            // Không cần redirect thủ công, RootLayout sẽ tự đẩy ra Login
                        } catch (error) {
                            console.error('Logout failed:', error);
                            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
                        }
                    }
                }
            ] : [
                { 
                    text: "Đăng xuất", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            // Không cần redirect thủ công, RootLayout sẽ tự đẩy ra Login
                        } catch (error) {
                            console.error('Logout failed:', error);
                            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
                        }
                    } 
                },
                { text: "Hủy", style: "cancel" }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Settings size={22} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=8b5cf6&color=fff` }} style={styles.avatar} />
                        <TouchableOpacity style={styles.editBadge}>
                            <User size={14} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.fullName || 'TimeMaster User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'đang tải...'}</Text>

                    <View style={styles.levelBadge}>
                        <Award size={14} color="#facc15" />
                        <Text style={styles.levelText}>Productivity Master • Lvl 1</Text>
                    </View>
                </View>

                {/* Main Menu */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>

                    <MenuLink icon={<User size={20} color="#60a5fa" />} label="Personal Information" />
                    <MenuLink icon={<BarChart3 size={20} color="#a855f7" />} label="Detailed Analytics" />
                    <MenuLink icon={<Bell size={20} color="#fb923c" />} label="Notifications" />
                    <MenuLink icon={<Shield size={20} color="#22c55e" />} label="Privacy & Security" />
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, { marginTop: 12, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
                        onPress={async () => {
                            await notificationService.testNotificationNow();
                        }}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                                <Bell size={20} color="#8b5cf6" />
                            </View>
                            <Text style={[styles.menuLabel, { color: '#a78bfa' }]}>Test Báo Thức (5 giây tới)</Text>
                        </View>
                        <ChevronRight size={18} color="#8b5cf6" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Đăng Xuất</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>TimeMaster v1.0.0 (Beta)</Text>
            </ScrollView>
        </View>
    );
}

function MenuLink({ icon, label }: any) {
    return (
        <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
                <View style={styles.iconCircle}>{icon}</View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <ChevronRight size={18} color="#4b5563" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#130f1e',
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
        color: '#ffffff',
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        backgroundColor: '#111113',
        borderRadius: 32,
        padding: 32,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
        borderColor: '#8b5cf6',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#8b5cf6',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#111113',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    userEmail: {
        fontSize: 14,
        color: '#9ca3af',
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
        color: '#facc15',
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4b5563',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
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
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        color: '#f3f4f6',
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
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#374151',
        fontSize: 12,
        marginTop: 32,
    }
});
