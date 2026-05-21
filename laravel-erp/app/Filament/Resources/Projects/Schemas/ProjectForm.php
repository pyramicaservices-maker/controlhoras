<?php

namespace App\Filament\Resources\Projects\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Schemas\Schema;

class ProjectForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información del Proyecto')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Select::make('client_id')
                                    ->relationship('client', 'name')
                                    ->required()
                                    ->label('Cliente'),
                                TextInput::make('name')
                                    ->required()
                                    ->label('Nombre del Proyecto'),
                                Select::make('type')
                                    ->options([
                                        'mantenimiento' => 'Mantenimiento',
                                        'desarrollo' => 'Desarrollo',
                                        'consultoria' => 'Consultoría',
                                    ])
                                    ->required()
                                    ->label('Tipo de Proyecto'),
                                TextInput::make('assigned_hours')
                                    ->required()
                                    ->numeric()
                                    ->label('Horas Asignadas')
                                    ->default(0),
                                DatePicker::make('start_date')
                                    ->label('Fecha de Inicio'),
                                DatePicker::make('end_date')
                                    ->label('Fecha de Finalización'),
                                \Filament\Forms\Components\Toggle::make('archived')
                                    ->label('Archivado')
                                    ->default(false)
                                    ->columnSpanFull(),
                            ])
                    ])
            ]);
    }
}
