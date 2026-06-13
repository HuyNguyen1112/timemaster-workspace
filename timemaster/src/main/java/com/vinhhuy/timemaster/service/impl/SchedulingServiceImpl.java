package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.entity.*;
import com.vinhhuy.timemaster.repository.*;
import com.vinhhuy.timemaster.service.SchedulingService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.math3.optim.MaxIter;
import org.apache.commons.math3.optim.PointValuePair;
import org.apache.commons.math3.optim.linear.*;
import org.apache.commons.math3.optim.nonlinear.scalar.GoalType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class SchedulingServiceImpl implements SchedulingService {

    private final ContextScheduleRepository contextScheduleRepository;
    private final EventRepository eventRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final TaskRepository taskRepository;
    private final ContextRepository contextRepository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Value("${scheduling.min-block-minutes:30}")
    private int minBlockMinutes;

    public SchedulingServiceImpl(ContextScheduleRepository contextScheduleRepository,
                                  EventRepository eventRepository,
                                  TimeBlockRepository timeBlockRepository,
                                  TaskRepository taskRepository,
                                  ContextRepository contextRepository,
                                  org.springframework.transaction.PlatformTransactionManager transactionManager) {
        this.contextScheduleRepository = contextScheduleRepository;
        this.eventRepository = eventRepository;
        this.timeBlockRepository = timeBlockRepository;
        this.taskRepository = taskRepository;
        this.contextRepository = contextRepository;
        this.transactionTemplate = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    }

    @Override
    public void triggerAutoSchedule(Long userId, Long contextId, LocalDate targetDate) {
        org.springframework.transaction.support.TransactionSynchronizationManager
            .registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try {
                            LocalDate today = LocalDate.now();
                            LocalDate end = targetDate != null && targetDate.isAfter(today) ? targetDate : today;
                            
                            // Dự phóng tối đa 14 ngày
                            long days = java.time.temporal.ChronoUnit.DAYS.between(today, end);
                            if (days > 14) days = 14;
                            if (days < 7) days = 7;
                            
                            log.info(">>> [AUTO-SCHEDULE] Starting for userId={}, contextId={}, days={}", userId, contextId, days);
                            
                            List<Long> contextIdsToSchedule;
                            if (contextId != null) {
                                contextIdsToSchedule = List.of(contextId);
                            } else {
                                // Cần transaction để đọc DB
                                contextIdsToSchedule = transactionTemplate.execute(status ->
                                    contextRepository.findByUserId(userId)
                                        .stream().map(Context::getId).collect(Collectors.toList())
                                );
                            }

                            final long finalDays = days;
                            for (int i = 0; i <= finalDays; i++) {
                                final LocalDate date = today.plusDays(i);
                                for (Long cid : contextIdsToSchedule) {
                                    // Mỗi ngày/context chạy trong 1 transaction riêng
                                    final Long finalCid = cid;
                                    List<TimeBlock> blocks = transactionTemplate.execute(status ->
                                        recalculateSchedule(userId, date, finalCid)
                                    );
                                    log.info(">>> [AUTO-SCHEDULE] Date={}, contextId={}, blocks={}", date, cid, blocks == null ? 0 : blocks.size());
                                }
                            }
                            
                            // Check Overloaded — cũng cần transaction
                            final int finalDaysInt = (int) days;
                            transactionTemplate.execute(status -> {
                                updateOverloadedStatus(userId, today, finalDaysInt);
                                return null;
                            });

                            log.info(">>> [AUTO-SCHEDULE] Completed successfully");
                        } catch (Exception e) {
                            log.warn(">>> [AUTO-SCHEDULE] Failed: {}", e.getMessage(), e);
                        }
                    });
                }
            });
    }

    public void updateOverloadedStatus(Long userId, LocalDate today, int days) {
        LocalDate projectionEnd = today.plusDays(days);
        List<Task> flexTasks = taskRepository.findFlexPendingTasksWithDeadlineOnOrAfter(userId, today);
        for (Task task : flexTasks) {
            if (task.getTargetDate() != null && !task.getTargetDate().isAfter(projectionEnd)) {
                Long totalScheduled = timeBlockRepository.sumDurationByTaskIdAndDateRange(
                        task.getId(),
                        today.atStartOfDay(),
                        task.getTargetDate().plusDays(1).atStartOfDay()
                );
                long sum = totalScheduled == null ? 0 : totalScheduled;
                boolean overloaded = sum < task.getRemainingDuration();
                
                if (task.getIsOverloaded() == null || task.getIsOverloaded() != overloaded) {
                    task.setIsOverloaded(overloaded);
                    taskRepository.save(task);
                    log.info(">>> [AUTO-SCHEDULE] Task ID={} Overloaded Status changed to: {}", task.getId(), overloaded);
                }
            }
        }
    }

    @Data
    @AllArgsConstructor
    private static class Obstacle {
        private LocalDateTime start;
        private LocalDateTime end;
    }

    @Override
    public List<TimeBlock> recalculateSchedule(Long userId, LocalDate date, Long contextId) {
        // 1. Lấy tất cả flex task chưa xong có deadline >= ngày đang schedule
        List<Task> flexTasks = taskRepository.findFlexPendingTasksWithDeadlineOnOrAfter(userId, date);

        // Filter theo context nếu có
        List<Task> filteredTasks = flexTasks.stream()
            .filter(t -> contextId == null || (t.getContext() != null && t.getContext().getId().equals(contextId)))
            .collect(Collectors.toList());

        // 2. Lấy danh sách ngày trong tuần mà context có schedule (VD: [1,2,3,4,5] cho T2-T6)
        Set<Integer> scheduledDays = contextId != null
            ? new HashSet<>(contextScheduleRepository.findScheduledDaysOfWeek(contextId))
            : Collections.emptySet();

        // 3. Tính dailyAllocation cho mỗi task
        List<TaskTarget> taskTargets = new ArrayList<>();
        for (Task task : filteredTasks) {
            int remaining = task.getRemainingDuration() != null ? task.getRemainingDuration() : 60;
            int dailyAllocation = calculateDailyAllocation(remaining, date, task.getTargetDate(), scheduledDays);

            if (dailyAllocation > 0) {
                taskTargets.add(new TaskTarget(
                    task.getId(), task, dailyAllocation, getPriorityWeight(task.getMatrixType())
                ));
            }
        }

        // 4. Lấy free slots cho ngày `date`
        List<FreeSlot> slots = subtractObstacles(userId, contextId, date);

        // 5. Chạy Simplex để xếp daily allocations vào free slots
        return optimizeSchedule(taskTargets, slots);
    }

    /**
     * Tính số phút cần phân bổ cho 1 ngày.
     * Chỉ đếm các ngày mà context CÓ schedule (bỏ qua T7/CN nếu context không hoạt động).
     */
    private int calculateDailyAllocation(int remainingMinutes, LocalDate scheduleDate, LocalDate targetDate, Set<Integer> scheduledDays) {
        if (remainingMinutes <= 0) return 0;

        // Task nhỏ, không chia
        if (remainingMinutes <= 60) return remainingMinutes;

        // Đếm số ngày THỰC SỰ CÓ SCHEDULE từ hôm nay đến trước deadline
        LocalDate today = LocalDate.now();
        long activeDays = 0;
        LocalDate d = today;
        while (d.isBefore(targetDate)) {
            if (scheduledDays.isEmpty() || scheduledDays.contains(d.getDayOfWeek().getValue())) {
                activeDays++;
            }
            d = d.plusDays(1);
        }

        // Quá hạn hoặc không còn ngày active nào → làm hết
        if (activeDays <= 0) return remainingMinutes;

        // Chia đều, làm tròn lên để đảm bảo xong trước deadline
        int dailyAllocation = (int) Math.ceil((double) remainingMinutes / activeDays);

        // Đảm bảo >= min block
        return Math.max(dailyAllocation, minBlockMinutes);
    }

    @Override
    public List<FreeSlot> subtractObstacles(Long userId, Long contextId, LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        List<ContextSchedule> schedules = contextScheduleRepository.findByContextIdAndDayOfWeek(contextId, dayOfWeek);
        
        List<FreeSlot> baseSlots = new ArrayList<>();
        for (ContextSchedule schedule : schedules) {
            LocalDateTime start = LocalDateTime.of(date, schedule.getStartTime());
            LocalDateTime end = LocalDateTime.of(date, schedule.getEndTime());
            if (end.isBefore(start) || end.isEqual(start)) {
                end = end.plusDays(1);
            }
            int capacity = (int) ChronoUnit.MINUTES.between(start, end);
            baseSlots.add(new FreeSlot(start, end, capacity));
        }
        
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        
        List<Event> events = eventRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);
        List<TimeBlock> lockedBlocks = timeBlockRepository.findLockedBlocksByUserIdAndDateRange(userId, dayStart, dayEnd);
        List<com.vinhhuy.timemaster.entity.Task> fixedTasks = taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(userId, date);
        
        List<Obstacle> obstacles = new ArrayList<>();
        for (Event e : events) {
            obstacles.add(new Obstacle(e.getStartTime(), e.getEndTime()));
        }
        for (TimeBlock tb : lockedBlocks) {
            obstacles.add(new Obstacle(tb.getStartTime(), tb.getEndTime()));
        }
        for (com.vinhhuy.timemaster.entity.Task ft : fixedTasks) {
            LocalDateTime start = LocalDateTime.of(date, ft.getStartTime());
            int duration = ft.getEstimatedDuration() != null ? (int) (ft.getEstimatedDuration() * 60) : 60;
            obstacles.add(new Obstacle(start, start.plusMinutes(duration)));
        }
        
        // Sort base slots
        baseSlots.sort(Comparator.comparing(FreeSlot::getStartTime));
        
        // Subtract obstacles
        List<FreeSlot> pureSlots = new ArrayList<>();
        for (FreeSlot slot : baseSlots) {
            List<FreeSlot> currentFragments = new ArrayList<>();
            currentFragments.add(slot);
            
            for (Obstacle obs : obstacles) {
                List<FreeSlot> newFragments = new ArrayList<>();
                for (FreeSlot frag : currentFragments) {
                    newFragments.addAll(splitSlot(frag, obs));
                }
                currentFragments = newFragments;
            }
            pureSlots.addAll(currentFragments);
        }
        
        return pureSlots.stream()
                .filter(s -> s.getCapacityInMinutes() > 0)
                .sorted(Comparator.comparing(FreeSlot::getStartTime))
                .collect(Collectors.toList());
    }
    
    private List<FreeSlot> splitSlot(FreeSlot slot, Obstacle obs) {
        List<FreeSlot> result = new ArrayList<>();
        
        // If obstacle is outside slot completely
        if (!obs.getStart().isBefore(slot.getEndTime()) || !obs.getEnd().isAfter(slot.getStartTime())) {
            result.add(slot);
            return result;
        }
        
        // If obstacle is completely inside slot
        if (obs.getStart().isAfter(slot.getStartTime()) && obs.getEnd().isBefore(slot.getEndTime())) {
            int cap1 = (int) ChronoUnit.MINUTES.between(slot.getStartTime(), obs.getStart());
            int cap2 = (int) ChronoUnit.MINUTES.between(obs.getEnd(), slot.getEndTime());
            result.add(new FreeSlot(slot.getStartTime(), obs.getStart(), cap1));
            result.add(new FreeSlot(obs.getEnd(), slot.getEndTime(), cap2));
            return result;
        }
        
        // Obstacle overlaps start
        if (!obs.getStart().isAfter(slot.getStartTime()) && obs.getEnd().isBefore(slot.getEndTime())) {
            int cap = (int) ChronoUnit.MINUTES.between(obs.getEnd(), slot.getEndTime());
            result.add(new FreeSlot(obs.getEnd(), slot.getEndTime(), cap));
            return result;
        }
        
        // Obstacle overlaps end
        if (obs.getStart().isAfter(slot.getStartTime()) && !obs.getEnd().isBefore(slot.getEndTime())) {
            int cap = (int) ChronoUnit.MINUTES.between(slot.getStartTime(), obs.getStart());
            result.add(new FreeSlot(slot.getStartTime(), obs.getStart(), cap));
            return result;
        }
        
        // Obstacle completely covers slot
        return result;
    }

    @Override
    public List<TimeBlock> optimizeSchedule(List<TaskTarget> tasks, List<FreeSlot> slots) {
        if (tasks.isEmpty() || slots.isEmpty()) return new ArrayList<>();

        int N = tasks.size();
        int M = slots.size();
        int numVariables = N * M;

        // Variables: x_{i,j}
        // objective: Maximize Sum(priorityWeight_i * x_{i,j})
        double[] objectiveCoefficients = new double[numVariables];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                objectiveCoefficients[i * M + j] = tasks.get(i).getPriorityWeight();
            }
        }
        LinearObjectiveFunction objective = new LinearObjectiveFunction(objectiveCoefficients, 0);

        List<LinearConstraint> constraints = new ArrayList<>();

        // Constraint 1: For each task i, Sum(x_{i,j}) <= dailyAllocation_i
        for (int i = 0; i < N; i++) {
            double[] coeff = new double[numVariables];
            for (int j = 0; j < M; j++) {
                coeff[i * M + j] = 1;
            }
            constraints.add(new LinearConstraint(coeff, Relationship.LEQ, tasks.get(i).getRemainingDuration()));
        }

        // Constraint 2: For each slot j, Sum(x_{i,j}) <= capacityInMinutes_j
        for (int j = 0; j < M; j++) {
            double[] coeff = new double[numVariables];
            for (int i = 0; i < N; i++) {
                coeff[i * M + j] = 1;
            }
            constraints.add(new LinearConstraint(coeff, Relationship.LEQ, slots.get(j).getCapacityInMinutes()));
        }

        SimplexSolver solver = new SimplexSolver();
        PointValuePair solution;
        try {
            solution = solver.optimize(
                    new MaxIter(1000),
                    objective,
                    new LinearConstraintSet(constraints),
                    GoalType.MAXIMIZE,
                    new NonNegativeConstraint(true)
            );
        } catch (Exception e) {
            System.err.println("Simplex optimization failed: " + e.getMessage());
            return new ArrayList<>();
        }

        double[] values = solution.getPoint();
        
        // Xóa TimeBlock cũ của các task đang schedule cho ngày hiện tại (không xóa các ngày khác)
        List<Long> taskIds = tasks.stream().map(TaskTarget::getTaskId).collect(Collectors.toList());
        if (!taskIds.isEmpty()) {
            LocalDateTime dayStart = slots.get(0).getStartTime().toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            timeBlockRepository.deleteByTaskIdsAndDate(taskIds, dayStart, dayEnd);
        }

        // Tạo TimeBlock từ kết quả Simplex
        List<TimeBlock> rawBlocks = new ArrayList<>();
        
        LocalDateTime[] currentSlotStarts = new LocalDateTime[M];
        for (int j = 0; j < M; j++) {
            currentSlotStarts[j] = slots.get(j).getStartTime();
        }

        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                double allocatedMinutes = values[i * M + j];
                if (allocatedMinutes > 0.5) {
                    int minutes = (int) Math.round(allocatedMinutes);
                    LocalDateTime blockStart = currentSlotStarts[j];
                    LocalDateTime blockEnd = blockStart.plusMinutes(minutes);
                    
                    TimeBlock tb = new TimeBlock();
                    tb.setTask(tasks.get(i).getTask());
                    tb.setStartTime(blockStart);
                    tb.setEndTime(blockEnd);
                    rawBlocks.add(tb);
                    
                    currentSlotStarts[j] = blockEnd;
                }
            }
        }

        // Post-processing: lọc block < minBlockMinutes, gộp vào block lân cận cùng task
        List<TimeBlock> finalBlocks = postProcessBlocks(rawBlocks);

        return timeBlockRepository.saveAll(finalBlocks);
    }

    /**
     * Post-processing: loại bỏ block quá nhỏ (< minBlockMinutes).
     * Dồn thời gian vào block cùng task gần nhất.
     */
    private List<TimeBlock> postProcessBlocks(List<TimeBlock> blocks) {
        // Nhóm block theo task
        Map<Long, List<TimeBlock>> blocksByTask = blocks.stream()
                .collect(Collectors.groupingBy(tb -> tb.getTask().getId()));

        List<TimeBlock> result = new ArrayList<>();

        for (Map.Entry<Long, List<TimeBlock>> entry : blocksByTask.entrySet()) {
            List<TimeBlock> taskBlocks = entry.getValue();

            // Tách block đủ lớn và block quá nhỏ
            List<TimeBlock> validBlocks = new ArrayList<>();
            int surplusMinutes = 0;

            for (TimeBlock tb : taskBlocks) {
                int duration = (int) ChronoUnit.MINUTES.between(tb.getStartTime(), tb.getEndTime());
                if (duration >= minBlockMinutes) {
                    validBlocks.add(tb);
                } else {
                    surplusMinutes += duration; // Dồn thời gian lại
                }
            }

            // Gộp surplus vào block cuối cùng (gần deadline nhất)
            if (surplusMinutes > 0 && !validBlocks.isEmpty()) {
                TimeBlock lastBlock = validBlocks.get(validBlocks.size() - 1);
                lastBlock.setEndTime(lastBlock.getEndTime().plusMinutes(surplusMinutes));
            } else if (surplusMinutes > 0 && validBlocks.isEmpty()) {
                // Tất cả block đều nhỏ → gộp thành 1 block duy nhất nếu tổng >= minBlock
                if (surplusMinutes >= minBlockMinutes && !taskBlocks.isEmpty()) {
                    TimeBlock first = taskBlocks.get(0);
                    first.setEndTime(first.getStartTime().plusMinutes(surplusMinutes));
                    validBlocks.add(first);
                }
                // Nếu tổng vẫn < minBlock → bỏ qua (không tạo block)
            }

            result.addAll(validBlocks);
        }

        // Sắp xếp theo thời gian
        result.sort(Comparator.comparing(TimeBlock::getStartTime));
        return result;
    }

    @Override
    public double getPriorityWeight(Task.MatrixType type) {
        if (type == null) return 1.0;
        return switch (type) {
            case Q1 -> 4.0;
            case Q2 -> 3.0;
            case Q3 -> 2.0;
            case Q4 -> 1.0;
        };
    }
}
