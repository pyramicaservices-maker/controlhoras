<?php

namespace App\Filament\Resources\TimeEntries\Schemas;

use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TimeEntryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Imputación de Tiempo')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Select::make('task_id')
                                    ->relationship('task', 'content')
                                    ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->project?->name} - {$record->content}")
                                    ->searchable()
                                    ->required()
                                    ->label('Tarea / Proyecto'),
                                Select::make('user_id')
                                    ->relationship('user', 'name')
                                    ->searchable()
                                    ->required()
                                    ->default(fn () => auth()->id())
                                    ->label('Usuario'),
                                TextInput::make('time_added')
                                    ->numeric()
                                    ->required()
                                    ->formatStateUsing(fn ($state) => $state ? round($state / 3600, 2) : null)
                                    ->dehydrateStateUsing(fn ($state) => $state * 3600)
                                    ->suffix('horas')
                                    ->placeholder('Ej. 1.5')
                                    ->label('Tiempo Imputado'),
                            ])
                    ])
            ]);
    }
}
