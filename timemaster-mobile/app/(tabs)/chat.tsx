import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BrainCircuit, Mic, Send, Zap, Calendar, CheckCircle2 } from 'lucide-react-native';
import { aiService } from '../../services/ai.service';

export default function AiChatScreen() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<any[]>([
        { id: 1, text: "Hello! I'm your AI Mentor. How can I help you today?", isUser: false }
    ]);

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
                action: response.actionTaken !== 'none' ? response.actionTaken : null
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
        let color = "#8b5cf6";

        if (action.includes('Create')) {
            icon = <Calendar size={14} color="#60a5fa" />;
            title = "Task Created";
            color = "#3b82f6";
        } else if (action.includes('Update') || action.includes('Complete')) {
            icon = <CheckCircle2 size={14} color="#22c55e" />;
            title = "Schedule Updated";
            color = "#22c55e";
        }

        return (
            <View style={[styles.interactiveWidget, { borderColor: color + '40' }]}>
                <View style={styles.widgetHeader}>
                    <View style={styles.widgetTag}>
                        {icon}
                        <Text style={[styles.widgetTagText, { color }]}>{title}</Text>
                    </View>
                    <Text style={styles.widgetTime}>Just now</Text>
                </View>
                <Text style={styles.widgetInfo}>The changes have been synced to your dashboard.</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatar, loading && { backgroundColor: '#a855f7' }]}>
                    <BrainCircuit color="#ffffff" size={20} />
                    <View style={styles.onlineDot} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>TimeMaster AI</Text>
                    <Text style={styles.headerStatus}>{loading ? 'Thinking...' : 'Online • Ready to assist'}</Text>
                </View>
            </View>

            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.chatScroll} 
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
                                <BrainCircuit size={16} color="#ffffff" />
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
                            <BrainCircuit size={16} color="#ffffff" />
                        </View>
                        <View style={styles.aiContent}>
                            <View style={[styles.aiBubble, { width: 60, alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color="#8b5cf6" />
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
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
                        <Send size={18} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#130f1e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#0a0a0a',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#8b5cf6',
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
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#000',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: '#60a5fa',
        fontSize: 12,
    },
    chatScroll: {
        padding: 24,
        paddingBottom: 200,
    },
    userBubbleWrapper: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    userBubble: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 20,
        borderTopRightRadius: 4,
        maxWidth: '85%',
    },
    userText: {
        color: '#f3f4f6',
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
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    aiContent: {
        flex: 1,
    },
    aiBubble: {
        backgroundColor: '#1a1a1e',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.2)',
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
        color: '#e5e7eb',
        fontSize: 14,
        lineHeight: 22,
    },
    interactiveWidget: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
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
        color: '#6b7280',
        fontSize: 10,
    },
    widgetInfo: {
        color: '#9ca3af',
        fontSize: 12,
    },
    inputContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    chipsScroll: {
        gap: 8,
        marginBottom: 12,
        paddingRight: 16,
    },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    chipText: {
        color: '#d1d5db',
        fontSize: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1e',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 4,
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: '#ffffff',
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
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#4b5563',
        opacity: 0.5,
    }
});
