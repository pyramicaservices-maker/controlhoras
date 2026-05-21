<?php

namespace App\Filament\Widgets;

use App\Models\Project;
use Filament\Widgets\ChartWidget;

class ProjectHoursChart extends ChartWidget
{
    protected ?string $heading = 'Horas Asignadas por Proyecto';

    protected function getData(): array
    {
        $projects = Project::limit(10)->get();

        return [
            'datasets' => [
                [
                    'label' => 'Horas',
                    'data' => $projects->pluck('assigned_hours')->toArray(),
                    'backgroundColor' => [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                    ],
                ],
            ],
            'labels' => $projects->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
