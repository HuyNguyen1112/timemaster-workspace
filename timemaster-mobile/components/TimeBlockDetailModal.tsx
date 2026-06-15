import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Clock, Target, Zap, Trash2, AlertTriangle, Wrench, Play } from 'lucide-react-native';
import { TimeBlock } from '../services/schedule.service';
import { useCustomAlert } from './CustomAlertContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDeleteTask: (taskId: number) => void;
  onEditTask?: (taskId: number) => void;
  timeBlock: TimeBlock | null;
}

export default function TimeBlockDetailModal({ visible, onClose, onDeleteTask, onEditTask, timeBlock }: Props) {
  const { showAlert } = useCustomAlert();
  const router = useRouter();

  if (!timeBlock) return null;

  const handleDelete = () => {
    showAlert({
      title: "Xóa công việc",
      message: "Bạn có chắc chắn muốn xóa công việc này không? Toàn bộ thời gian dự kiến của công việc này sẽ bị xóa khỏi lịch.",
      type: "warning",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: () => onDeleteTask(timeBlock.taskId)
    });
  };

  const blockStart = timeBlock.startTime.includes('T') ? timeBlock.startTime.split('T')[1].substring(0, 5) : timeBlock.startTime.substring(0, 5);
  const blockEnd = timeBlock.endTime.includes('T') ? timeBlock.endTime.split('T')[1].substring(0, 5) : timeBlock.endTime.substring(0, 5);
  
  const totalEstimatedMins = (timeBlock.estimatedDuration || 1) * 60;
  const remainingMins = timeBlock.remainingDuration !== undefined ? timeBlock.remainingDuration : totalEstimatedMins;
  
  const focusedMins = Math.max(0, totalEstimatedMins - remainingMins);
  
  const percent = Math.min(100, Math.round((focusedMins / totalEstimatedMins) * 100));

  const formatMinToHours = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 }}>
              <Zap size={20} color={timeBlock.isOverloaded ? "#ef4444" : "#3b82f6"} />
              <Text style={[styles.title, timeBlock.isOverloaded && { color: '#ef4444' }]} numberOfLines={1}>{timeBlock.taskTitle}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {onEditTask && (
                <TouchableOpacity onPress={() => { onClose(); onEditTask(timeBlock.taskId); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Wrench size={18} color="#f59e0b" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleDelete} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {timeBlock.isOverloaded && (
            <View style={styles.warningBanner}>
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={styles.warningText}>
                Chú ý: Khối lượng công việc còn lại quá lớn so với thời gian rảnh của Context từ nay đến Hạn chót. Bạn có thể sẽ trễ hạn!
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Clock size={16} color="#9ca3af" />
            <Text style={styles.infoText}>
              Block Time: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{blockStart} - {blockEnd}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Target size={16} color="#9ca3af" />
            <Text style={styles.infoText}>
              Context: <Text style={{ color: '#fff' }}>{timeBlock.contextName}</Text>  •  Matrix: <Text style={{ color: '#f59e0b' }}>{timeBlock.matrixType}</Text>
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Task Overall Progress</Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.progressStats}>
              <Text style={styles.statText}>
                Focused: <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMinToHours(focusedMins)}</Text>
              </Text>
              <Text style={styles.statText}>
                Total Est: <Text style={{ color: '#ffffff' }}>{formatMinToHours(totalEstimatedMins)}</Text>
              </Text>
            </View>
            
            {remainingMins > 0 && (
              <Text style={styles.remainingText}>
                {formatMinToHours(remainingMins)} left to complete this task
              </Text>
            )}
            {remainingMins <= 0 && (
              <Text style={[styles.remainingText, { color: '#10b981' }]}>
                Task completed!
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.startFocusBtn} 
            onPress={() => {
              onClose();
              router.push({
                pathname: '/(tabs)/focus',
                params: { taskId: timeBlock.taskId, taskTitle: timeBlock.taskTitle }
              });
            }}
          >
            <Play size={18} color="#8b5cf6" fill="#8b5cf6" />
            <Text style={styles.startFocusBtnText}>Bắt đầu Focus</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20
  },
  content: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 14
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#7f1d1d' + '30',
    borderWidth: 1,
    borderColor: '#ef4444' + '50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
    alignItems: 'center'
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
    lineHeight: 18
  },
  progressContainer: {
    marginTop: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151'
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  progressLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600'
  },
  progressPercent: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#374151',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  statText: {
    color: '#9ca3af',
    fontSize: 13
  },
  remainingText: {
    textAlign: 'center',
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic'
  },
  startFocusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#8b5cf6' + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6' + '40'
  },
  startFocusBtnText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 15
  }
});
