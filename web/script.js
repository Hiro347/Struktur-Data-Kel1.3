// script.js — Road Central USA Graph Explorer
// Modernized Dashboard Controller with Dynamic Tab Router & Dual Theme Support

document.addEventListener('DOMContentLoaded', () => {
    // Register global ChartJS plugins
    const brutalistTrackPlugin = {
        id: 'brutalistTrack',
        beforeDatasetsDraw(chart) {
            const { ctx, chartArea: { top, bottom } } = chart;
            ctx.save();

            const isLight = document.body.classList.contains('light-theme');
            
            // Find track color based on the parent card class
            const card = chart.canvas.closest('.ui-card');
            let trackColor = isLight ? '#FAF5DB' : '#000000'; // default fallback
            
            if (card) {
                if (card.classList.contains('card-cream')) {
                    trackColor = isLight ? '#E3DECD' : '#E0DBCC';
                } else if (card.classList.contains('card-grey')) {
                    trackColor = isLight ? '#D5CEBE' : '#CCC5B6';
                } else if (card.classList.contains('card-pink')) {
                    trackColor = '#E359C1';
                } else if (card.classList.contains('card-dark')) {
                    trackColor = '#252528';
                }
            }

            const activeDatasets = chart.data.datasets;
            activeDatasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                // Skip hidden datasets or non-bar type datasets
                if (meta.hidden || meta.type !== 'bar') return;

                meta.data.forEach((bar) => {
                    ctx.fillStyle = trackColor;

                    const xPos = bar.x;
                    const width = bar.width || 35;
                    const trackWidth = width;
                    const trackTop = top;
                    const trackBottom = bottom;
                    const radius = trackWidth / 2;

                    // Draw capsule track
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(xPos - trackWidth / 2, trackTop, trackWidth, trackBottom - trackTop, radius);
                    } else {
                        // Fallback round rect for older environments
                        const x = xPos - trackWidth / 2;
                        const y = trackTop;
                        const w = trackWidth;
                        const h = trackBottom - trackTop;
                        const r = radius;
                        ctx.moveTo(x + r, y);
                        ctx.lineTo(x + w - r, y);
                        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                        ctx.lineTo(x + w, y + h - r);
                        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                        ctx.lineTo(x + r, y + h);
                        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                        ctx.lineTo(x, y + r);
                        ctx.quadraticCurveTo(x, y, x + r, y);
                    }
                    ctx.fill();
                });
            });
            ctx.restore();
        }
    };
    Chart.register(ChartDataLabels, brutalistTrackPlugin);

    // ===================================
    // DOM Navigation References (Zone 1)
    // ===================================
    const btnViewDashboard = document.getElementById('btn-view-dashboard');
    const btnViewGraph = document.getElementById('btn-view-graph');
    const btnViewBenchmark = document.getElementById('btn-view-benchmark');
    const btnViewTable = document.getElementById('btn-view-table');
    const btnViewConsole = document.getElementById('btn-view-console');

    const viewDashboard = document.getElementById('view-dashboard');
    const viewGraph = document.getElementById('view-graph');
    const viewBenchmark = document.getElementById('view-benchmark');
    const viewTable = document.getElementById('view-table');
    const viewConsole = document.getElementById('view-console');

    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    // Sidebar collapse controls
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // ===================================
    // DOM Controls & UI Elements
    // ===================================
    const btnInsertDataset = document.getElementById('btnInsertDataset');
    const btnRefreshWebsite = document.getElementById('btnRefreshWebsite');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toast = document.getElementById('toast');
    const consoleLog = document.getElementById('consoleLog');
    const canvasContainer = document.getElementById('graphCanvas');

    // Stats KPIs
    const statNodes = document.getElementById('statActiveNodes');
    const statEdges = document.getElementById('statActiveEdges');
    const statMemory = document.getElementById('statMemoryEst');
    const lastOpTimeVal = document.getElementById('lastOpTimeVal');

    // Inspectors & Table
    const inspectBody = document.getElementById('inspectBody');
    const tableBody = document.getElementById('tableBody');
    const tableSearch = document.getElementById('tableSearch');
    const pageInfo = document.getElementById('pageInfo');
    const pagePrev = document.getElementById('pagePrev');
    const pageNext = document.getElementById('pageNext');

    // Modals
    const datasetModal = document.getElementById('datasetModal');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const datasetOptions = document.querySelectorAll('.dataset-option');
    const vizLimitSlider = document.getElementById('vizLimitSlider');
    const vizLimitValue = document.getElementById('vizLimitValue');

    // Sidebars controls
    const toggleListBtn = document.getElementById('toggleListBtn');
    const toggleMatrixBtn = document.getElementById('toggleMatrixBtn');
    const btnSearch = document.getElementById('btnSearch');
    const btnSearchLokasi = document.getElementById('btnSearchLokasi');
    const btnDelete = document.getElementById('btnDelete');
    const btnUpdate = document.getElementById('btnUpdate');
    const btnInsertBaru = document.getElementById('btnInsertBaru');
    const btnInsertLokasi = document.getElementById('btnInsertLokasi');

    const searchAsal = document.getElementById('searchAsal');
    const searchTujuan = document.getElementById('searchTujuan');
    const searchLokasiInput = document.getElementById('searchLokasiInput');
    const deleteAsal = document.getElementById('deleteAsal');
    const deleteTujuan = document.getElementById('deleteTujuan');
    const updateAsal = document.getElementById('updateAsal');
    const updateTujuan = document.getElementById('updateTujuan');
    const updateJarak = document.getElementById('updateJarak');
    const insertBaruAsal = document.getElementById('insertBaruAsal');
    const insertBaruTujuan = document.getElementById('insertBaruTujuan');
    const insertBaruJarak = document.getElementById('insertBaruJarak');
    const insertLokasiNama = document.getElementById('insertLokasiNama');
    const insertLokasiTipe = document.getElementById('insertLokasiTipe');

    // Full benchmarks
    const btnRunFullBenchmark = document.getElementById('btnRunFullBenchmark');
    const benchmarkStatus = document.getElementById('benchmarkStatus');
    const chartTabs = document.getElementById('chartTabs');
    const sampleBadge = document.getElementById('sampleBadge');
    const displayedEdges = document.getElementById('displayedEdges');
    const totalEdges = document.getElementById('totalEdges');

    // ===================================
    // Application State
    // ===================================
    let currentStruktur = 'list';
    let network = null;
    let selectedDatasetLimit = null;
    let allEdges = [];
    let allNodes = [];
    let currentPage = 1;
    const ROWS_PER_PAGE = 15;
    let filteredEdges = [];
    
    // Charts state
    let myChart = null;
    let overviewChartInstance = null;
    let crudChartInstance = null;
    let currentChartOp = 'insert';

    // ===================================
    // Helper: Logging & Toasting
    // ===================================
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function addLog(message) {
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
        const logLine = `[${time}] ${message}\n`;
        consoleLog.textContent += logLine;
        consoleLog.scrollTop = consoleLog.scrollHeight;

        // Sync to mini console log on dashboard overview (keep last 4 lines)
        const miniConsoleLog = document.getElementById('miniConsoleLog');
        const lines = consoleLog.textContent.trim().split('\n');
        miniConsoleLog.textContent = lines.slice(-4).join('\n');
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    function formatTimeHelper(us) {
        if (us < 1000) return `${us.toFixed(1)} µs`;
        if (us < 1000000) return `${(us / 1000).toFixed(2)} ms`;
        return `${(us / 1000000).toFixed(2)} s`;
    }

    async function safeFetch(url, options = {}) {
        const controller = new AbortController();
        // Tingkatkan timeout menjadi 5 menit (300000 ms) untuk dataset puluhan juta
        const timeout = options.timeout || 300000; 
        const timeoutId  = setTimeout(() => controller.abort(), timeout);
        
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            addLog(`[-] Request Timeout atau Server terputus: ${url}`);
            showToast("Proses terlalu lama atau server offline.", "warning");
            return null;
        }
    }

    // ===================================
    // Tab Navigation Switcher
    // ===================================
    const views = [
        { btn: btnViewDashboard, sec: viewDashboard, title: "Dashboard Overview", desc: "Ringkasan grafik, metrik kinerja, dan log sistem terpadu" },
        { btn: btnViewGraph, sec: viewGraph, title: "Network Graph Visualizer", desc: "Eksplorasi grafis simpul jalan (Vis.js) interaktif secara visual" },
        { btn: btnViewBenchmark, sec: viewBenchmark, title: "Performance Benchmarks", desc: "Analisis komparasi kecepatan eksekusi dan konsumsi memori" },
        { btn: btnViewTable, sec: viewTable, title: "Dataset Rute Explorer", desc: "Daftar seluruh segmen rute distribusi dalam format tabular" },
        { btn: btnViewConsole, sec: viewConsole, title: "C++ Server Console", desc: "Replika log aktivitas backend C++ server secara real-time" }
    ];

    views.forEach(v => {
        v.btn.addEventListener('click', () => {
            views.forEach(other => {
                other.btn.classList.remove('active');
                other.sec.classList.add('hidden');
            });
            v.btn.classList.add('active');
            v.sec.classList.remove('hidden');
            pageTitle.textContent = v.title;
            pageDesc.textContent = v.desc;

            // Redraw Vis.js network canvas when switching to graph tab
            if (v.sec === viewGraph && network) {
                setTimeout(() => {
                    network.setSize();
                    network.fit({ animation: { duration: 450, easingFunction: 'easeInOutQuad' } });
                }, 100);
            }
        });
    });

    document.getElementById('btnGoToVisualizer').addEventListener('click', () => {
        btnViewGraph.click();
    });

    // ===================================
    // Accordion Control (Right Sidebar)
    // ===================================
    const accs = [
        { header: document.getElementById('accHeaderInsertLokasi'), content: document.getElementById('accContentInsertLokasi') },
        { header: document.getElementById('accHeaderInsertBaru'), content: document.getElementById('accContentInsertBaru') },
        { header: document.getElementById('accHeaderSearchLokasi'), content: document.getElementById('accContentSearchLokasi') },
        { header: document.getElementById('accHeaderSearch'), content: document.getElementById('accContentSearch') },
        { header: document.getElementById('accHeaderUpdate'), content: document.getElementById('accContentUpdate') },
        { header: document.getElementById('accHeaderDelete'), content: document.getElementById('accContentDelete') }
    ];

    accs.forEach(acc => {
        acc.header.addEventListener('click', () => {
            accs.forEach(other => {
                if (other.content !== acc.content) {
                    other.content.classList.add('collapsed');
                    other.header.querySelector('.acc-arrow').textContent = '▶';
                }
            });
            const isCollapsed = acc.content.classList.contains('collapsed');
            if (isCollapsed) {
                acc.content.classList.remove('collapsed');
                acc.header.querySelector('.acc-arrow').textContent = '▼';
            } else {
                acc.content.classList.add('collapsed');
                acc.header.querySelector('.acc-arrow').textContent = '▶';
            }
        });
    });

    // ===================================
    // Dual Theme System
    // ===================================
    let currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline-block';
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
            currentTheme = 'dark';
            sunIcon.style.display = 'inline-block';
            moonIcon.style.display = 'none';
            showToast("Beralih ke Tema Gelap", "success");
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            currentTheme = 'light';
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline-block';
            showToast("Beralih ke Tema Terang", "success");
        }
        updateChartThemeColors();
        if (network) {
            drawGraphVis({ nodes: allNodes, edges: allEdges });
        }
    });

    // Sidebar collapse event listeners
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            dashboardContainer.classList.toggle('sidebar-collapsed');
            const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
            showToast(isCollapsed ? "Panel Operasi disembunyikan" : "Panel Operasi ditampilkan", "info");
        });
    }
    if (btnCloseSidebar) {
        btnCloseSidebar.addEventListener('click', () => {
            dashboardContainer.classList.add('sidebar-collapsed');
            showToast("Panel Operasi disembunyikan", "info");
        });
    }

    function updateChartThemeColors() {
        const isLight = document.body.classList.contains('light-theme');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const tickColor = isLight ? '#475569' : '#94a3b8';
        const labelColor = isLight ? '#0f172a' : '#f1f5f9';

        const updateConfig = (chart) => {
            if (chart) {
                chart.options.scales.x.grid.color = gridColor;
                chart.options.scales.x.ticks.color = tickColor;
                chart.options.scales.y.grid.color = gridColor;
                chart.options.scales.y.ticks.color = tickColor;
                if (chart.options.scales.y.title) chart.options.scales.y.title.color = tickColor;
                chart.options.plugins.legend.labels.color = labelColor;
                
                if (chart.options.plugins.datalabels) {
                    chart.options.plugins.datalabels.color = labelColor;
                }

                // Align dataset colors and rounded borders on theme update
                const mathicalColors = ['#FF66D8', '#5856D6', '#D8F34C', '#FFAD33'];
                if (chart.data && chart.data.datasets) {
                    chart.data.datasets.forEach((dataset, idx) => {
                        if (chart === myChart) {
                            dataset.backgroundColor = idx === 0 ? '#5856D6' : '#FF66D8';
                        } else {
                            dataset.backgroundColor = mathicalColors[idx % mathicalColors.length];
                        }
                        dataset.borderColor = '#000000';
                        dataset.borderWidth = 3;
                        dataset.borderRadius = 9999;
                        dataset.borderSkipped = false;
                        dataset.barPercentage = 0.7;
                        dataset.categoryPercentage = 0.7;
                    });
                }
                
                chart.update('none');
            }
        };
        updateConfig(myChart);
        updateConfig(overviewChartInstance);
        updateConfig(crudChartInstance);
    }

    // ===================================
    // Structure Selection Toggles
    // ===================================
    const handleStructSelect = (type) => {
        currentStruktur = type;
        const structName = type === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        if (type === 'list') {
            toggleListBtn.classList.add('active');
            toggleMatrixBtn.classList.remove('active');
            addLog('Struktur Aktif → Adjacency List (Memori efisien O(V+E))');
        } else {
            toggleMatrixBtn.classList.add('active');
            toggleListBtn.classList.remove('active');
            addLog('Struktur Aktif → Adjacency Matrix (Lookup cepat O(1))');
        }
        
        // Update header indicator if a dataset is already loaded
        if (window.GraphData && window.GraphData.isLoaded) {
            const currentText = statusText.textContent.split('(')[0].trim();
            statusText.textContent = `${currentText} (${structName})`;
        }
    };
    toggleListBtn.addEventListener('click', () => handleStructSelect('list'));
    toggleMatrixBtn.addEventListener('click', () => handleStructSelect('matrix'));

    // ===================================
    // Modal Selector
    // ===================================
    function openModal() { datasetModal.classList.add('visible'); }
    function closeModal() { datasetModal.classList.remove('visible'); }
    btnInsertDataset.addEventListener('click', openModal);
    if (btnRefreshWebsite) btnRefreshWebsite.addEventListener('click', () => location.reload());
    modalCancel.addEventListener('click', closeModal);
    datasetModal.addEventListener('click', (e) => { if (e.target === datasetModal) closeModal(); });

    // ===================================
    // OOM Modal Logic
    // ===================================
    const oomModal = document.getElementById('oomModal');
    const btnOomReset = document.getElementById('btnOomReset');
    function showOOMWarning() {
        if (oomModal) {
            oomModal.classList.add('visible');
            closeModal();
            addLog("[-] CRITICAL: OUT OF MEMORY (OOM) ENCOUNTERED!");
            showToast("Out of Memory!", "error");
        }
    }
    function hideOOMWarning() {
        if (oomModal) oomModal.classList.remove('visible');
        location.reload();
    }
    if (btnOomReset) btnOomReset.addEventListener('click', hideOOMWarning);
    window.triggerOOM = showOOMWarning;


    datasetOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            datasetOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedDatasetLimit = opt.getAttribute('data-limit');
            modalConfirm.disabled = false;
        });
    });

    vizLimitSlider.addEventListener('input', () => {
        vizLimitValue.textContent = vizLimitSlider.value;
    });

    // ===================================
    // INSERTS & LOAD DATASET
    // ===================================
    modalConfirm.addEventListener('click', async () => {
        if (!selectedDatasetLimit) return;
        closeModal();

        const vizLimit = parseInt(vizLimitSlider.value);
        const isCSV = selectedDatasetLimit === 'csv';
        const benchmarkLimit = isCSV ? 0 : parseInt(selectedDatasetLimit);
        const limitLabel = isCSV ? 'CSV Dummy' : formatNumber(benchmarkLimit) + ' Edges';

        btnInsertDataset.disabled = true;
        btnInsertDataset.innerHTML = '<span class="spinner"></span> Loading...';

        addLog(`═══════════════════════════════════════════`);
        addLog(`=== INSERT DATASET (${limitLabel}) ===`);
        addLog(`Struktur: ${currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix'}`);
        addLog(`Meminta data dari C++ Server...`);

        try {
            // 1. Get visual network data
            const animLimit = isCSV ? vizLimit : Math.min(vizLimit, benchmarkLimit || vizLimit);
            const animRes = await safeFetch(`/api/animasi?limit=${animLimit}`);
            if (!animRes || !animRes.ok) throw new Error('Server API tidak merespons');
            const animData = await animRes.json();

            addLog(`[+] Data visual diterima: ${animData.nodes.length} Simpul, ${animData.edges.length} Rute`);

            // 2. Fetch Active structure insert time
            let benchData = { waktu_ms: 0, ram_mb: 0 };
            let compareData = null;

            if (!isCSV && benchmarkLimit > 0) {
                addLog(`Menjalankan INSERT ${formatNumber(benchmarkLimit)} Rute ke memori...`);
                const benchRes = await safeFetch('/api/benchmark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: benchmarkLimit, struktur: currentStruktur }),
                    timeout: 300000 // 5 menit
                });
                
                if (!benchRes || !benchRes.ok) {
                    throw new Error('Gagal mengeksekusi benchmark di server (Timeout/Offline)');
                }
                
                benchData = await benchRes.json();
                if (benchData.ram_mb < 0) {
                    showOOMWarning();
                    btnInsertDataset.innerHTML = 'Muat Dataset';
                    btnInsertDataset.disabled = false;
                    return;
                }

            }

            // Save variables
            allNodes = animData.nodes;
            allEdges = animData.edges;
            filteredEdges = [...allEdges];

            if (!window.GraphData) window.GraphData = {};
            window.GraphData.isLoaded = true;

            // 3. Update status displays
            statusDot.classList.add('active');
            const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
            statusText.textContent = `Dataset Aktif — ${limitLabel} (${structName})`;

            btnInsertDataset.innerHTML = `
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Dataset Dimuat ✓
            `;
            btnInsertDataset.disabled = false;

            // Overview Tab state update
            const miniNodePulse = document.getElementById('miniNodePulse');
            const miniGraphTitle = document.getElementById('miniGraphTitle');
            const miniGraphDesc = document.getElementById('miniGraphDesc');
            miniNodePulse.style.background = 'var(--accent-indigo)';
            miniNodePulse.style.color = 'white';
            miniNodePulse.style.borderStyle = 'solid';
            miniGraphTitle.textContent = `Graf Rute Aktif (${limitLabel})`;
            miniGraphDesc.textContent = `Visualisasi parsial menampilkan ${allEdges.length} rute distribusi. Klik tombol dibawah untuk melihat model interaktif.`;

            // Canvas warnings
            sampleBadge.style.display = 'flex';
            displayedEdges.textContent = animData.edges.length;
            totalEdges.textContent = isCSV ? animData.edges.length : formatNumber(benchmarkLimit);

            // 4. Update KPI metrics cards
            const totalEdgesVal = isCSV ? animData.edges.length : benchmarkLimit;
            statNodes.textContent = formatNumber(animData.nodes.length);
            statEdges.textContent = formatNumber(totalEdgesVal);
            statMemory.textContent = benchData.ram_mb > 0 ? `~${benchData.ram_mb.toFixed(2)} MB` : '—';
            
            const lastTimeUs = benchData.waktu_ms * 1000;
            lastOpTimeVal.textContent = lastTimeUs > 0 ? formatTimeHelper(lastTimeUs) : '—';

            // 5. Paginated edge data table rendering
            currentPage = 1;
            renderTable();

            // 6. Form selectors
            populateSelectors();

            // 7. Inspector Preview
            renderInspector(animData);

            // 8. Vis.js Network Drawing
            drawGraphVis(animData);

            // 9. Update Overview Dashboard Chart
            updateOverviewChart(limitLabel, currentStruktur, benchData.waktu_ms, benchData.ram_mb);

            addLog(`[+] Sukses memproses dataset! Waktu: ${formatTimeHelper(benchData.waktu_ms * 1000)}, RAM: ${benchData.ram_mb.toFixed(2)} MB`);
            addLog(`═══════════════════════════════════════════`);
            showToast(`Dataset ${limitLabel} berhasil dimuat!`, 'success');

        } catch (error) {
            console.error(error);
            showToast('Error: C++ Server offline!', 'error');
            addLog(`[-] ERROR: ${error.message}`);
            btnInsertDataset.innerHTML = 'Coba Lagi';
            btnInsertDataset.disabled = false;
        }
    });

    // ===================================
    // Table Rendering & Pagination
    // ===================================
    function renderTable() {
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        const end = start + ROWS_PER_PAGE;
        const pageData = filteredEdges.slice(start, end);
        const totalPages = Math.max(1, Math.ceil(filteredEdges.length / ROWS_PER_PAGE));

        let html = '';
        if (pageData.length === 0) {
            html = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">Tidak ada data ditemukan.</td></tr>`;
        } else {
            pageData.forEach((e, i) => {
                html += `<tr>
                    <td style="font-family:'JetBrains Mono',monospace;color:var(--text-tertiary);font-size:0.75rem;">R-${start + i + 1}</td>
                    <td>${e.from}</td>
                    <td>${e.to}</td>
                    <td style="font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--accent-indigo);">${e.label} km</td>
                </tr>`;
            });
        }

        tableBody.innerHTML = html;
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (${filteredEdges.length} rute)`;
        pagePrev.disabled = currentPage <= 1;
        pageNext.disabled = currentPage >= totalPages;

        // Render to mini table on Dashboard Overview (first 5 edges)
        const miniTableBody = document.getElementById('miniTableBody');
        let miniHtml = '';
        if (allEdges.length === 0) {
            miniHtml = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem;">Dataset belum dimuat.</td></tr>`;
        } else {
            allEdges.slice(0, 5).forEach((e, i) => {
                miniHtml += `<tr>
                    <td style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--text-tertiary);">R-${i+1}</td>
                    <td>${e.from}</td>
                    <td>${e.to}</td>
                    <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--accent-indigo);">${e.label} km</td>
                </tr>`;
            });
        }
        miniTableBody.innerHTML = miniHtml;
    }

    pagePrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
    pageNext.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredEdges.length / ROWS_PER_PAGE);
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    tableSearch.addEventListener('input', () => {
        const query = tableSearch.value.toLowerCase().trim();
        if (!query) {
            filteredEdges = [...allEdges];
        } else {
            filteredEdges = allEdges.filter(e =>
                e.from.toLowerCase().includes(query) ||
                e.to.toLowerCase().includes(query) ||
                e.label.toLowerCase().includes(query)
            );
        }
        currentPage = 1;
        renderTable();
    });

    // ===================================
    // Populating Dropdowns
    // ===================================
    function populateSelectors() {
        // Use allNodes so new floating nodes can be selected
        const uniqueSources = [...new Set(allNodes.map(n => n.id))].sort();

        const populateAsal = (asalSelect) => {
            asalSelect.innerHTML = '<option value="">— Pilih Asal —</option>';
            uniqueSources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src;
                opt.textContent = src;
                asalSelect.appendChild(opt);
            });
        };

        populateAsal(searchAsal);
        populateAsal(updateAsal);
        populateAsal(deleteAsal);
        populateAsal(insertBaruAsal);
        
        // Populate search lokasi dropdown
        searchLokasiInput.innerHTML = '<option value="">— Pilih Lokasi —</option>';
        uniqueSources.forEach(src => {
            const opt = document.createElement('option');
            opt.value = src;
            opt.textContent = src;
            searchLokasiInput.appendChild(opt);
        });

        setupDynamicDropdowns();

        searchTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
        updateTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
        deleteTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
        insertBaruTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
    }

    // ===================================
    // Inspector Details Render
    // ===================================
    function renderInspector(data) {
        let html = '<div style="padding: 0.25rem;">';
        html += `<div style="color:var(--accent-indigo);font-weight:700;margin-bottom:0.4rem;font-size:0.78rem;">📊 Data Preview</div>`;
        html += `<div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;line-height:1.6;color:var(--text-secondary);">`;

        const maxShow = Math.min(10, data.edges.length);
        for (let i = 0; i < maxShow; i++) {
            const e = data.edges[i];
            html += `<span style="color:var(--text-muted);">[${i}]</span> ${e.from} <span style="color:var(--accent-indigo);">→</span> ${e.to} <span style="color:var(--accent-amber);">(${e.label} km)</span><br>`;
        }
        if (data.edges.length > maxShow) {
            html += `<span style="color:var(--text-muted);display:block;margin-top:0.4rem;">... +${data.edges.length - maxShow} rute lainnya</span>`;
        }
        html += '</div></div>';
        inspectBody.innerHTML = html;
    }

    // ===================================
    // Operations: INSERT LOKASI (NODE)
    // ===================================
    btnInsertLokasi.addEventListener('click', async () => {
        const nama = insertLokasiNama.value;
        const tipe = insertLokasiTipe.value;
        if (!nama || !tipe) {
            showToast('Isi nama lokasi dan tipe!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const nodeId = "N-" + (allNodes.length + 1000000); // Generate Unique ID

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Menambahkan node lokasi baru: ${nama} (${tipe}) via ${structName}...`);

        const res = await safeFetch('/api/insert_lokasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: nodeId, nama, tipe, struktur: currentStruktur })
        });
        if (!res) return;
        const data = await res.json();

        // Update local graph data cache
        // Update local graph data cache
        let nodeColor = '#D8F34C'; // default / Tujuan
        if (tipe === 'Gudang') nodeColor = '#FF66D8';
        else if (tipe === 'Rumah') nodeColor = '#5856D6';
        else if (tipe === 'Kantor') nodeColor = '#8B5CF6';

        allNodes.push({
            id: nodeId,
            label: tipe,
            group: tipe,
            color: {
                background: nodeColor,
                border: '#000000',
                highlight: { background: '#ffffff', border: '#000000' },
                hover: { background: nodeColor, border: '#000000' }
            },
            font: { 
                color: document.body.classList.contains('light-theme') ? '#000000' : '#ffffff',
                face: 'Plus Jakarta Sans',
                size: 11,
                bold: true
            },
            size: tipe === 'Gudang' ? 30 : 20,
            shape: tipe === 'Gudang' ? 'star' : 'dot'
        });

        populateSelectors(); // Refresh dropdowns
        drawGraphVis({ nodes: allNodes, edges: allEdges });
        
        statNodes.textContent = formatNumber(allNodes.length);
        const timeUs = data.waktu_us;
        lastOpTimeVal.textContent = formatTimeHelper(timeUs);
        updateLiveOperation(6, timeUs);

        addLog(`[+] Lokasi ${nama} (${nodeId}) BERHASIL DITAMBAHKAN! | Waktu: ${formatTimeHelper(timeUs)}`);
        showToast(`Lokasi berhasil ditambahkan (${structName})`, "success");
        
        insertLokasiNama.value = ''; // clear form
    });

    // ===================================
    // Operations: INSERT RUTE BARU
    // ===================================
    btnInsertBaru.addEventListener('click', async () => {
        const asal = insertBaruAsal.value;
        const tujuan = insertBaruTujuan.value;
        const jarak = insertBaruJarak.value;
        if (!asal || !tujuan || !jarak) {
            showToast('Pilih lokasi asal, tujuan, dan jarak!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Menambahkan rute baru: ${asal} → ${tujuan} sejauh ${jarak} km (via ${structName})...`);

        const res = await safeFetch('/api/insert_rute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asal, tujuan, jarak: parseFloat(jarak), struktur: currentStruktur })
        });
        if (!res) return;
        const data = await res.json();

        // Update local cache
        const edgeId = "Rute_Baru_" + asal + "_" + tujuan;
        allEdges.push({ from: asal, to: tujuan, label: parseFloat(jarak).toString(), id_rute: edgeId });
        
        filteredEdges = [...allEdges];
        renderTable();
        drawGraphVis({ nodes: allNodes, edges: allEdges });
        
        statEdges.textContent = formatNumber(allEdges.length);

        const timeUs = data.waktu_us;
        lastOpTimeVal.textContent = formatTimeHelper(timeUs);
        updateLiveOperation(7, timeUs);

        addLog(`[+] Rute ${asal} → ${tujuan} BERHASIL DITAMBAHKAN! | Waktu: ${formatTimeHelper(timeUs)}`);
        showToast(`Rute berhasil ditambahkan (${structName})`, "success");
        
        insertBaruJarak.value = ''; // clear form
    });

    // ===================================
    // Operations: SEARCH LOKASI
    // ===================================
    btnSearchLokasi.addEventListener('click', () => {
        const targetId = searchLokasiInput.value;
        if (!targetId) {
            showToast('Pilih lokasi yang ingin dicari!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Mencari lokasi: ${targetId} (via ${structName})...`);
        const t0 = performance.now();

        const found = allNodes.find(n => n.id === targetId);
        const t1 = performance.now();
        const timeUs = (t1 - t0) * 1000;
        lastOpTimeVal.textContent = formatTimeHelper(timeUs);
        updateLiveOperation(2, timeUs);

        if (found) {
            addLog(`[+] Lokasi DITEMUKAN! Tipe: ${found.label} | Waktu: ${formatTimeHelper(timeUs)}`);
            showToast(`Lokasi ditemukan (${structName})`, 'success');

            btnViewGraph.click();
            if (network) {
                network.selectNodes([targetId]);
                network.focus(targetId, { scale: 1.8, animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
            }
        } else {
            addLog(`[-] Lokasi tidak ditemukan: ${targetId}`);
            showToast(`Lokasi tidak ditemukan`, 'error');
        }
    });

    // ===================================
    // Operations: SEARCH RUTE
    // ===================================
    btnSearch.addEventListener('click', () => {
        const asal = searchAsal.value;
        const tujuan = searchTujuan.value;
        if (!asal || !tujuan) {
            showToast('Pilih lokasi asal dan tujuan!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Mencari rute: ${asal} → ${tujuan} (via ${structName})...`);
        const t0 = performance.now();

        const found = allEdges.find(e => e.from === asal && e.to === tujuan);
        const t1 = performance.now();
        const timeUs = (t1 - t0) * 1000;
        lastOpTimeVal.textContent = formatTimeHelper(timeUs);
        updateLiveOperation(3, timeUs);

        if (found) {
            addLog(`[+] Rute DITEMUKAN! Jarak: ${found.label} km | Waktu: ${formatTimeHelper(timeUs)}`);
            showToast(`Rute ditemukan (${structName})`, 'success');

            // Open full graph tab and focus
            btnViewGraph.click();
            if (network) {
                network.selectNodes([asal, tujuan]);
                network.focus(asal, { scale: 1.4, animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
            }
        } else {
            addLog(`[-] Rute tidak ditemukan: ${asal} → ${tujuan}`);
            showToast(`Rute tidak ditemukan`, 'error');
        }
    });

    // ===================================
    // Operations: UPDATE RUTE
    // ===================================
    btnUpdate.addEventListener('click', async () => {
        const asal = updateAsal.value;
        const tujuan = updateTujuan.value;
        const jarak = updateJarak.value;
        if (!asal || !tujuan || !jarak) {
            showToast('Pilih lokasi, tujuan, dan jarak baru!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Mengupdate rute: ${asal} → ${tujuan} menjadi ${jarak} km (via ${structName})...`);

        const res = await safeFetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asal, tujuan, jarak: parseFloat(jarak), struktur: currentStruktur })
        });
        if (!res) return;
        const data = await res.json();

        // Update local JS cache
        const edge = allEdges.find(e => e.from === asal && e.to === tujuan);
        if (edge) {
            edge.label = parseFloat(jarak).toString();
            filteredEdges = [...allEdges];
            renderTable();
            drawGraphVis({ nodes: allNodes, edges: allEdges });

            const timeUs = data.waktu_us;
            lastOpTimeVal.textContent = formatTimeHelper(timeUs);
            updateLiveOperation(4, timeUs);

            addLog(`[+] Rute ${asal} → ${tujuan} diupdate menjadi ${jarak} km | Waktu: ${formatTimeHelper(timeUs)}`);
            showToast(`Rute berhasil diupdate (${structName})`, "success");
        } else {
            addLog(`[-] Rute tidak ditemukan di visualisasi cache: ${asal} → ${tujuan}`);
            showToast("Rute tidak ditemukan di visualisasi", "error");
        }
    });

    // ===================================
    // Operations: DELETE RUTE
    // ===================================
    btnDelete.addEventListener('click', () => {
        const asal = deleteAsal.value;
        const tujuan = deleteTujuan.value;
        if (!asal || !tujuan) {
            showToast('Pilih lokasi asal dan tujuan!', 'error');
            return;
        }
        if (!window.GraphData || !window.GraphData.isLoaded) {
            showToast('Muat dataset terlebih dahulu!', 'error');
            return;
        }

        const structName = currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix';
        addLog(`Menghapus rute: ${asal} → ${tujuan} (via ${structName})...`);
        const t0 = performance.now();

        const idx = allEdges.findIndex(e => e.from === asal && e.to === tujuan);
        if (idx !== -1) {
            allEdges.splice(idx, 1);
            filteredEdges = [...allEdges];
            currentPage = 1;
            renderTable();
            statEdges.textContent = formatNumber(allEdges.length);

            const t1 = performance.now();
            const timeUs = (t1 - t0) * 1000;
            lastOpTimeVal.textContent = formatTimeHelper(timeUs);
            updateLiveOperation(5, timeUs);

            addLog(`[+] Rute ${asal} → ${tujuan} berhasil DIHAPUS! | Waktu: ${formatTimeHelper(timeUs)}`);
            showToast(`Rute berhasil dihapus (${structName})`, 'success');

            drawGraphVis({ nodes: allNodes, edges: allEdges });
        } else {
            addLog(`[-] Rute tidak ditemukan: ${asal} → ${tujuan}`);
            showToast(`Rute tidak ditemukan`, 'error');
        }
    });

    // ===================================
    // STRESS-TEST FULL BENCHMARK
    // ===================================
    btnRunFullBenchmark.addEventListener('click', async () => {
        benchmarkStatus.innerHTML = '<span class="spinner"></span> Menjalankan...';
        addLog("Menjalankan stres-test full benchmark (1K, 5K, 10K, 100K, 500K, 1M, 5M rute)...");
        
        let results = null;
        const res = await safeFetch('/api/full-benchmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limits: [1000, 5000, 10000, 100000, 500000, 1000000, 5000000] })
        });
        
        if (res && res.ok) {
            results = await res.json();
            benchmarkStatus.textContent = 'Status: Selesai';
            showToast("Full benchmark selesai!", "success");
            addLog("[+] Full benchmark selesai. Hasil tersimpan di backend.");
        } else {
            addLog("[-] C++ benchmark server offline. Memuat data statis lokal...");
            const fallbackRes = await fetch('./benchmark_results.json').catch(() => null);
            if (fallbackRes && fallbackRes.ok) {
                results = await fallbackRes.json();
                benchmarkStatus.textContent = 'Status: Fallback Load';
                showToast("Memakai data benchmark statis (offline).", "warning");
                addLog("[+] Berhasil memuat data benchmark statis.");
            } else {
                benchmarkStatus.textContent = 'Status: Gagal';
                showToast("Gagal memproses data benchmark.", "error");
                return;
            }
        }
        
        window.fullBenchmarkResults = results;
        renderComparisonChart(results, currentChartOp);
        generateAutoAnalysis(results);
    });

    const tabButtons = document.querySelectorAll('#chartTabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartOp = btn.getAttribute('data-op');
            
            if (window.fullBenchmarkResults) {
                renderComparisonChart(window.fullBenchmarkResults, currentChartOp);
            } else {
                showToast("Jalankan stres-test terlebih dahulu!", "info");
            }
        });
    });

    function renderComparisonChart(results, operation) {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        const labels = results.map(r => `${(r.limit/1000).toFixed(0)}K`);
        
        let listData = [];
        let matrixData = [];
        let unit = 'ms';
        
        if (operation === 'ram') {
            listData = results.map(r => r.list.ram_mb);
            matrixData = results.map(r => r.matrix.ram_mb >= 0 ? r.matrix.ram_mb : 0);
            unit = 'MB';
        } else {
            listData = results.map(r => r.list[`${operation}_us`] / 1000.0);
            matrixData = results.map(r => {
                const val = r.matrix[`${operation}_us`];
                return val >= 0 ? val / 1000.0 : 0;
            });
            unit = 'ms';
        }

        const isLight = document.body.classList.contains('light-theme');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const tickColor = isLight ? '#475569' : '#94a3b8';
        const labelColor = isLight ? '#0f172a' : '#f1f5f9';

        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Adjacency List',
                        data: listData,
                        backgroundColor: '#5856D6',
                        borderColor: '#000000',
                        borderWidth: 3,
                        borderRadius: 9999,
                        borderSkipped: false,
                        barPercentage: 0.7,
                        categoryPercentage: 0.7
                    },
                    {
                        label: 'Adjacency Matrix',
                        data: matrixData,
                        backgroundColor: '#FF66D8',
                        borderColor: '#000000',
                        borderWidth: 3,
                        borderRadius: 9999,
                        borderSkipped: false,
                        barPercentage: 0.7,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                indexAxis: 'x', // Vertical bar chart
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                parsing: false,
                normalized: true,
                plugins: {
                    datalabels: {
                        color: labelColor,
                        font: { family: 'JetBrains Mono', size: 10, weight: '600' },
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value, context) {
                            const datasetLabel = context.dataset.label;
                            const sizeLabel = context.chart.data.labels[context.dataIndex];
                            if (datasetLabel === 'Adjacency Matrix' && results[context.dataIndex].matrix.ram_mb < 0) {
                                return 'OOM';
                            }
                            return value > 0 ? `${sizeLabel} Dataset: ${value.toFixed(1)} ${unit}` : '';
                        }
                    },
                    legend: {
                        labels: { color: labelColor, font: { family: 'Inter', weight: '600' } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(14, 14, 22, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 1,
                        titleFont: { family: 'Inter', weight: '700' },
                        bodyFont: { family: 'JetBrains Mono' },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                let value = context.raw;
                                const datasetLabel = context.dataset.label;
                                const index = context.dataIndex;
                                if (datasetLabel === 'Adjacency Matrix' && results[index].matrix.ram_mb < 0) {
                                    return `${datasetLabel}: N/A (Out Of Memory)`;
                                }
                                return `${datasetLabel}: ${value.toFixed(3)} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: tickColor }
                    },
                    y: {
                        type: 'logarithmic',
                        min: 0.01,
                        grid: { color: gridColor },
                        ticks: { color: tickColor },
                        title: {
                            display: true,
                            text: operation === 'ram' ? 'RAM Usage (MB)' : 'Waktu Eksekusi (ms)',
                            color: tickColor,
                            font: { family: 'Inter', size: 10, weight: '700' }
                        }
                    }
                }
            }
        });
    }

    function generateAutoAnalysis(results) {
        const box = document.getElementById('autoAnalysis');
        box.style.display = 'block';
        
        let validIndex = -1;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i].matrix.ram_mb >= 0 && results[i].list.ram_mb > 0) {
                validIndex = i;
                break;
            }
        }
        if (validIndex === -1) {
            box.innerHTML = `<strong>Analisis Otomatis:</strong> Data tidak valid.`;
            return;
        }
        
        const item = results[validIndex];
        const searchRatio = (item.list.search_us / Math.max(0.1, item.matrix.search_us)).toFixed(1);
        const ramRatio = (item.matrix.ram_mb / Math.max(0.1, item.list.ram_mb)).toFixed(1);
        const limitStr = formatNumber(item.limit);
        const lastItem = results[results.length - 1];

        let matrixOOMWarning = "";
        if (lastItem.matrix.ram_mb < 0) {
            matrixOOMWarning = `<br><br><span style="color:var(--accent-rose); font-weight:700;">⚠️ Temuan Kritis:</span> Pada dataset besar (${formatNumber(lastItem.limit)} Edges), Adjacency Matrix mengalami kegagalan alokasi memori (Out Of Memory) karena kompleksitas ruangnya $O(V^2)$. Hal ini membuktikan secara empiris bahwa Adjacency Matrix tidak skalabel untuk rute jalan berskala besar, sehingga Adjacency List ($O(V+E)$ space) wajib digunakan.`;
        }
        
        box.innerHTML = `
            <strong>Analisis Otomatis (Evaluasi pada Skala ${limitStr} Edges):</strong>
            <ul style="margin-left: 1.25rem; margin-top: 0.4rem; list-style-type: square;">
                <li><strong>Pencarian Rute (Search)</strong>: Adjacency Matrix <strong>${searchRatio}× lebih cepat</strong> dibanding Adjacency List (${formatTimeHelper(item.matrix.search_us)} vs ${formatTimeHelper(item.list.search_us)}) karena lookup kompleksitas $O(1)$ dibanding Adjacency List $O(\\text{degree})$.</li>
                <li><strong>Konsumsi RAM</strong>: Adjacency Matrix memerlukan <strong>${ramRatio}× lebih banyak RAM</strong> (${item.matrix.ram_mb.toFixed(1)} MB vs ${item.list.ram_mb.toFixed(1)} MB) akibat alokasi matriks 2D.</li>
            </ul>
            ${matrixOOMWarning}
        `;
    }

    // ===================================
    // Vis.js Graph Drawing
    // ===================================
    function drawGraphVis(data) {
        const isLight = document.body.classList.contains('light-theme');
        const nodes = new vis.DataSet(data.nodes.map(n => {
            let color = '#D8F34C'; // Yellow/Lime default
            if (n.group === 'Gudang') color = '#FF66D8';
            else if (n.group === 'Rumah') color = '#5856D6';
            else if (n.group === 'Kantor') color = '#8B5CF6';
            else if (n.group === 'Tujuan') color = '#D8F34C';

            return {
                id: n.id,
                label: n.group,
                group: n.group,
                color: {
                    background: color,
                    border: '#000000',
                    highlight: { background: '#ffffff', border: '#000000' },
                    hover: { background: color, border: '#000000' }
                },
                font: {
                    color: isLight ? '#000000' : '#ffffff',
                    size: 11,
                    face: 'Plus Jakarta Sans',
                    bold: true
                }
            };
        }));

        const edges = new vis.DataSet(data.edges.map((e, i) => {
            const lineColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';
            const highlightColor = isLight ? '#000000' : '#ffffff';
            const hoverColor = isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
            
            return {
                id: 'e' + i,
                from: e.from,
                to: e.to,
                label: e.label + ' km',
                font: { 
                    align: 'middle', 
                    color: isLight ? '#475569' : '#94a3b8', 
                    size: 10, 
                    face: 'Plus Jakarta Sans',
                    bold: true
                },
                color: { color: lineColor, highlight: highlightColor, hover: hoverColor }
            };
        }));

        const graphData = { nodes, edges };
        const options = {
            nodes: {
                shape: 'dot',
                size: 14,
                font: { 
                    color: isLight ? '#000000' : '#ffffff', 
                    size: 11, 
                    face: 'Plus Jakarta Sans',
                    bold: true
                },
                borderWidth: 3,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 6, x: 0, y: 2 }
            },
            edges: {
                width: 3.5,
                smooth: { type: 'continuous', roundness: 0.2 },
                arrows: { to: { enabled: false } }
            },
            physics: {
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -1800,
                    centralGravity: 0.35,
                    springLength: 100,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 1
                },
                stabilization: { enabled: true, iterations: 80 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                zoomView: true,
                dragView: true
            }
        };

        if (network !== null) network.destroy();
        network = new vis.Network(canvasContainer, graphData, options);

        network.once('stabilized', () => {
            network.setOptions({ physics: false });
            network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
        });

        // Click on node triggers inspector view
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = allNodes.find(n => n.id === nodeId);
                const connEdges = allEdges.filter(e => e.from === nodeId || e.to === nodeId);
                let html = `<div style="padding:0.4rem;">`;
                html += `<div style="color:var(--accent-indigo);font-weight:800;margin-bottom:0.35rem;font-size:0.78rem;">${nodeId}</div>`;
                html += `<div style="font-size:0.7rem;color:var(--text-tertiary);margin-bottom:0.5rem;">Tipe: ${node ? node.group : 'Unknown'} • Koneksi: ${connEdges.length}</div>`;
                html += `<div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;line-height:1.6;color:var(--text-secondary); max-height:100px; overflow-y:auto;">`;
                connEdges.slice(0, 10).forEach(e => {
                    const dir = e.from === nodeId ? `→ ${e.to}` : `← ${e.from}`;
                    html += `${dir} <span style="color:var(--accent-amber);">(${e.label} km)</span><br>`;
                });
                if (connEdges.length > 10) html += `<span style="color:var(--text-muted);">... +${connEdges.length - 10} lainnya</span>`;
                html += '</div></div>';
                inspectBody.innerHTML = html;
            }
        });
    }

    // ===================================
    // vis.js External Zoom Controls
    // ===================================
    document.getElementById('btnZoomIn').addEventListener('click', () => {
        if (network) network.moveTo({ scale: network.getScale() * 1.3 });
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
        if (network) network.moveTo({ scale: network.getScale() * 0.7 });
    });
    document.getElementById('btnZoomReset').addEventListener('click', () => {
        if (network) network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    });

    // ===================================
    // Dashboard Overview Chart Init
    // ===================================
    function initOverviewChart() {
        const ctx = document.getElementById('overviewChart').getContext('2d');
        const ctxCrud = document.getElementById('crudChart').getContext('2d');
        const isLight = document.body.classList.contains('light-theme');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const tickColor = isLight ? '#475569' : '#94a3b8';
        const labelColor = isLight ? '#0f172a' : '#f1f5f9';

        const commonOptions = {
            indexAxis: 'x', // Vertical bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: labelColor,
                    font: { family: 'Plus Jakarta Sans', size: 9, weight: '600' },
                    anchor: 'end',
                    align: 'top',
                    formatter: function(value, context) {
                        if (value === null || value <= 0) return '';
                        const formatted = value < 1 ? value.toFixed(3) : value.toFixed(1);
                        return formatted; // Return only the value since tracks/legends label the bars
                    }
                },
                legend: {
                    labels: { color: labelColor, font: { family: 'Inter', weight: '600' } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor }
                },
                y: {
                    type: 'logarithmic',
                    min: 0.01,
                    grid: { color: gridColor },
                    ticks: { color: tickColor },
                    title: {
                        display: true,
                        text: 'Waktu (ms) / Memori (MB)',
                        color: tickColor
                    }
                }
            }
        };

        overviewChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Load Dataset (ms)', 'RAM Terpakai (MB)'],
                datasets: []
            },
            options: commonOptions
        });

        crudChartInstance = new Chart(ctxCrud, {
            type: 'bar',
            data: {
                labels: ['Cari Lokasi (ms)', 'Cari Rute (ms)', 'Update Rute (ms)', 'Hapus Rute (ms)', 'Insert Lokasi (ms)', 'Insert Rute (ms)'],
                datasets: []
            },
            options: commonOptions
        });
    }

    function updateOverviewChart(limitLabel, struktur, insertMs, ramMb) {
        if (!overviewChartInstance) return;
        
        const mathicalColors = ['#FF66D8', '#5856D6', '#D8F34C', '#FFAD33'];
        const dsLabel = `${limitLabel} (${struktur === 'list' ? 'List' : 'Matrix'})`;
        
        let existingIndex = overviewChartInstance.data.datasets.findIndex(ds => ds.label === dsLabel);
        let datasetIndex = existingIndex !== -1 ? existingIndex : overviewChartInstance.data.datasets.length;
        let color = mathicalColors[datasetIndex % mathicalColors.length];
        
        if (existingIndex !== -1) {
            // Overwrite existing dataset
            overviewChartInstance.data.datasets[existingIndex].data = [insertMs >= 0 ? insertMs : 0, ramMb >= 0 ? ramMb : 0];
            overviewChartInstance.data.datasets[existingIndex].backgroundColor = color;
            overviewChartInstance.data.datasets[existingIndex].borderColor = '#000000';
            overviewChartInstance.data.datasets[existingIndex].borderWidth = 3;
            overviewChartInstance.data.datasets[existingIndex].borderRadius = 9999;
            overviewChartInstance.data.datasets[existingIndex].borderSkipped = false;
            overviewChartInstance.data.datasets[existingIndex].barPercentage = 0.7;
            overviewChartInstance.data.datasets[existingIndex].categoryPercentage = 0.7;
        } else {
            // Add new dataset
            overviewChartInstance.data.datasets.push({
                label: dsLabel,
                data: [insertMs >= 0 ? insertMs : 0, ramMb >= 0 ? ramMb : 0],
                backgroundColor: color,
                borderColor: '#000000',
                borderWidth: 3,
                borderRadius: 9999,
                borderSkipped: false,
                barPercentage: 0.7,
                categoryPercentage: 0.7
            });
            
            if (overviewChartInstance.data.datasets.length > 8) {
                overviewChartInstance.data.datasets.shift();
            }
        }
        
        overviewChartInstance.update();

        if (crudChartInstance) {
            let existingCrudIndex = crudChartInstance.data.datasets.findIndex(ds => ds.label === dsLabel);
            let crudDatasetIndex = existingCrudIndex !== -1 ? existingCrudIndex : crudChartInstance.data.datasets.length;
            let crudColor = mathicalColors[crudDatasetIndex % mathicalColors.length];
            
            if (existingCrudIndex !== -1) {
                // Overwrite existing dataset (clear the CRUD metrics because it's a new benchmark run)
                crudChartInstance.data.datasets[existingCrudIndex].data = [null, null, null, null, null, null];
                crudChartInstance.data.datasets[existingCrudIndex].backgroundColor = crudColor;
                crudChartInstance.data.datasets[existingCrudIndex].borderColor = '#000000';
                crudChartInstance.data.datasets[existingCrudIndex].borderWidth = 3;
                crudChartInstance.data.datasets[existingCrudIndex].borderRadius = 9999;
                crudChartInstance.data.datasets[existingCrudIndex].borderSkipped = false;
                crudChartInstance.data.datasets[existingCrudIndex].barPercentage = 0.7;
                crudChartInstance.data.datasets[existingCrudIndex].categoryPercentage = 0.7;
            } else {
                // Add new dataset
                crudChartInstance.data.datasets.push({
                    label: dsLabel,
                    data: [null, null, null, null, null, null],
                    backgroundColor: crudColor,
                    borderColor: '#000000',
                    borderWidth: 3,
                    borderRadius: 9999,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7
                });
                if (crudChartInstance.data.datasets.length > 8) {
                    crudChartInstance.data.datasets.shift();
                }
            }
            crudChartInstance.update();
        }
    }

    function updateLiveOperation(opIndex, timeUs) {
        if (!crudChartInstance || crudChartInstance.data.datasets.length === 0) return;
        const lastDataset = crudChartInstance.data.datasets[crudChartInstance.data.datasets.length - 1];
        const mappedIndex = opIndex - 2;
        lastDataset.data[mappedIndex] = timeUs / 1000.0;
        crudChartInstance.update();
    }

    // ===================================
    // Benchmark bars fallback
    // ===================================
    function updateBenchmarks(listVal, matrixVal) {
        // maintained for backwards compatibility if needed
    }

    // ===================================
    // Dynamic Dropdowns Filter helper
    // ===================================
    function setupDynamicDropdowns() {
        const populateTujuan = (asalSelect, tujuanSelect) => {
            const selectedAsal = asalSelect.value;
            tujuanSelect.innerHTML = '<option value="">— Pilih Tujuan —</option>';
            if (!selectedAsal) return;

            // Untuk pencarian/update/hapus, kita batasi ke edges yang ada
            // Tapi untuk Tambah Rute, kita izinkan menargetkan ANY node!
            let uniqueDests = [];
            if (tujuanSelect === insertBaruTujuan) {
                uniqueDests = [...new Set(allNodes.map(n => n.id))].filter(id => id !== selectedAsal).sort();
            } else {
                const dests = allEdges.filter(e => e.from === selectedAsal).map(e => e.to);
                uniqueDests = [...new Set(dests)].sort();
            }

            uniqueDests.forEach(dest => {
                const opt = document.createElement('option');
                opt.value = dest;
                opt.textContent = dest;
                tujuanSelect.appendChild(opt);
            });
        };

        searchAsal.addEventListener('change', () => populateTujuan(searchAsal, searchTujuan));
        updateAsal.addEventListener('change', () => populateTujuan(updateAsal, updateTujuan));
        deleteAsal.addEventListener('change', () => populateTujuan(deleteAsal, deleteTujuan));
        insertBaruAsal.addEventListener('change', () => populateTujuan(insertBaruAsal, insertBaruTujuan));
    }

    // ===================================
    // Top Controls Quick Search Handler
    // ===================================
    const btnQuickSearch = document.getElementById('btnQuickSearch');
    const quickSearchInput = document.getElementById('quickSearchInput');
    if (btnQuickSearch && quickSearchInput) {
        btnQuickSearch.addEventListener('click', () => {
            const query = quickSearchInput.value.trim();
            if (!query) {
                showToast("Masukkan kata kunci pencarian!", "warning");
                return;
            }
            if (!window.GraphData || !window.GraphData.isLoaded) {
                showToast("Muat dataset terlebih dahulu!", "warning");
                return;
            }
            
            // Try separating coordinates by "->", " to ", or "-"
            let parts = [];
            if (query.includes('->')) parts = query.split('->');
            else if (query.includes(' to ')) parts = query.split(' to ');
            else if (query.includes('-')) parts = query.split('-');

            if (parts.length === 2) {
                const asal = parts[0].trim();
                const tujuan = parts[1].trim();
                
                // Select in search fields
                searchAsal.value = asal;
                // Trigger change manually to populate destinations
                const changeEvent = new Event('change');
                searchAsal.dispatchEvent(changeEvent);
                
                setTimeout(() => {
                    searchTujuan.value = tujuan;
                    btnSearch.click();
                }, 150);
            } else {
                // Search single location ID
                searchLokasiInput.value = query;
                btnSearchLokasi.click();
            }
        });
        
        // Allow enter key inside search field
        quickSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnQuickSearch.click();
        });
    }

    // ===================================
    // Init System Boot
    // ===================================
    initOverviewChart();
    setupDynamicDropdowns();
    
    addLog('═══════════════════════════════════════════');
    addLog('Road Central USA — Graph Explorer v2.5');
    addLog('Layout: Dashboard Modern Sidebar Grid');
    addLog('Theme: Dual Theme (Light & Dark) Terintegrasi');
    addLog('Menunggu input... Klik "Insert Dataset" di kanan untuk memulai.');
    addLog('═══════════════════════════════════════════');
});
