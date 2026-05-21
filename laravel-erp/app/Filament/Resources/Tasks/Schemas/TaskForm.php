<?php

namespace App\Filament\Resources\Tasks\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Schemas\Schema;

class TaskForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Detalles de la Tarea')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Select::make('project_id')
                                    ->relationship('project', 'name')
                                    ->required()
                                    ->label('Proyecto'),
                                TextInput::make('content')
                                    ->required()
                                    ->label('Título de la Tarea'),
                                Select::make('priority')
                                    ->options([
                                        'Alta' => 'Alta',
                                        'Media' => 'Media',
                                        'Baja' => 'Baja',
                                    ])
                                    ->required()
                                    ->label('Prioridad'),
                                Select::make('status')
                                    ->options([
                                        'todo' => 'Por hacer',
                                        'inProgress' => 'En progreso',
                                        'review' => 'En revisión',
                                        'done' => 'Hecho',
                                    ])
                                    ->required()
                                    ->label('Estado'),
                                DatePicker::make('deadline')
                                    ->label('Fecha Límite'),
                                TextInput::make('estimated_time')
                                    ->numeric()
                                    ->label('Horas Estimadas')
                                    ->default(0),
                                Select::make('users')
                                    ->multiple()
                                    ->relationship('users', 'name')
                                    ->preload()
                                    ->label('Usuarios Asignados')
                                    ->columnSpanFull(),
                            ]),
                        RichEditor::make('description')
                            ->label('Descripción')
                            ->columnSpanFull(),
                        \Filament\Forms\Components\Repeater::make('tags')
                            ->schema([
                                TextInput::make('name')->required()->label('Nombre'),
                                \Filament\Forms\Components\ColorPicker::make('color')->required()->label('Color'),
                            ])
                            ->columns(2)
                            ->columnSpanFull()
                            ->label('Etiquetas'),
                    ])
            ]);
    }
}
