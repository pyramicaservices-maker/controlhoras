<?php

namespace App\Filament\Resources\TimeEntries\Tables;

use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\DeleteBulkAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TimeEntriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->date()
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Usuario')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('task.project.name')
                    ->label('Proyecto')
                    ->badge()
                    ->color('info')
                    ->searchable(),
                TextColumn::make('task.content')
                    ->label('Tarea')
                    ->searchable(),
                TextColumn::make('time_added')
                    ->label('Horas Registradas')
                    ->formatStateUsing(fn ($state) => number_format($state / 3600, 2) . 'h')
                    ->summarize(
                        Sum::make()
                            ->label('Total')
                            ->formatStateUsing(fn ($state) => number_format($state / 3600, 2) . 'h')
                    )
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
