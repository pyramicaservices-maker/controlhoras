<?php

namespace App\Filament\Resources\Projects\Tables;

use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\DeleteBulkAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ProjectsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('client.name')
                    ->label('Cliente')
                    ->badge()
                    ->color('info')
                    ->searchable(),
                TextColumn::make('name')
                    ->label('Proyecto')
                    ->searchable(),
                TextColumn::make('type')
                    ->label('Tipo')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'mantenimiento' => 'primary',
                        'desarrollo' => 'success',
                        default => 'gray',
                    }),
                TextColumn::make('assigned_hours')
                    ->label('Horas Asignadas')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('start_date')
                    ->label('Inicio')
                    ->date()
                    ->sortable(),
                TextColumn::make('end_date')
                    ->label('Fin')
                    ->date()
                    ->sortable(),
                \Filament\Tables\Columns\ToggleColumn::make('archived')
                    ->label('Archivado')
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
