<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

#[Fillable(['project_id', 'content', 'description', 'priority', 'deadline', 'estimated_time', 'status', 'attachments', 'tags', 'archived', 'status_changed_at'])]
class Task extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'estimated_time' => 'float',
            'attachments' => 'array',
            'tags' => 'array',
            'archived' => 'boolean',
            'status_changed_at' => 'datetime',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }
}
