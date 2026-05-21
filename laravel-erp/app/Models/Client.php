<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

#[Fillable(['name'])]
class Client extends Model
{
    use HasFactory, HasUuids;

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
