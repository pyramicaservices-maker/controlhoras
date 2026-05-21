<?php

namespace App\Filament\Resources\Tasks\RelationManagers;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Tables\Actions\CreateAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\DeleteAction;

class TimeEntriesRelationManager extends RelationManager
{
    protected static string $relationship = 'timeEntries';

    protected static ?string $title = 'Registro de Tiempos';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
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
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('time_added')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->date()
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Usuario')
                    ->sortable(),
                TextColumn::make('time_added')
                    ->label('Horas Registradas')
                    ->formatStateUsing(fn ($state) => number_format($state / 3600, 2) . 'h')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Imputar Horas'),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ]);
    }
}
