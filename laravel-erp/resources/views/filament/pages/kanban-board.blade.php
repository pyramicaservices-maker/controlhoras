<x-filament-panels::page>
    <div class="board-container h-full w-full overflow-hidden" x-data="kanbanBoard()">
        <div class="kanban-board h-full w-full">
            @php
                $statuses = [
                    'todo' => 'Por hacer',
                    'inProgress' => 'En progreso',
                    'review' => 'En revisión',
                    'done' => 'Hecho',
                ];
            @endphp
            
            @foreach($statuses as $statusKey => $statusLabel)
                <div class="kanban-column" 
                     @dragover.prevent
                     @drop="drop($event, '{{ $statusKey }}')"
                     data-status="{{ $statusKey }}">
                    <h3>{{ $statusLabel }}</h3>
                    <div class="task-list">
                        @foreach($tasksByStatus[$statusKey] ?? [] as $task)
                            <div class="task-card glass-panel"
                                 draggable="true"
                                 @dragstart="dragStart($event, '{{ $task->id }}', '{{ $statusKey }}')">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs px-2 py-1 rounded {{ $task->priority == 'Alta' ? 'bg-red-900/50 text-red-200' : ($task->priority == 'Media' ? 'bg-amber-900/50 text-amber-200' : 'bg-green-900/50 text-green-200') }}">
                                        {{ $task->priority }}
                                    </span>
                                    <span class="text-xs text-gray-400">{{ $task->project?->name }}</span>
                                </div>
                                <p class="font-medium text-white mb-2">{{ $task->content }}</p>
                                
                                @if(is_array($task->tags) && count($task->tags) > 0)
                                    <div class="flex gap-1 flex-wrap mb-2">
                                        @foreach($task->tags as $tag)
                                            <span class="text-[10px] px-2 py-0.5 rounded-full" style="background-color: {{ $tag['color'] ?? '#333' }}80; border: 1px solid {{ $tag['color'] ?? '#333' }};">
                                                {{ $tag['name'] ?? '' }}
                                            </span>
                                        @endforeach
                                    </div>
                                @endif
                                
                                @php
                                    $timeSpent = $task->timeEntries->sum('time_added') / 3600; // in hours
                                    $progress = $task->estimated_time > 0 ? min(100, ($timeSpent / $task->estimated_time) * 100) : 0;
                                    $progressColor = $progress < 50 ? 'progress-green' : ($progress < 80 ? 'progress-orange' : 'progress-red');
                                @endphp
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill {{ $progressColor }}" style="width: {{ $progress }}%"></div>
                                </div>
                                <div class="text-xs text-right mt-1 mb-2 text-gray-400">
                                    {{ number_format($timeSpent, 1) }}h / {{ $task->estimated_time ?? 0 }}h
                                </div>

                                <div x-data="taskTimer('{{ $task->id }}')" class="flex justify-between items-center mt-3 pt-3 border-t border-gray-700/50">
                                    <div class="flex -space-x-2">
                                        @foreach($task->users as $user)
                                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border border-gray-700" style="background-color: {{ $user->color ?? '#333' }}" title="{{ $user->name }}">
                                                {{ substr($user->name, 0, 1) }}
                                            </div>
                                        @endforeach
                                    </div>
                                    
                                    <div class="flex items-center gap-2">
                                        <template x-if="isRunning">
                                            <div class="active-timer">
                                                <div class="pulse"></div>
                                                <span x-text="formatTime(elapsedTime)"></span>
                                            </div>
                                        </template>
                                        
                                        <button type="button" x-show="!isRunning" @click="startTimer" class="task-play-btn flex items-center justify-center">
                                            <x-heroicon-s-play class="w-4 h-4" />
                                        </button>
                                        <button type="button" x-show="isRunning" @click="stopTimer" class="task-stop-btn flex items-center justify-center">
                                            <x-heroicon-s-stop class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('kanbanBoard', () => ({
                draggedTaskId: null,
                sourceStatus: null,

                dragStart(event, taskId, status) {
                    this.draggedTaskId = taskId;
                    this.sourceStatus = status;
                    event.dataTransfer.effectAllowed = 'move';
                },
                
                drop(event, targetStatus) {
                    if (this.sourceStatus !== targetStatus && this.draggedTaskId) {
                        @this.call('updateTaskStatus', this.draggedTaskId, targetStatus);
                    }
                    this.draggedTaskId = null;
                    this.sourceStatus = null;
                }
            }));

            Alpine.data('taskTimer', (taskId) => ({
                taskId: taskId,
                isRunning: false,
                startTime: 0,
                elapsedTime: 0,
                timerInterval: null,

                startTimer() {
                    this.isRunning = true;
                    this.startTime = Date.now();
                    this.timerInterval = setInterval(() => {
                        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
                    }, 1000);
                },

                stopTimer() {
                    this.isRunning = false;
                    clearInterval(this.timerInterval);
                    @this.call('saveTimeEntry', this.taskId, this.elapsedTime);
                    this.elapsedTime = 0;
                },

                formatTime(seconds) {
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor((seconds % 3600) / 60);
                    const s = seconds % 60;
                    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
            }));
        });
    </script>
</x-filament-panels::page>
