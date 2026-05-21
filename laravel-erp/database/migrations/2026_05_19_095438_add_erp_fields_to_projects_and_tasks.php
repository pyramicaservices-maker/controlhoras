<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('archived')->default(false);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->json('tags')->nullable();
            $table->boolean('archived')->default(false);
            $table->timestamp('status_changed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['tags', 'archived', 'status_changed_at']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('archived');
        });
    }
};
