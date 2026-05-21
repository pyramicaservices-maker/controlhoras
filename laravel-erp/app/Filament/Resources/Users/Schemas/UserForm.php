<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Filament\Resources\Users\Pages\CreateUser;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información del Usuario')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('name')
                                    ->required()
                                    ->label('Nombre Completo'),
                                TextInput::make('email')
                                    ->email()
                                    ->required()
                                    ->unique(ignoreRecord: true)
                                    ->label('Correo Electrónico'),
                                TextInput::make('password')
                                    ->password()
                                    ->dehydrated(fn ($state) => filled($state))
                                    ->required(fn ($context) => $context === 'create')
                                    ->label('Contraseña'),
                                Select::make('role')
                                    ->options([
                                        'admin' => 'Administrador',
                                        'user' => 'Usuario estándar',
                                    ])
                                    ->required()
                                    ->default('user')
                                    ->label('Rol'),
                                ColorPicker::make('color')
                                    ->label('Color de Perfil')
                                    ->default('#7b2cbf'),
                                FileUpload::make('avatar')
                                    ->image()
                                    ->avatar()
                                    ->disk('public')
                                    ->directory('avatars')
                                    ->label('Avatar / Foto'),
                            ])
                    ])
            ]);
    }
}
