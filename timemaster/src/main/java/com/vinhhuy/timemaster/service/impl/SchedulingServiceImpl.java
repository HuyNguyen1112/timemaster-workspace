package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.entity.*;
import com.vinhhuy.timemaster.repository.*;
import com.vinhhuy.timemaster.service.SchedulingService;
import lombok.AllArgsConstructor;
import com.vinhhuy.timemaster.dto.TimeBlockResponse;
import lombok.Data;
import org.apache.commons.math3.optim.MaxIter;
import org.apache.commons.math3.optim.PointValuePair;
import org.apache.commons.math3.optim.linear.*;
import org.apache.commons.math3.optim.nonlinear.scalar.GoalType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import com.vinhhuy.timemaster.mapper.TimeBlockMapper;

@Service
@Transactional
@Slf4j
public class SchedulingServiceImpl implements SchedulingService {

    private final ContextScheduleRepository contextScheduleRepository;
    private final EventRepository eventRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final TaskRepository taskRepository;
    private final ContextRepository contextRepository;
    private final TimeBlockMapper timeBlockMapper;
    private final UserRepository userRepository;

    // Thời gian tối thiểu cho một khối thời gian (mặc định 30 phút)
    @Value("${scheduling.min-block-minutes:30}")
    private int minBlockMinutes;

    public SchedulingServiceImpl(ContextScheduleRepository contextScheduleRepository,
            EventRepository eventRepository,
            TimeBlockRepository timeBlockRepository,
            TaskRepository taskRepository,
            ContextRepository contextRepository,
            TimeBlockMapper timeBlockMapper,
            UserRepository userRepository,
            PlatformTransactionManager transactionManager) {
        this.contextScheduleRepository = contextScheduleRepository;
        this.eventRepository = eventRepository;
        this.timeBlockRepository = timeBlockRepository;
        this.taskRepository = taskRepository;
        this.contextRepository = contextRepository;
        this.timeBlockMapper = timeBlockMapper;
        this.userRepository = userRepository;
    }

    /**
     * Kích hoạt tự động xếp lịch (Auto-Schedule) từ ngày hiện tại đến targetDate.
     * Thuật toán sẽ quét qua tối thiểu 7 ngày và tối đa 14 ngày để rải đều các công
     * việc linh hoạt (Flex Tasks).
     */

    // Ví dụ: tạo một Flex task có context là "Work" và targetDate là "2026-06-22",
    // thời lượng là 2 giờ
    @Override
    public void triggerAutoSchedule(Long userId, Long contextId, LocalDate targetDate) {
        try {
            // 1. Xác định khung thời gian chạy thuật toán (Từ hôm nay đến targetDate)
            LocalDate today = LocalDate.now();

            // Tính số ngày chênh lệch giữa hôm nay và ngày mục tiêu
            // ví dụ: hôm nay là 2022-06-16 và targetDate là 2022-06-22 => days = 6
            long days = ChronoUnit.DAYS.between(today, targetDate);

            // Ép khung thời gian luôn nằm trong khoảng 7 đến 14 ngày
            // ví dụ: nếu days > 14 thì days = 14, nếu days < 7 thì days = 7
            if (days > 14)
                days = 14;
            if (days < 7)
                days = 7;

            // 2. Xác định danh sách Context (Ngữ cảnh) cần quét
            List<Long> contextIdsToSchedule;
            if (contextId != null) {
                // Nếu người dùng chỉ định rõ xếp lịch cho 1 ngữ cảnh (ví dụ: work)
                contextIdsToSchedule = List.of(contextId);
            } else {
                // Nếu không, lấy toàn bộ các ngữ cảnh của người dùng để xếp lịch
                contextIdsToSchedule = contextRepository.findByUserId(userId)
                        .stream().map(Context::getId).toList();
            }

            // 3. Vòng lặp chính: Chạy qua từng ngày một
            LocalDate scheduleDate;
            for (int i = 0; i <= days; i++) {
                scheduleDate = today.plusDays(i);
                // Với mỗi ngày, lại quét qua từng Context để xếp block thời gian
                for (Long cid : contextIdsToSchedule)
                    // ví dụ: đầu vào là userId, ngày 19, cid của work
                    recalculateSchedule(userId, scheduleDate, cid);
            }

            // 4. Sau khi đã xếp xong tất cả các ngày, kiểm tra xem có task nào bị thiếu
            // thời gian không
            checkOverload(userId, today, days);
        } catch (Exception e) {
            log.warn(">>> [AUTO-SCHEDULE] Failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Kiểm tra xem một công việc linh hoạt (Flex Task) có bị "Quá tải" (Overloaded)
     * hay không.
     * Quá tải xảy ra khi tổng thời lượng đã được hệ thống xếp lịch (trong các ngày
     * tới)
     * ÍT HƠN thời lượng còn lại phải làm trước Deadline.
     */
    public void checkOverload(Long userId, LocalDate today, long days) {
        // Xác định ngày cuối cùng của chu kỳ dự phóng
        LocalDate projectionEnd = today.plusDays(days);

        // Lấy danh sách các công việc linh hoạt chưa hoàn thành
        List<Task> flexTasks = taskRepository.findFlexPendingTasksWithDeadlineOnOrAfter(userId, today);

        for (Task task : flexTasks) {
            // Chỉ kiểm tra các task có hạn chót nằm trong chu kỳ đang quét
            if (task.getTargetDate() != null && !task.getTargetDate().isAfter(projectionEnd)) {

                // Tính tổng số phút đã được thuật toán chia block (TimeBlock) trong DB
                Long totalScheduled = timeBlockRepository.sumDurationByTaskIdAndDateRange(
                        task.getId(),
                        today.atStartOfDay(),
                        task.getTargetDate().plusDays(1).atStartOfDay());
                long sum = totalScheduled == null ? 0 : totalScheduled;

                // Nếu tổng số phút xếp được bé hơn số phút cần làm -> Task này bị quá tải
                boolean overloaded = sum < task.getRemainingDuration();

                // Nếu trạng thái thay đổi, cập nhật cờ IsOverloaded vào cơ sở dữ liệu
                if (task.getIsOverloaded() == null || task.getIsOverloaded() != overloaded) {
                    task.setIsOverloaded(overloaded);
                    taskRepository.save(task);
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

    /**
     * Hàm lõi xử lý thuật toán tính toán lại lịch cho một ngày cụ thể.
     */
    // ví dụ: đầu vào là user_id = 1L, ngày 19, cid = 4 (work)
    @Override
    public List<TimeBlock> recalculateSchedule(Long userId, LocalDate scheduleDate, Long contextId) {

        // 2. Truy xuất danh sách các Task linh hoạt có thể làm
        // ví dụ: user_id = 1L, scheduleDate = 2026-06-19
        // ví dụ: lấy ra được 4 tasks
        List<Task> flexTasks = taskRepository.findFlexPendingTasksWithDeadlineOnOrAfter(userId, scheduleDate);

        // 3. Lọc bớt các task không thuộc Context đang xử lý
        // ví dụ: contextId = 4 (work) => chỉ có 3/4 tasks thuộc context work
        List<Task> filteredTasks = flexTasks.stream()
                .filter(t -> contextId == null || (t.getContext() != null && t.getContext().getId().equals(contextId)))
                .collect(Collectors.toList());

        // Lấy danh sách các ngày trong tuần mà Context này được kích hoạt
        // ví dụ: contextId = 4 (work) => scheduledDays = {1, 2, 3, 4, 5} tướng ứng với
        // thứ 2 đến thứ 6
        Set<Integer> scheduledDays = contextId != null
                ? new HashSet<>(contextScheduleRepository.findScheduledDaysOfWeek(contextId))
                : Collections.emptySet();

        List<TaskTarget> taskTargets = new ArrayList<>();

        // 4. Tính toán mức chỉ tiêu phút cần làm (Daily Allocation) cho TỪNG TASK trong
        // ngày đang xét
        for (Task task : filteredTasks) {
            // Lấy thời gian ước tính cần xong công việc của từng task
            int remaining = task.getRemainingDuration();

            // Lấy tổng số phút của task này đã được xếp vào các ngày TRƯỚC ĐÓ
            // ví dụ: đang xét ngày 19 thì các ngày trước đó được tính từ hiện tại cho đến
            // ngày đang xét (16, 17 ,18)
            Long scheduledSoFar = timeBlockRepository.sumDurationByTaskIdAndDateRange(
                    task.getId(),
                    LocalDate.now().atStartOfDay(),
                    scheduleDate.atStartOfDay());
            int scheduledMinutes = scheduledSoFar != null ? scheduledSoFar.intValue() : 0;

            // Tính số phút THỰC TẾ CÒN LẠI cần phân bổ
            // ví dụ: remaining = 300 phút (5 tiếng), scheduledMinutes = 130 phút
            // => effectiveRemaining = 300 - 130 = 170 phút
            int effectiveRemaining = remaining - scheduledMinutes;

            // Tính số phút cần làm riêng trong ngày hôm nay (chia đều cho các ngày active)
            // ví dụ: effectiveRemaining = 170 phút, targetDate = 2026-06-21, scheduledDays
            // = {1, 2, 3, 4, 5}, scheduleDate = 2026-06-19
            int dailyAllocation = calculateDailyAllocation(effectiveRemaining, task.getTargetDate(), scheduledDays,
                    scheduleDate);
            // => dailyAllocation = 85 phút
            // Nếu trong ngày hôm nay task này cần làm > 0 phút, đưa vào danh sách đích
            if (dailyAllocation > 0) {
                taskTargets.add(new TaskTarget(
                        task.getId(), task, dailyAllocation, getPriorityWeight(task.getMatrixType())));
            }
        }

        // 5. Tìm ra các khoảng thời gian trống (Free Slots) thực sự trong ngày
        // Bằng cách lấy lịch trống trừ đi các Event, Task Cố định
        // ví dụ: contextId = 4 (work), scheduleDate = 2026-06-19
        List<FreeSlot> slots = subtractObstacles(userId, contextId, scheduleDate);
        // => slots = { (08:00 -> 10:00), (11:00 -> 12:00), (13:00 -> 14:30), (16:00
        // -> 17:00) }

        // Sắp xếp các task theo mức độ ưu tiên (từ Q1 -> Q4) để thuật toán ưu tiên xử
        // lý trước
        taskTargets.sort((t1, t2) -> Double.compare(t2.getPriorityWeight(), t1.getPriorityWeight()));

        // 6. Chạy thuật toán Simplex để tối ưu hóa việc nhét TaskTargets vào FreeSlots
        return optimizeSchedule(taskTargets, slots);
    }

    /**
     * Tính số phút cần phân bổ cho 1 ngày để đảm bảo hoàn thành Task trước
     * Deadline.
     */
    // ví dụ: effectiveRemaining = 170 phút, targetDate = 2026-06-21, scheduledDays
    // = {1, 2, 3, 4, 5}, scheduleDate = 2026-06-19
    private int calculateDailyAllocation(int effectiveRemaining, LocalDate targetDate,
            Set<Integer> scheduledDays, LocalDate schedulingDate) {
        if (effectiveRemaining <= 0)
            return 0;

        // Nếu việc quá nhỏ (<= 1 tiếng), làm luôn không cần chia đều
        if (effectiveRemaining <= 60)
            return effectiveRemaining;

        // Đếm số ngày hoạt động (Active Days) còn lại của Ngữ cảnh này từ nay tới
        // Deadline
        // d = 2026-06-19, targetDate = 2026-06-21 => 3 ngày (19, 20, 21)
        long activeDays = 0;
        LocalDate d = schedulingDate;
        while (!d.isAfter(targetDate)) {
            if (scheduledDays.contains(d.getDayOfWeek().getValue())) {
                activeDays++;
            }
            d = d.plusDays(1);
        }

        // Nếu quá hạn hoặc không còn ngày active nào nữa → Ép làm hết vào ngày hôm nay
        // ví dụ: 21 là thứ 7 (6) không có context work => activeDays = 2 (19, 20)
        if (activeDays <= 1)
            return effectiveRemaining;

        // Chia đều khối lượng công việc cho số ngày, làm tròn lên
        // ví du: effectiveRemaining = 170 phút, activeDays = 2 => dailyAllocation = 85
        int dailyAllocation = (int) Math.ceil((double) effectiveRemaining / activeDays);

        // Đảm bảo thời gian mỗi lần làm không bị cắt quá nhỏ (>= minBlockMinutes: 30)
        return Math.max(dailyAllocation, minBlockMinutes);
    }

    /**
     * Tìm ra các khung giờ thực sự TRỐNG (FreeSlots) trong ngày.
     */
    // ví dụ: contextId = 4 (work), scheduleDate = 2026-06-19
    @Override
    public List<FreeSlot> subtractObstacles(Long userId, Long contextId, LocalDate scheduledDate) {

        // 1. Lấy khung giờ hoạt động định kỳ của Ngữ cảnh trong ngày hôm đó
        // ví dụ: ngữ cảnh ngày 19
        int dayOfWeek = scheduledDate.getDayOfWeek().getValue();
        // ví dụ: 19 là thứ 6 => dayOfWeek = 5 => schedules = { (08:00 -> 12:00), (13:00
        // -> 17:00) }
        List<ContextSchedule> schedules = contextScheduleRepository.findByContextIdAndDayOfWeek(contextId, dayOfWeek);

        // Nếu đang xếp lịch cho ngày hôm nay, bỏ qua các khung giờ đã trôi qua trong
        // quá khứ
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime scheduleStartLimit = now;
        if (scheduleStartLimit.getMinute() > 0 || scheduleStartLimit.getSecond() > 0
                || scheduleStartLimit.getNano() > 0) {
            scheduleStartLimit = scheduleStartLimit.plusHours(1).truncatedTo(ChronoUnit.HOURS);
        }

        // ví dụ : schedules = { (08:00 -> 12:00), (13:00 -> 17:00) } => baseSlots = {
        // (2026-06-19 08:00 -> 2026-06-19 12:00, 240), (2026-06-19 13:00 -> 2026-06-19
        // 17:00, 240) }
        List<FreeSlot> baseSlots = new ArrayList<>();
        for (ContextSchedule schedule : schedules) {
            LocalDateTime start = LocalDateTime.of(scheduledDate, schedule.getStartTime());
            LocalDateTime end = LocalDateTime.of(scheduledDate, schedule.getEndTime());

            // Chặn khung giờ quá khứ
            if (scheduledDate.isEqual(now.toLocalDate()) && start.isBefore(scheduleStartLimit)) {
                start = scheduleStartLimit;
            }

            if (start.isBefore(end)) {
                int capacity = (int) ChronoUnit.MINUTES.between(start, end);
                baseSlots.add(new FreeSlot(start, end, capacity));
            }
        }

        LocalDateTime dayStart = scheduledDate.atStartOfDay();
        LocalDateTime dayEnd = scheduledDate.plusDays(1).atStartOfDay();

        // 2. Tìm các "Chướng ngại vật" (Obstacles) nằm trong ngày
        // ví dụ: có events lịch họp lúc 10:00 -> 11:00
        List<Event> events = eventRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);
        List<TimeBlock> lockedBlocks = timeBlockRepository.findLockedBlocksByUserIdAndDateRange(userId, dayStart,
                dayEnd);
        // ví dụ: có fixed task giải quyết việc gấp là 13:00 -> 14:30
        List<Task> fixedTasks = taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(userId, scheduledDate);

        List<Obstacle> obstacles = new ArrayList<>();
        // Đưa Sự kiện vào làm chướng ngại vật
        for (Event e : events) {
            obstacles.add(new Obstacle(e.getStartTime(), e.getEndTime()));
        }
        // Đưa các Block đã bị người dùng khóa (Locked) vào
        for (TimeBlock tb : lockedBlocks) {
            obstacles.add(new Obstacle(tb.getStartTime(), tb.getEndTime()));
        }
        // Đưa các Task cố định (Fixed Task) có ấn định giờ rõ ràng vào
        for (Task ft : fixedTasks) {
            LocalDateTime start = LocalDateTime.of(scheduledDate, ft.getStartTime());
            int duration = (int) (ft.getEstimatedDuration() * 60);
            obstacles.add(new Obstacle(start, start.plusMinutes(duration)));
        }

        baseSlots.sort(Comparator.comparing(FreeSlot::getStartTime));

        // 3. Tiến hành "Cắt" các Base Slots bằng các Chướng ngại vật
        List<FreeSlot> pureSlots = new ArrayList<>();
        for (FreeSlot slot : baseSlots) {
            List<FreeSlot> currentFragments = new ArrayList<>();
            // ví dụ: cho 1 slot (08:00 -> 12:00)
            currentFragments.add(slot);
            // ví dụ: có obstacle là 10:00 -> 11:00
            for (Obstacle obs : obstacles) {
                List<FreeSlot> newFragments = new ArrayList<>();
                // ví dụ: obs (10:00 -> 11:00) chèn vào slot (08:00 -> 12:00)
                for (FreeSlot frag : currentFragments) {
                    // Cắt phân mảnh slot nếu bị đè lên
                    // ví dụ:tách thành (08:00 -> 10:00) và (11:00 -> 12:00)
                    newFragments.addAll(splitSlot(frag, obs));
                }
                currentFragments = newFragments;
            }
            // ví dụ: sau khi lặp hết obstacles, pureSlots chia ra thành 4 phần: (08:00 ->
            // 10:00), (11:00 -> 12:00), (13:00 -> 14:30), (16:00 -> 17:00)
            pureSlots.addAll(currentFragments);
        }

        // Lọc bỏ các slot rác (sức chứa <= 0)
        return pureSlots.stream()
                .filter(s -> s.getCapacityInMinutes() > 0)
                .sorted(Comparator.comparing(FreeSlot::getStartTime))
                .collect(Collectors.toList());
    }

    /**
     * Thuật toán cắt một khoảng thời gian (Slot) ra làm các mảnh nhỏ hơn
     * nếu có một chướng ngại vật (Obstacle) đè lên nó.
     */
    private List<FreeSlot> splitSlot(FreeSlot slot, Obstacle obs) {
        List<FreeSlot> result = new ArrayList<>();

        // Trường hợp 1: Chướng ngại vật nằm hoàn toàn bên ngoài Slot -> Giữ nguyên Slot
        if (!obs.getStart().isBefore(slot.getEndTime()) || !obs.getEnd().isAfter(slot.getStartTime())) {
            result.add(slot);
            return result;
        }

        // Trường hợp 2: Chướng ngại vật đâm thủng ở giữa Slot -> Tách Slot làm 2 mảnh
        // (đầu và đuôi)
        if (obs.getStart().isAfter(slot.getStartTime()) && obs.getEnd().isBefore(slot.getEndTime())) {
            int cap1 = (int) ChronoUnit.MINUTES.between(slot.getStartTime(), obs.getStart());
            int cap2 = (int) ChronoUnit.MINUTES.between(obs.getEnd(), slot.getEndTime());
            result.add(new FreeSlot(slot.getStartTime(), obs.getStart(), cap1));
            result.add(new FreeSlot(obs.getEnd(), slot.getEndTime(), cap2));
            return result;
        }

        // Trường hợp 3: Chướng ngại vật đè bẹp phần ĐẦU của Slot -> Giữ lại phần đuôi
        if (!obs.getStart().isAfter(slot.getStartTime()) && obs.getEnd().isBefore(slot.getEndTime())) {
            int cap = (int) ChronoUnit.MINUTES.between(obs.getEnd(), slot.getEndTime());
            result.add(new FreeSlot(obs.getEnd(), slot.getEndTime(), cap));
            return result;
        }

        // Trường hợp 4: Chướng ngại vật đè bẹp phần ĐUÔI của Slot -> Giữ lại phần đầu
        if (obs.getStart().isAfter(slot.getStartTime()) && !obs.getEnd().isBefore(slot.getEndTime())) {
            int cap = (int) ChronoUnit.MINUTES.between(slot.getStartTime(), obs.getStart());
            result.add(new FreeSlot(slot.getStartTime(), obs.getStart(), cap));
            return result;
        }

        // Trường hợp 5: Chướng ngại vật bao trùm toàn bộ Slot -> Xóa sổ Slot hoàn toàn
        return result;
    }

    /**
     * Trái tim của Auto-Scheduler: Hàm Tối ưu hóa bằng Quy hoạch tuyến tính (Linear
     * Programming - Simplex).
     * Mục tiêu: TỐI ĐA HÓA (Maximize) tổng điểm ưu tiên (Priority Weight) của các
     * Task được xếp vào Slot trống.
     */
    @Override
    public List<TimeBlock> optimizeSchedule(List<TaskTarget> tasks, List<FreeSlot> slots) {
        if (tasks.isEmpty() || slots.isEmpty())
            return new ArrayList<>();

        int N = tasks.size();
        int M = slots.size();
        int numVariables = N * M;

        // Định nghĩa các Biến: x_{i,j} (Số phút phân bổ cho Task i vào Slot j)
        // Hàm Mục tiêu (Objective): Maximize Sum(priorityWeight_i * x_{i,j})
        // Giải thích: Task có mức độ ưu tiên càng cao (như Q1), hệ số càng lớn, thuật
        // toán sẽ cố gắng nhét x_{i,j} càng nhiều càng tốt.
        double[] objectiveCoefficients = new double[numVariables];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                objectiveCoefficients[i * M + j] = tasks.get(i).getPriorityWeight();
            }
        }
        LinearObjectiveFunction objective = new LinearObjectiveFunction(objectiveCoefficients, 0);

        List<LinearConstraint> constraints = new ArrayList<>();

        // Ràng buộc 1: Tổng số phút của một Task i nằm trong tất cả các Slot j
        // KHÔNG ĐƯỢC VƯỢT QUÁ chỉ tiêu ngày (Daily Allocation) của Task đó.
        for (int i = 0; i < N; i++) {
            double[] coeff = new double[numVariables];
            for (int j = 0; j < M; j++) {
                coeff[i * M + j] = 1;
            }
            constraints.add(new LinearConstraint(coeff, Relationship.LEQ, tasks.get(i).getDailyAllocation()));
        }

        // Ràng buộc 2: Tổng số phút của tất cả các Task i nhét vào một Slot j
        // KHÔNG ĐƯỢC VƯỢT QUÁ sức chứa (Capacity) tối đa của Slot đó.
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
            // Chạy thuật toán Simplex với điều kiện các biến phải Không Âm
            // (NonNegativeConstraint)
            solution = solver.optimize(
                    new MaxIter(1000),
                    objective,
                    new LinearConstraintSet(constraints),
                    GoalType.MAXIMIZE,
                    new NonNegativeConstraint(true));
        } catch (Exception e) {
            System.err.println("Simplex optimization failed: " + e.getMessage());
            return new ArrayList<>();
        }

        double[] values = solution.getPoint();

        // Xóa các TimeBlock cũ chưa khóa (Unlocked) của các Task này trong ngày
        // Để nhường chỗ rải lại TimeBlock mới
        List<Long> taskIds = tasks.stream().map(TaskTarget::getTaskId).collect(Collectors.toList());
        if (!taskIds.isEmpty()) {
            LocalDateTime dayStart = slots.get(0).getStartTime().toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            timeBlockRepository.deleteByTaskIdsAndDate(taskIds, dayStart, dayEnd);
        }

        List<TimeBlock> rawBlocks = new ArrayList<>();

        LocalDateTime[] currentSlotStarts = new LocalDateTime[M];
        for (int j = 0; j < M; j++) {
            currentSlotStarts[j] = slots.get(j).getStartTime();
        }

        // Đọc kết quả từ thuật toán để sinh ra các Object TimeBlock thô
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                double allocatedMinutes = values[i * M + j];
                // Nếu thuật toán quyết định nhét Task i vào Slot j > 0 phút
                if (allocatedMinutes > 0) {
                    int minutes = (int) Math.round(allocatedMinutes);
                    LocalDateTime blockStart = currentSlotStarts[j];
                    LocalDateTime blockEnd = blockStart.plusMinutes(minutes);

                    TimeBlock tb = new TimeBlock();
                    tb.setTask(tasks.get(i).getTask());
                    tb.setStartTime(blockStart);
                    tb.setEndTime(blockEnd);
                    rawBlocks.add(tb);

                    // Đẩy con trỏ thời gian của Slot j lên cho Task tiếp theo chèn vào
                    currentSlotStarts[j] = blockEnd;
                }
            }
        }

        // Chạy qua bước hậu kỳ: Lọc các block quá nhỏ, gộp chúng lại với nhau
        List<TimeBlock> finalBlocks = postProcessBlocks(rawBlocks);

        // Lưu thành quả xuống Database
        return timeBlockRepository.saveAllAndFlush(finalBlocks);
    }

    /**
     * Post-processing: loại bỏ block quá nhỏ (< minBlockMinutes).
     * Dồn thời gian vào block cùng task gần nhất.
     */
    private List<TimeBlock> postProcessBlocks(List<TimeBlock> blocks) {
        // Nhóm các block lại theo từng Task ID
        Map<Long, List<TimeBlock>> blocksByTask = blocks.stream()
                .collect(Collectors.groupingBy(tb -> tb.getTask().getId()));

        List<TimeBlock> result = new ArrayList<>();

        for (Map.Entry<Long, List<TimeBlock>> entry : blocksByTask.entrySet()) {
            List<TimeBlock> taskBlocks = entry.getValue();

            for (TimeBlock tb : taskBlocks) {
                int duration = (int) ChronoUnit.MINUTES.between(tb.getStartTime(), tb.getEndTime());

                // Quy tắc: Chỉ giữ lại block nếu độ dài của nó Lớn Hơn Mức Tối Thiểu (vd 30
                // phút)
                // HOẶC bản thân Task đó chỉ còn nợ lại số thời gian siêu nhỏ (không thể làm lớn
                // hơn được)
                if (duration >= minBlockMinutes || tb.getTask().getRemainingDuration() <= minBlockMinutes) {
                    result.add(tb);
                }
            }
        }

        // Sắp xếp lại lịch trình theo thứ tự thời gian tăng dần từ sáng đến tối
        result.sort(Comparator.comparing(TimeBlock::getStartTime));
        return result;
    }

    /**
     * Ánh xạ (Map) từ mức độ khẩn cấp Eisenhower (Q1-Q4) sang hệ số điểm số (Trọng
     * số).
     * Q1 (Khẩn cấp - Quan trọng) có trọng số cao nhất (4.0).
     */
    @Override
    public double getPriorityWeight(Task.MatrixType type) {
        if (type == null)
            return 1.0;
        return switch (type) {
            case Q1 -> 4.0;
            case Q2 -> 3.0;
            case Q3 -> 2.0;
            case Q4 -> 1.0;
        };
    }

    /**
     * Truy xuất toàn bộ lịch trình đã được xếp (TimeBlock) trong một ngày cụ thể.
     */
    @Override
    public List<TimeBlockResponse> getScheduleForDate(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<TimeBlock> blocks = timeBlockRepository.findByUserIdAndDateRange(userId, dayStart, dayEnd);
        return blocks.stream().map(timeBlockMapper::toResponse).collect(Collectors.toList());
    }

    /**
     * Ép hệ thống tính toán lại (recalculate) ngay lập tức rồi trả về kết quả mới
     * nhất.
     */
    @Override
    public List<TimeBlockResponse> recalculateAndGetSchedule(Long userId, LocalDate date, Long contextId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        recalculateSchedule(userId, date, contextId);
        return getScheduleForDate(userId, date);
    }
}
