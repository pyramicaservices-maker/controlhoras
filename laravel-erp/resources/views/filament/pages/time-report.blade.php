<x-filament-panels::page>
    <div class="space-y-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 class="text-lg font-bold mb-2">Resumen General</h2>
            <p class="text-sm text-gray-500">Aquí puedes ver el desglose de todas las horas registradas en el sistema.</p>
        </div>

        {{ $this->table }}
    </div>
</x-filament-panels::page>
