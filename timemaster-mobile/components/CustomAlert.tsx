import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertCircle, CheckCircle2, Info, XCircle, BellRing } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'error' | 'warning' | 'notification';
    onClose: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={32} color="#22c55e" />;
            case 'error': return <XCircle size={32} color="#ef4444" />;
            case 'warning': return <AlertCircle size={32} color="#f59e0b" />;
            case 'notification': return <BellRing size={32} color="#a855f7" />;
            default: return <Info size={32} color="#3b82f6" />;
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'notification': return '#a855f7';
            default: return '#3b82f6';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
                )}
                
                <Animated.View style={[
                    styles.alertBox,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    }
                ]}>
                    <View style={[styles.topBar, { backgroundColor: getAccentColor() + '20' }]} />
                    
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            {getIcon()}
                        </View>
                        
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        {onConfirm ? (
                            <>
                                <TouchableOpacity style={styles.cancelButton} onPress={onCancel || onClose}>
                                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.confirmButton, { backgroundColor: getAccentColor() }]} 
                                    onPress={onConfirm}
                                >
                                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.confirmButton, { backgroundColor: getAccentColor() }]} 
                                onPress={onClose}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        width: width * 0.85,
        backgroundColor: '#171717',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    topBar: {
        height: 4,
        width: '100%',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    confirmButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
});
