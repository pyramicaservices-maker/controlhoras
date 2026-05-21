<?php

namespace App\Filament\Resources\Tasks\Tables;

use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\DeleteBulkAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TasksTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('project.name')
                    ->label('Proyecto')
                    ->badge()
                    ->searchable(),
                TextColumn::make('content')
                    ->label('Tarea')
                    ->description(fn ($record) => $record->description)
                    ->searchable(),
                TextColumn::make('users.name')
                    ->label('Asignados')
                    ->badge()
                    ->color('primary')
                    ->searchable(),
                TextColumn::make('priority')
                    ->label('Prioridad')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Alta' => 'danger',
                        'Media' => 'warning',
                        'Baja' => 'success',
                        default => 'gray',
                    })
                    ->searchable(),
                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'todo' => 'gray',
                        'inProgress' => 'warning',
                        'review' => 'info',
                        'done' => 'success',
                        default => 'gray',
                    })
                    ->searchable(),
                TextColumn::make('deadline')
                    ->label('Fecha Límite')
                    ->date()
                    ->sortable(),
                TextColumn::make('estimated_time')
                    ->label('Horas Est.')
                    ->numeric()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
