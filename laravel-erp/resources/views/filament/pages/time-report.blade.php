<x-filament-panels::page>
    @php
        $reportData = $this->getReportData();
        
        if (!function_exists('formatSecondsToTime')) {
            function formatSecondsToTime($seconds) {
                $h = floor($seconds / 3600);
                $m = floor(($seconds % 3600) / 60);
                $s = $seconds % 60;
                return sprintf('%02d:%02d:%02d', $h, $m, $s);
            }
        }
    @endphp

    <div class="space-y-6">
        <!-- Tabs -->
        <div class="report-tabs">
            <button type="button" class="report-tab {{ $reportMode === 'project' ? 'active' : '' }}" wire:click="$set('reportMode', 'project')">
                Por Proyecto
            </button>
            <button type="button" class="report-tab {{ $reportMode === 'worker' ? 'active' : '' }}" wire:click="$set('reportMode', 'worker')">
                Por Trabajador
            </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-4 flex-wrap items-center p-4 bg-black/20 rounded-xl border border-white/5">
            @if ($reportMode === 'project')
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400 mb-1">Filtrar Proyecto</span>
                    <select class="task-input min-w-[200px]" wire:model.live="selectedProjectId">
                        <option value="">Selecciona Proyecto...</option>
                        @foreach ($projects as $proj)
                            <option value="{{ $proj['id'] }}">{{ $proj['name'] }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400 mb-1">Filtrar por Trabajador</span>
                    <select class="task-input min-w-[200px]" wire:model.live="selectedWorkerId">
                        <option value="">Todos los Trabajadores</option>
                        @foreach ($users as $u)
                            <option value="{{ $u['id'] }}">{{ $u['name'] }}</option>
                        @endforeach
                    </select>
                </div>
            @else
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400 mb-1">Trabajador</span>
                    <select class="task-input min-w-[200px]" wire:model.live="selectedWorkerId">
                        <option value="">Selecciona Trabajador...</option>
                        @foreach ($users as $u)
                            <option value="{{ $u['id'] }}">{{ $u['name'] }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400 mb-1">Rango Temporal</span>
                    <select class="task-input min-w-[150px]" wire:model.live="timeFilter">
                        <option value="week">Semana Actual</option>
                        <option value="month">Mes Actual</option>
                        <option value="year">Año Actual</option>
                        <option value="all">Todo el Histórico</option>
                    </select>
                </div>
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400 mb-1">Filtrar por Proyecto</span>
                    <select class="task-input min-w-[200px]" wire:model.live="selectedProjectId">
                        <option value="">Todos los Proyectos</option>
                        @foreach ($projects as $proj)
                            <option value="{{ $proj['id'] }}">{{ $proj['name'] }}</option>
                        @endforeach
                    </select>
                </div>
            @endif
        </div>

        <!-- Report Content -->
        @if ($reportMode === 'project' && $selectedProjectId)
            @php
                $currentProj = collect($projects)->firstWhere('id', $selectedProjectId);
            @endphp
            @if ($currentProj)
                <button type="button" onclick="exportReportToPDF('Reporte_Proyecto_{{ str_replace(' ', '_', $currentProj['name']) }}')" class="btn-primary flex items-center gap-2 max-w-[220px]" style="margin-top: 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg> Exportar a PDF
                </button>

                <div id="report-content" class="glass-panel p-8 space-y-8" style="background-color: var(--panel-bg); color: var(--text-main);">
                    <!-- Header -->
                    <div class="text-center pb-6 border-b border-white/10">
                        <h1 class="text-3xl font-extrabold text-white tracking-tight">Pyramica SaaS</h1>
                        <h2 class="text-xl font-bold mt-2" style="color: var(--active-color);">Reporte de Proyecto: {{ $currentProj['name'] }}</h2>
                        <p class="text-sm text-gray-400 mt-1">Generado el: {{ now()->format('d/m/Y') }}</p>
                    </div>

                    <!-- Layout: Chart & Table -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <!-- Chart -->
                        <div class="lg:col-span-5 flex flex-col items-center">
                            <h3 class="text-lg font-semibold mb-4 text-center">Distribución Real de Tiempo</h3>
                            @if (!empty($reportData['pieData']))
                                <div class="w-full max-w-[300px] h-[300px]" 
                                     x-data="reportChart" 
                                     x-init="initChart()"
                                     data-chart-data="{{ json_encode($reportData['pieData']) }}">
                                    <canvas x-ref="canvas"></canvas>
                                </div>
                            @else
                                <p class="text-sm text-gray-400 mt-12">No hay tiempos registrados en este periodo.</p>
                            @endif
                        </div>

                        <!-- Table -->
                        <div class="lg:col-span-7 space-y-4">
                            <h3 class="text-lg font-semibold">Desglose de Tareas Realizadas</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="border-b-2 border-white/10" style="color: var(--active-color);">
                                            <th class="p-3">Tarea</th>
                                            <th class="p-3">Asignados</th>
                                            <th class="p-3">Estado</th>
                                            <th class="p-3 text-right">Tiempo Invertido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse ($reportData['tableData'] as $row)
                                            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td class="p-3 text-sm font-medium">{{ $row['content'] }}</td>
                                                <td class="p-3 text-sm text-gray-300">
                                                    {{ implode(', ', $row['assignees']) }}
                                                </td>
                                                <td class="p-3 text-sm">
                                                    <span class="px-2 py-1 rounded text-xs {{ $row['status'] === 'Terminada' ? 'bg-green-500/20 text-green-300' : ($row['status'] === 'En Progreso' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-500/20 text-gray-300') }}">
                                                        {{ $row['status'] }}
                                                    </span>
                                                </td>
                                                <td class="p-3 text-sm text-right font-mono">{{ formatSecondsToTime($row['timeSpent']) }}</td>
                                            </tr>
                                        @empty
                                            <tr>
                                                <td colspan="4" class="p-6 text-center text-sm text-gray-400">Sin tareas registradas.</td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                    <tfoot>
                                        <tr class="border-t-2 font-bold" style="border-color: var(--active-color);">
                                            <td colspan="3" class="p-4 text-right">TOTAL HORAS REALES:</td>
                                            <td class="p-4 text-right font-mono text-lg" style="color: var(--active-color);">
                                                {{ formatSecondsToTime($reportData['totalSeconds']) }}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @elseif ($reportMode === 'worker' && $selectedWorkerId)
            @php
                $currentWorker = collect($users)->firstWhere('id', $selectedWorkerId);
            @endphp
            @if ($currentWorker)
                <button type="button" onclick="exportReportToPDF('Reporte_Trabajador_{{ str_replace(' ', '_', $currentWorker['name']) }}')" class="btn-primary flex items-center gap-2 max-w-[220px]" style="margin-top: 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg> Exportar a PDF
                </button>

                <div id="report-content" class="glass-panel p-8 space-y-8" style="background-color: var(--panel-bg); color: var(--text-main);">
                    <!-- Header -->
                    <div class="text-center pb-6 border-b border-white/10">
                        <h1 class="text-3xl font-extrabold text-white tracking-tight">Pyramica SaaS</h1>
                        <h2 class="text-xl font-bold mt-2" style="color: var(--accent-cyan);">Reporte de Trabajador: {{ $currentWorker['name'] }}</h2>
                        <p class="text-sm text-gray-400 mt-1">
                            Filtro Temporal: {{ $timeFilter === 'week' ? 'Semana Actual' : ($timeFilter === 'month' ? 'Mes Actual' : ($timeFilter === 'year' ? 'Año Actual' : 'Histórico Completo')) }} <br>
                            Generado el: {{ now()->format('d/m/Y') }}
                        </p>
                    </div>

                    <!-- Layout: Chart & Table -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <!-- Chart -->
                        <div class="lg:col-span-5 flex flex-col items-center">
                            <h3 class="text-lg font-semibold mb-4 text-center">Dedicación por Proyectos</h3>
                            @if (!empty($reportData['pieData']))
                                <div class="w-full max-w-[300px] h-[300px]" 
                                     x-data="reportChart" 
                                     x-init="initChart()"
                                     data-chart-data="{{ json_encode($reportData['pieData']) }}">
                                    <canvas x-ref="canvas"></canvas>
                                </div>
                            @else
                                <p class="text-sm text-gray-400 mt-12">No hay tiempos registrados en este periodo.</p>
                            @endif
                        </div>

                        <!-- Table -->
                        <div class="lg:col-span-7 space-y-4">
                            <h3 class="text-lg font-semibold">Desglose de Proyectos y Tiempo</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="border-b-2 border-white/10" style="color: var(--accent-cyan);">
                                            <th class="p-3">Proyecto</th>
                                            <th class="p-3 text-right">Tiempo Dedicado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse ($reportData['tableData'] as $row)
                                            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td class="p-3 text-sm font-semibold">{{ $row['projectName'] }}</td>
                                                <td class="p-3 text-sm text-right font-mono text-white">{{ formatSecondsToTime($row['timeSpent']) }}</td>
                                            </tr>
                                        @empty
                                            <tr>
                                                <td colspan="2" class="p-6 text-center text-sm text-gray-400">Sin registros de tiempo en el periodo seleccionado.</td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                    <tfoot>
                                        <tr class="border-t-2 font-bold" style="border-color: var(--accent-cyan);">
                                            <td class="p-4 text-right">TOTAL HORAS DEL TRABAJADOR:</td>
                                            <td class="p-4 text-right font-mono text-lg" style="color: var(--accent-cyan);">
                                                {{ formatSecondsToTime($reportData['totalSeconds']) }}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @else
            <div class="glass-panel p-12 text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto mb-4 text-gray-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v-2.25a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v2.25m3 0V12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v5.25" />
                </svg>
                <p class="text-lg">Selecciona los filtros arriba para generar el reporte visual.</p>
            </div>
        @endif
    </div>

    <!-- Chart.js, html2canvas and jsPDF Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('reportChart', () => ({
                chartInstance: null,
                initChart() {
                    const data = JSON.parse(this.$el.getAttribute('data-chart-data'));
                    if (!data || data.length === 0) return;

                    const ctx = this.$refs.canvas.getContext('2d');
                    this.chartInstance = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: data.map(item => item.name),
                            datasets: [{
                                data: data.map(item => item.value),
                                backgroundColor: [
                                    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ff79c6', '#bd93f9', '#50fa7b'
                                ],
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#8b949e',
                                        font: {
                                            family: 'Inter',
                                            size: 11
                                        }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return ` ${context.label}: ${context.raw.toFixed(2)}h`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }));
        });

        function exportReportToPDF(filename) {
            const reportElement = document.getElementById('report-content');
            if (!reportElement) return;

            // Ensure background color is preserved correctly during capture
            html2canvas(reportElement, {
                scale: 2,
                backgroundColor: '#0d0f18',
                useCORS: true
            }).then(canvas => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(filename + '.pdf');
            });
        }
    </script>
</x-filament-panels::page>
