<?php

namespace App\Filament\Pages;

use App\Models\Project;
use App\Models\User;
use App\Models\TimeEntry;
use App\Models\Task;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use BackedEnum;
use Illuminate\Support\Facades\Auth;

class TimeReport extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentChartBar;
    protected static ?string $navigationLabel = 'Reporte de Horas';
    protected static ?string $title = 'Reporte de Tiempo Global';
    protected string $view = 'filament.pages.time-report';

    public $reportMode = 'project'; // 'project' or 'worker'
    public $selectedProjectId = '';
    public $selectedWorkerId = '';
    public $timeFilter = 'month'; // 'week', 'month', 'year', 'all'

    public $projects = [];
    public $users = [];

    public function mount()
    {
        // Admin validation
        if (Auth::user()?->role !== 'admin') {
            abort(403);
        }

        $this->projects = Project::orderBy('name')->get()->toArray();
        $this->users = User::orderBy('name')->get()->toArray();
        
        // Auto-select first project if available
        if (!empty($this->projects)) {
            $this->selectedProjectId = $this->projects[0]['id'];
        }
    }

    public function getReportData()
    {
        $data = [
            'pieData' => [],
            'tableData' => [],
            'totalSeconds' => 0,
        ];

        if ($this->reportMode === 'project') {
            if (empty($this->selectedProjectId)) {
                return $data;
            }

            // Get task time entries
            $query = TimeEntry::whereHas('task', function ($q) {
                $q->where('project_id', $this->selectedProjectId);
            });

            if (!empty($this->selectedWorkerId)) {
                $query->where('user_id', $this->selectedWorkerId);
            }

            $entries = $query->with('user')->get();
            $data['totalSeconds'] = $entries->sum('time_added');

            // Pie data: group by user name
            $userTimes = [];
            foreach ($entries as $entry) {
                $userName = $entry->user?->name ?? 'Desconocido';
                if (!isset($userTimes[$userName])) {
                    $userTimes[$userName] = 0;
                }
                $userTimes[$userName] += $entry->time_added;
            }

            foreach ($userTimes as $name => $seconds) {
                $data['pieData'][] = [
                    'name' => $name,
                    'value' => round($seconds / 3600, 2),
                ];
            }

            // Table data: tasks breakdown
            $tasksQuery = Task::where('project_id', $this->selectedProjectId)
                ->where('archived', false)
                ->with(['users', 'timeEntries']);
                
            if (!empty($this->selectedWorkerId)) {
                $tasksQuery->whereHas('users', function ($q) {
                    $q->where('users.id', $this->selectedWorkerId);
                });
            }
            
            $tasks = $tasksQuery->get();
            foreach ($tasks as $task) {
                $taskEntries = $task->timeEntries;
                if (!empty($this->selectedWorkerId)) {
                    $taskEntries = $taskEntries->where('user_id', $this->selectedWorkerId);
                }
                $taskTime = $taskEntries->sum('time_added');

                $data['tableData'][] = [
                    'content' => $task->content,
                    'assignees' => $task->users->pluck('name')->all(),
                    'status' => $task->status === 'done' ? 'Terminada' : ($task->status === 'inProgress' ? 'En Progreso' : 'Por Hacer'),
                    'timeSpent' => $taskTime,
                ];
            }
        } else {
            // Worker report mode
            if (empty($this->selectedWorkerId)) {
                return $data;
            }

            // Get worker entries
            $query = TimeEntry::where('user_id', $this->selectedWorkerId);

            // Filter timeframe
            if ($this->timeFilter === 'week') {
                $query->where('created_at', '>=', now()->startOfWeek());
            } elseif ($this->timeFilter === 'month') {
                $query->where('created_at', '>=', now()->startOfMonth());
            } elseif ($this->timeFilter === 'year') {
                $query->where('created_at', '>=', now()->startOfYear());
            }

            // Optional project filter
            if (!empty($this->selectedProjectId)) {
                $query->whereHas('task', function ($q) {
                    $q->where('project_id', $this->selectedProjectId);
                });
            }

            $entries = $query->with('task.project')->get();
            $data['totalSeconds'] = $entries->sum('time_added');

            // Pie data: group by project name
            $projectTimes = [];
            foreach ($entries as $entry) {
                $projectName = $entry->task?->project?->name ?? 'Desconocido';
                if (!isset($projectTimes[$projectName])) {
                    $projectTimes[$projectName] = 0;
                }
                $projectTimes[$projectName] += $entry->time_added;
            }

            foreach ($projectTimes as $name => $seconds) {
                $data['pieData'][] = [
                    'name' => $name,
                    'value' => round($seconds / 3600, 2),
                ];
            }

            // Table data: project breakdown
            foreach ($projectTimes as $name => $seconds) {
                $data['tableData'][] = [
                    'projectName' => $name,
                    'timeSpent' => $seconds,
                ];
            }
        }

        return $data;
    }
}
