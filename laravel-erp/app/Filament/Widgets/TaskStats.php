<?php

namespace App\Filament\Widgets;

use App\Models\Task;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class TaskStats extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Tareas Totales', Task::count())
                ->description('Total de tareas asignadas')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('primary'),
            Stat::make('En Progreso', Task::where('status', 'in_progress')->count())
                ->description('Tareas actualmente activas')
                ->descriptionIcon('heroicon-m-play')
                ->color('warning'),
            Stat::make('Completadas', Task::where('status', 'done')->count())
                ->description('Tareas finalizadas con éxito')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),
        ];
    }
}
