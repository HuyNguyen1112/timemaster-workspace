import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrainCircuit, Mic, Send, Zap, Calendar, CheckCircle2 } from 'lucide-react-native';
import { aiService } from '../../services/ai.service';
import { Colors } from '../../constants/theme';

export default function AiChatScreen() {
    const insets = useSafeAreaInsets();
    const [input, setInput] = useState('');
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<any[]>([
        { id: 1, text: "Hello! I'm your AI Mentor. How can I help you today?", isUser: false }
    ]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMessage = { id: Date.now(), text: input, isUser: true };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const response = await aiService.chat(currentInput);
            
            const aiMessage = {
                id: Date.now() + 1,
                text: response.message,
                isUser: false,
                action: (response.actionTaken && response.actionTaken !== 'none') ? response.actionTaken : null
            };
            
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I'm having trouble connecting to my brain right now. Please check if the services are running.",
                isUser: false,
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderActionWidget = (action: string) => {
        let icon = < Zap size={14} color="#c084fc" />;
        let title = "System Action";
        let color = Colors.primary;
        let description = "The changes have been synced.";

        if (action === 'task_write') {
            icon = <Calendar size={14} color={Colors.matrix.q2} />;
            title = "Schedule Updated";
            color = Colors.matrix.q2;
            description = "Your schedule has been updated successfully.";
        } else if (action === 'habit_write') {
            icon = <CheckCircle2 size={14} color={Colors.success} />;
            title = "Habit Recorded";
            color = Colors.success;
            description = "Your progress has been logged to your habits.";
        } else if (action === 'data_query') {
            // For data queries, show a very subtle indicator or nothing
            return (
                <View style={styles.queryIndicator}>
                    <Zap size={10} color={Colors.textDim} />
                    <Text style={styles.queryIndicatorText}>Dữ liệu thực tế từ hệ thống</Text>
                </View>
            );
        } else if (action === 'ERROR') {
            icon = <Zap size={14} color={Colors.error} />;
            title = "Action Failed";
            color = Colors.error;
            description = "Something went wrong while executing the task.";
        }

        return (
            <View style={[styles.interactiveWidget, { borderColor: color + '30' }]}>
                <View style={styles.widgetHeader}>
                    <View style={styles.widgetTag}>
                        <View style={[styles.tagIconWrapper, { backgroundColor: color + '20' }]}>
                            {icon}
                        </View>
                        <Text style={[styles.widgetTagText, { color }]}>{title}</Text>
                    </View>
                    <Text style={styles.widgetTime}>Just now</Text>
                </View>
                <Text style={styles.widgetInfo}>{description}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <View style={styles.header}>
                <View style={[styles.avatar, loading && { backgroundColor: '#a855f7' }]}>
                    <BrainCircuit color={Colors.text} size={20} />
                    <View style={styles.onlineDot} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>TimeMaster AI</Text>
                    <Text style={styles.headerStatus}>{loading ? 'Thinking...' : 'Online • Ready to assist'}</Text>
                </View>
            </View>

            <ScrollView 
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={[styles.chatScroll, { paddingBottom: 20 }]} 
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => (
                    msg.isUser ? (
                        <View key={msg.id} style={styles.userBubbleWrapper}>
                            <View style={styles.userBubble}>
                                <Text style={styles.userText}>{msg.text}</Text>
                            </View>
                        </View>
                    ) : (
                        <View key={msg.id} style={styles.aiMessageRow}>
                            <View style={styles.aiAvatarSmall}>
                                <BrainCircuit size={16} color={Colors.text} />
                            </View>
                            <View style={styles.aiContent}>
                                <View style={[styles.aiBubble, msg.isError && styles.errorBubble]}>
                                    <Text style={styles.aiText}>{msg.text}</Text>
                                </View>
                                {msg.action && renderActionWidget(msg.action)}
                            </View>
                        </View>
                    )
                ))}
                {loading && (
                    <View style={styles.aiMessageRow}>
                        <View style={styles.aiAvatarSmall}>
                            <BrainCircuit size={16} color={Colors.text} />
                        </View>
                        <View style={styles.aiContent}>
                            <View style={[styles.aiBubble, { width: 60, alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? 10 : insets.bottom + 55 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                    <TouchableOpacity style={styles.chip} onPress={() => setInput('What are my tasks today?')}><Text style={styles.chipText}>View Schedule</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.chip} onPress={() => setInput('Create a deep work session for 2 hours')}><Text style={styles.chipText}>Plan Focus</Text></TouchableOpacity>
                </ScrollView>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Talk to your AI Mentor..."
                        placeholderTextColor="#6b7280"
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        editable={!loading}
                    />
                    <TouchableOpacity style={styles.micButton}>
                        <Mic size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                        onPress={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        <Send size={18} color={Colors.text} />
                    </TouchableOpacity>
                </View>
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
        padding: 24,
        paddingTop: 48,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    onlineDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: '#000',
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: Colors.matrix.q2,
        fontSize: 12,
    },
    chatScroll: {
        padding: 24,
    },
    userBubbleWrapper: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    userBubble: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        borderRadius: 20,
        borderTopRightRadius: 4,
        maxWidth: '85%',
    },
    userText: {
        color: Colors.text,
        fontSize: 14,
    },
    aiMessageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
    },
    aiAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    aiContent: {
        flex: 1,
    },
    aiBubble: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        marginBottom: 8,
    },
    errorBubble: {
        borderColor: 'rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
    },
    aiText: {
        color: Colors.text,
        fontSize: 14,
        lineHeight: 22,
    },
    interactiveWidget: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 12,
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    widgetTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    widgetTagText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    widgetTime: {
        color: Colors.textDim,
        fontSize: 10,
    },
    widgetInfo: {
        color: Colors.textDim,
        fontSize: 12,
    },
    tagIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    queryIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        opacity: 0.6,
    },
    queryIndicatorText: {
        color: Colors.textDim,
        fontSize: 10,
        fontStyle: 'italic',
    },
    inputContainer: {
        padding: 24,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    chipsScroll: {
        gap: 8,
        marginBottom: 12,
        paddingRight: 16,
    },
    chip: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    chipText: {
        color: Colors.text,
        fontSize: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 24,
        padding: 4,
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: Colors.text,
        fontSize: 14,
    },
    micButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#4b5563',
        opacity: 0.5,
    }
});
