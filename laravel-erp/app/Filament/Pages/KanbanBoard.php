<?php

namespace App\Filament\Pages;

use App\Models\Task;
use App\Models\Project;
use App\Models\TimeEntry;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Auth;

class KanbanBoard extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedViewColumns;
    protected static ?string $navigationLabel = 'Tablero Kanban';
    protected static ?string $title = 'Tablero de Tareas';
    protected static ?string $slug = ''; // Set as root page
    protected string $view = 'filament.pages.kanban-board';

    public $tasksByStatus = [];
    public $projects = [];

    public function mount()
    {
        $this->loadBoard();
    }

    public function loadBoard()
    {
        $allTasks = Task::with(['project', 'users', 'timeEntries'])->where('archived', false)->get();
        
        $this->tasksByStatus = [
            'todo' => $allTasks->where('status', 'todo')->values()->all(),
            'inProgress' => $allTasks->where('status', 'inProgress')->values()->all(),
            'review' => $allTasks->where('status', 'review')->values()->all(),
            'done' => $allTasks->where('status', 'done')->values()->all(),
        ];

        // Ensure we load projects to show alerts/limits
        $this->projects = Project::where('archived', false)->get()->keyBy('id')->toArray();
    }

    public function updateTaskStatus($taskId, $newStatus)
    {
        $task = Task::find($taskId);
        if ($task && in_array($newStatus, ['todo', 'inProgress', 'review', 'done'])) {
            $task->status = $newStatus;
            $task->status_changed_at = now();
            $task->save();
        }
        $this->loadBoard();
    }

    public function saveTimeEntry($taskId, $timeAdded)
    {
        TimeEntry::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            'time_added' => (float) $timeAdded,
        ]);
        
        $this->loadBoard();
    }
}
