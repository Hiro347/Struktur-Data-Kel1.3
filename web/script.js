// script.js — Road Central USA Graph Explorer
// Modernized Dashboard Controller with Dynamic Tab Router & Dual Theme Support

document.addEventListener('DOMContentLoaded', () => {
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

    // ===================================
    // DOM Controls & UI Elements
    // ===================================
    const btnInsertDataset = document.getElementById('btnInsertDataset');
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
    const btnDelete = document.getElementById('btnDelete');
    const btnUpdate = document.getElementById('btnUpdate');

    const searchAsal = document.getElementById('searchAsal');
    const searchTujuan = document.getElementById('searchTujuan');
    const deleteAsal = document.getElementById('deleteAsal');
    const deleteTujuan = document.getElementById('deleteTujuan');
    const updateAsal = document.getElementById('updateAsal');
    const updateTujuan = document.getElementById('updateTujuan');
    const updateJarak = document.getElementById('updateJarak');

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

    async function safeFetch(url, options = {}) {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            addLog(`[-] Server tidak merespons: ${url}`);
            showToast("C++ Server offline. Menggunakan fallback lokal.", "warning");
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
    });

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
                chart.update('none');
            }
        };
        updateConfig(myChart);
        updateConfig(overviewChartInstance);
    }

    // ===================================
    // Structure Selection Toggles
    // ===================================
    const handleStructSelect = (type) => {
        currentStruktur = type;
        if (type === 'list') {
            toggleListBtn.classList.add('active');
            toggleMatrixBtn.classList.remove('active');
            addLog('Struktur Aktif → Adjacency List (Memori efisien O(V+E))');
        } else {
            toggleMatrixBtn.classList.add('active');
            toggleListBtn.classList.remove('active');
            addLog('Struktur Aktif → Adjacency Matrix (Lookup cepat O(1))');
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
    modalCancel.addEventListener('click', closeModal);
    datasetModal.addEventListener('click', (e) => { if (e.target === datasetModal) closeModal(); });

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
                    body: JSON.stringify({ limit: benchmarkLimit, struktur: currentStruktur })
                });
                if (benchRes && benchRes.ok) {
                    benchData = await benchRes.json();
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
            statusText.textContent = `Dataset Aktif — ${limitLabel}`;
            statusText.style.color = 'var(--accent-emerald)';

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
            lastOpTimeVal.textContent = lastTimeUs > 0 ? `${lastTimeUs.toFixed(0)} µs` : '—';

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
            if (currentStruktur === 'list') {
                updateOverviewChart(benchData.waktu_ms, null, benchData.ram_mb, null);
            } else {
                updateOverviewChart(null, benchData.waktu_ms, null, benchData.ram_mb);
            }

            addLog(`[+] Sukses memproses dataset! Waktu: ${benchData.waktu_ms.toFixed(2)} ms, RAM: ${benchData.ram_mb.toFixed(2)} MB`);
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
        const uniqueSources = [...new Set(allEdges.map(e => e.from))].sort();

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

        searchTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
        updateTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
        deleteTujuan.innerHTML = '<option value="">— Pilih Asal Dulu —</option>';
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

        addLog(`Mencari rute: ${asal} → ${tujuan}...`);
        const t0 = performance.now();

        const found = allEdges.find(e => e.from === asal && e.to === tujuan);
        const t1 = performance.now();
        const timeUs = (t1 - t0) * 1000;
        lastOpTimeVal.textContent = `${timeUs.toFixed(1)} µs`;

        if (found) {
            addLog(`[+] Rute DITEMUKAN! Jarak: ${found.label} km | Waktu: ${timeUs.toFixed(1)} µs`);
            showToast(`Rute ditemukan: Jarak ${found.label} km`, 'success');

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

        addLog(`Mengupdate rute: ${asal} → ${tujuan} menjadi ${jarak} km...`);

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
            lastOpTimeVal.textContent = `${timeUs.toFixed(0)} µs`;

            addLog(`[+] Rute ${asal} → ${tujuan} diupdate menjadi ${jarak} km | Waktu: ${timeUs.toFixed(0)} µs`);
            showToast("Rute berhasil diupdate!", "success");
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

        addLog(`Menghapus rute: ${asal} → ${tujuan}...`);
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
            lastOpTimeVal.textContent = `${timeUs.toFixed(1)} µs`;

            addLog(`[+] Rute ${asal} → ${tujuan} berhasil DIHAPUS! | Waktu: ${timeUs.toFixed(1)} µs`);
            showToast(`Rute berhasil dihapus`, 'success');

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
                        backgroundColor: 'rgba(129, 140, 248, 0.65)',
                        borderColor: '#818cf8',
                        borderWidth: 1.5,
                        borderRadius: 5
                    },
                    {
                        label: 'Adjacency Matrix',
                        data: matrixData,
                        backgroundColor: 'rgba(34, 211, 238, 0.65)',
                        borderColor: '#22d3ee',
                        borderWidth: 1.5,
                        borderRadius: 5
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                parsing: false,
                normalized: true,
                plugins: {
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
                        type: 'logarithmic',
                        grid: { color: gridColor },
                        ticks: { color: tickColor },
                        title: {
                            display: true,
                            text: operation === 'ram' ? 'RAM Usage (MB)' : 'Waktu Eksekusi (ms)',
                            color: tickColor,
                            font: { family: 'Inter', size: 10, weight: '700' }
                        }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: tickColor }
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
                <li><strong>Pencarian Rute (Search)</strong>: Adjacency Matrix <strong>${searchRatio}× lebih cepat</strong> dibanding Adjacency List (${item.matrix.search_us.toFixed(2)} µs vs ${item.list.search_us.toFixed(2)} µs) karena lookup kompleksitas $O(1)$ dibanding Adjacency List $O(\\text{degree})$.</li>
                <li><strong>Konsumsi RAM</strong>: Adjacency Matrix memerlukan <strong>${ramRatio}× lebih banyak RAM</strong> (${item.matrix.ram_mb.toFixed(1)} MB vs ${item.list.ram_mb.toFixed(1)} MB) akibat alokasi matriks 2D.</li>
            </ul>
            ${matrixOOMWarning}
        `;
    }

    // ===================================
    // Vis.js Graph Drawing
    // ===================================
    function drawGraphVis(data) {
        const nodes = new vis.DataSet(data.nodes.map(n => {
            let color = '#818cf8';
            if (n.group === 'Gudang') color = '#fbbf24';
            else if (n.group === 'Tujuan') color = '#34d399';
            else if (n.group === 'Rumah') color = '#3b82f6';
            else if (n.group === 'Kantor') color = '#a78bfa';

            return {
                id: n.id,
                label: n.id.replace('Lokasi_', 'N-') + '\n' + n.group,
                group: n.group,
                color: {
                    background: color,
                    border: 'rgba(255,255,255,0.3)',
                    highlight: { background: '#fff', border: color },
                    hover: { background: color, border: '#fff' }
                }
            };
        }));

        const edges = new vis.DataSet(data.edges.map((e, i) => ({
            id: 'e' + i,
            from: e.from,
            to: e.to,
            label: e.label + ' km',
            font: { align: 'middle', color: 'rgba(148, 163, 184, 0.65)', size: 9, face: 'Inter' },
            color: { color: 'rgba(129, 140, 248, 0.15)', highlight: '#818cf8', hover: 'rgba(129, 140, 248, 0.4)' }
        })));

        const graphData = { nodes, edges };
        const options = {
            nodes: {
                shape: 'dot',
                size: 11,
                font: { color: 'rgba(255,255,255,0.85)', size: 9, face: 'Inter' },
                borderWidth: 1.5,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 6, x: 0, y: 2 }
            },
            edges: {
                width: 1.5,
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
        const isLight = document.body.classList.contains('light-theme');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const tickColor = isLight ? '#475569' : '#94a3b8';
        const labelColor = isLight ? '#0f172a' : '#f1f5f9';

        overviewChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Insert Time (ms)', 'RAM Allocation (MB)'],
                datasets: [
                    {
                        label: 'Adjacency List',
                        data: [0, 0],
                        backgroundColor: 'rgba(129, 140, 248, 0.7)',
                        borderColor: '#818cf8',
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: 'Adjacency Matrix',
                        data: [0, 0],
                        backgroundColor: 'rgba(34, 211, 238, 0.7)',
                        borderColor: '#22d3ee',
                        borderWidth: 1.5,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: labelColor, font: { family: 'Inter', weight: '600' } }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        grid: { color: gridColor },
                        ticks: { color: tickColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: tickColor }
                    }
                }
            }
        });
    }

    function updateOverviewChart(listInsertMs, matrixInsertMs, listRamMb, matrixRamMb) {
        if (!overviewChartInstance) return;
        if (listInsertMs !== null && listRamMb !== null) {
            overviewChartInstance.data.datasets[0].data = [listInsertMs, listRamMb];
        }
        if (matrixInsertMs !== null && matrixRamMb !== null) {
            overviewChartInstance.data.datasets[1].data = [matrixInsertMs >= 0 ? matrixInsertMs : 0, matrixRamMb >= 0 ? matrixRamMb : 0];
        }
        overviewChartInstance.update();
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

            const dests = allEdges
                .filter(e => e.from === selectedAsal)
                .map(e => e.to);
            const uniqueDests = [...new Set(dests)].sort();

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
