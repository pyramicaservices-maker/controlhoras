<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'color' => '#7b2cbf'
            ]
        );

        // Developer User
        $dev = User::firstOrCreate(
            ['email' => 'dev@admin.com'],
            [
                'name' => 'Juan Desarrollador',
                'password' => Hash::make('password'),
                'role' => 'user',
                'color' => '#ffb86c'
            ]
        );

        // Sample Client
        $client = Client::create(['name' => 'Digital Solutions Inc.']);
        
        // Sample Project
        $project = Project::create([
            'client_id' => $client->id,
            'name' => 'Migración ERP',
            'type' => 'mantenimiento',
            'assigned_hours' => 80.0,
            'start_date' => now()->subDays(10),
            'end_date' => now()->addDays(20),
        ]);

        // Sample Tasks
        $task1 = Task::create([
            'project_id' => $project->id,
            'content' => 'Configurar Filament',
            'description' => 'Instalar y configurar el panel de administración',
            'priority' => 'Alta',
            'status' => 'done',
            'deadline' => now()->subDays(5),
            'estimated_time' => 8.0,
        ]);

        $task2 = Task::create([
            'project_id' => $project->id,
            'content' => 'Migrar Modelos',
            'description' => 'Crear modelos Eloquent y migraciones correspondientes',
            'priority' => 'Media',
            'status' => 'inProgress',
            'deadline' => now()->addDays(2),
            'estimated_time' => 16.0,
        ]);

        // Assign users to tasks
        $task1->users()->attach([$admin->id, $dev->id]);
        $task2->users()->attach([$dev->id]);

        // Create Time Entries (stored in seconds)
        TimeEntry::create([
            'task_id' => $task1->id,
            'user_id' => $admin->id,
            'time_added' => 4.0 * 3600, // 4 hours
        ]);

        TimeEntry::create([
            'task_id' => $task1->id,
            'user_id' => $dev->id,
            'time_added' => 3.5 * 3600, // 3.5 hours
        ]);

        TimeEntry::create([
            'task_id' => $task2->id,
            'user_id' => $dev->id,
            'time_added' => 8.0 * 3600, // 8 hours
        ]);
    }
}
