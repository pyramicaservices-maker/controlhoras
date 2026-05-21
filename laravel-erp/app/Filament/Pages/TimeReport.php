<?php

namespace App\Filament\Pages;

use App\Models\TimeEntry;
use Filament\Pages\Page;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Filament\Tables\Columns\Summarizers\Sum;

use Filament\Support\Icons\Heroicon;
use BackedEnum;

class TimeReport extends Page implements HasTable
{
    use InteractsWithTable;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentChartBar;
    protected static ?string $navigationLabel = 'Reporte de Horas';
    protected static ?string $title = 'Reporte de Tiempo Global';
    protected string $view = 'filament.pages.time-report';

    public function table(Table $table): Table
    {
        return $table
            ->query(TimeEntry::query())
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->date()
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Usuario')
                    ->searchable(),
                TextColumn::make('task.project.name')
                    ->label('Proyecto')
                    ->badge()
                    ->searchable(),
                TextColumn::make('task.content')
                    ->label('Tarea')
                    ->searchable(),
                TextColumn::make('time_added')
                    ->label('Horas Registradas')
                    ->numeric()
                    ->summarize(Sum::make()->label('Total'))
                    ->sortable(),
            ])
            ->filters([
                //
            ]);
    }
}
