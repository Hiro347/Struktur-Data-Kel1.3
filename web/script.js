// script.js — Road Central USA Graph Explorer
// Fully interactive dashboard with dataset size selection matching CLI

document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // DOM References
    // ===================================
    const btnInsertDataset = document.getElementById('btnInsertDataset');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toast = document.getElementById('toast');

    const toggleListBtn = document.getElementById('toggleListBtn');
    const toggleMatrixBtn = document.getElementById('toggleMatrixBtn');

    const consoleLog = document.getElementById('consoleLog');
    const canvasContainer = document.getElementById('graphCanvas');

    // Stats
    const statNodes = document.getElementById('statActiveNodes');
    const statEdges = document.getElementById('statActiveEdges');
    const statMemory = document.getElementById('statMemoryEst');
    const inspectBody = document.getElementById('inspectBody');
    const tableBody = document.getElementById('tableBody');

    // Benchmarks
    const timeListVal = document.getElementById('timeListVal');
    const timeMatrixVal = document.getElementById('timeMatrixVal');
    const barListFill = document.getElementById('barListFill');
    const barMatrixFill = document.getElementById('barMatrixFill');

    // Pagination
    const pageInfo = document.getElementById('pageInfo');
    const pagePrev = document.getElementById('pagePrev');
    const pageNext = document.getElementById('pageNext');

    // Table Search
    const tableSearch = document.getElementById('tableSearch');

    // Modal
    const datasetModal = document.getElementById('datasetModal');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const datasetOptions = document.querySelectorAll('.dataset-option');
    const vizLimitSlider = document.getElementById('vizLimitSlider');
    const vizLimitValue = document.getElementById('vizLimitValue');

    // Search & Delete
    const btnSearch = document.getElementById('btnSearch');
    const btnDelete = document.getElementById('btnDelete');
    const searchAsal = document.getElementById('searchAsal');
    const searchTujuan = document.getElementById('searchTujuan');
    const deleteAsal = document.getElementById('deleteAsal');
    const deleteTujuan = document.getElementById('deleteTujuan');

    // Update (NEW)
    const updateAsal = document.getElementById('updateAsal');
    const updateTujuan = document.getElementById('updateTujuan');
    const updateJarak = document.getElementById('updateJarak');
    const btnUpdate = document.getElementById('btnUpdate');

    // Benchmark comparison (NEW)
    const btnRunFullBenchmark = document.getElementById('btnRunFullBenchmark');
    const benchmarkStatus = document.getElementById('benchmarkStatus');
    const chartTabs = document.getElementById('chartTabs');

    // Visual sample badge (NEW)
    const sampleBadge = document.getElementById('sampleBadge');
    const displayedEdges = document.getElementById('displayedEdges');
    const totalEdges = document.getElementById('totalEdges');

    // ===================================
    // State
    // ===================================
    let currentStruktur = 'list';
    let network = null;
    let selectedDatasetLimit = null;
    let allEdges = [];
    let allNodes = [];
    let currentPage = 1;
    const ROWS_PER_PAGE = 20;
    let filteredEdges = [];
    
    // Chart.js state (NEW)
    let myChart = null;
    let currentChartOp = 'insert';

    // ===================================
    // Helpers
    // ===================================
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    function addLog(message) {
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
        consoleLog.textContent += `[${time}] ${message}\n`;
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    // safeFetch with timeout (NEW)
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
            showToast("C++ Server offline. Menggunakan data fallback.", "error");
            return null; // caller should handle null
        }
    }

    // ===================================
    // Structure Toggle
    // ===================================
    toggleListBtn.addEventListener('click', () => {
        toggleListBtn.classList.add('active');
        toggleMatrixBtn.classList.remove('active');
        currentStruktur = 'list';
        addLog('Struktur Data → Adjacency List (O(V+E) space, O(deg) lookup)');
    });
    toggleMatrixBtn.addEventListener('click', () => {
        toggleMatrixBtn.classList.add('active');
        toggleListBtn.classList.remove('active');
        currentStruktur = 'matrix';
        addLog('Struktur Data → Adjacency Matrix (O(V²) space, O(1) lookup)');
    });

    // ===================================
    // Modal: Dataset Selector
    // ===================================
    function openModal() {
        datasetModal.classList.add('visible');
    }
    function closeModal() {
        datasetModal.classList.remove('visible');
    }

    btnInsertDataset.addEventListener('click', () => {
        openModal();
    });

    modalCancel.addEventListener('click', closeModal);

    // Close modal on backdrop click
    datasetModal.addEventListener('click', (e) => {
        if (e.target === datasetModal) closeModal();
    });

    // Dataset option selection
    datasetOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            datasetOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedDatasetLimit = opt.getAttribute('data-limit');
            modalConfirm.disabled = false;
        });
    });

    // Viz limit slider
    vizLimitSlider.addEventListener('input', () => {
        vizLimitValue.textContent = vizLimitSlider.value;
    });

    // ===================================
    // LOAD DATASET (Main Flow)
    // ===================================
    modalConfirm.addEventListener('click', async () => {
        if (!selectedDatasetLimit) return;
        closeModal();

        const vizLimit = parseInt(vizLimitSlider.value);
        const isCSV = selectedDatasetLimit === 'csv';
        const benchmarkLimit = isCSV ? 0 : parseInt(selectedDatasetLimit);
        const limitLabel = isCSV ? 'CSV Dummy' : formatNumber(benchmarkLimit) + ' Edges';

        // Update button state
        btnInsertDataset.disabled = true;
        btnInsertDataset.innerHTML = '<span class="spinner"></span> Memuat Dataset...';

        addLog(`═══════════════════════════════════════════`);
        addLog(`=== INSERT DATASET (${limitLabel}) ===`);
        addLog(`Struktur: ${currentStruktur === 'list' ? 'Adjacency List' : 'Adjacency Matrix'}`);
        addLog(`Meminta data dari C++ Server...`);

        try {
            // 1. Fetch Animation Data (visual edges)
            const animLimit = isCSV ? vizLimit : Math.min(vizLimit, benchmarkLimit || vizLimit);
            const animRes = await safeFetch(`/api/animasi?limit=${animLimit}`);
            if (!animRes || !animRes.ok) throw new Error('Server animasi tidak merespons');
            const animData = await animRes.json();

            addLog(`[+] Data visual diterima: ${animData.nodes.length} Node, ${animData.edges.length} Edge`);

            // 2. Fetch Benchmark Data
            let benchData = { waktu_ms: 0, ram_mb: 0 };
            if (!isCSV && benchmarkLimit > 0) {
                addLog(`Menjalankan INSERT ${formatNumber(benchmarkLimit)} Rute ke ${currentStruktur}...`);
                const benchRes = await safeFetch('/api/benchmark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: benchmarkLimit, struktur: currentStruktur })
                });
                if (benchRes && benchRes.ok) {
                    benchData = await benchRes.json();
                }
            }

            // Store data
            allNodes = animData.nodes;
            allEdges = animData.edges;
            filteredEdges = [...allEdges];

            if (!window.GraphData) window.GraphData = {};
            window.GraphData.isLoaded = true;

            // 3. Update UI Status
            statusDot.classList.add('active');
            statusText.textContent = `Dataset Aktif — ${limitLabel}`;
            statusText.style.color = 'var(--accent-emerald)';

            btnInsertDataset.innerHTML = `
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Dataset Dimuat ✓
            `;
            btnInsertDataset.disabled = false;

            // Update sample warning badge
            sampleBadge.style.display = 'flex';
            displayedEdges.textContent = animData.edges.length;
            totalEdges.textContent = isCSV ? animData.edges.length : formatNumber(benchmarkLimit);

            // 4. Update Stats
            const totalNodes = isCSV ? animData.nodes.length : benchmarkLimit;
            const totalEdgesVal = isCSV ? animData.edges.length : benchmarkLimit;
            statNodes.textContent = formatNumber(animData.nodes.length);
            statEdges.textContent = formatNumber(totalEdgesVal);
            statMemory.textContent = benchData.ram_mb > 0 ? `~${benchData.ram_mb.toFixed(2)} MB` : '—';

            // 5. Populate Table
            currentPage = 1;
            renderTable();

            // 6. Populate Selectors
            populateSelectors(animData.nodes);

            // 7. Inspector
            renderInspector(animData);

            // 8. Draw Graph
            drawGraphVis(animData);

            // 9. Benchmark bars
            if (benchData.waktu_ms > 0) {
                const timeUs = benchData.waktu_ms * 1000;
                if (currentStruktur === 'list') {
                    updateBenchmarks(timeUs, 0);
                } else {
                    updateBenchmarks(0, timeUs);
                }
            }

            // 10. Log completion
            addLog(`[+] Selesai! Waktu: ${benchData.waktu_ms.toFixed(2)} ms, RAM: ${benchData.ram_mb.toFixed(2)} MB`);
            addLog(`[+] Visualisasi: ${animData.nodes.length} node, ${animData.edges.length} edge ditampilkan`);
            addLog(`═══════════════════════════════════════════`);

            showToast(`Dataset ${limitLabel} berhasil dimuat!`, 'success');

        } catch (error) {
            console.error(error);
            showToast('Error: C++ Server tidak merespons!', 'error');
            addLog(`[-] ERROR: ${error.message}`);
            btnInsertDataset.innerHTML = 'Coba Lagi';
            btnInsertDataset.disabled = false;
        }
    });

    // ===================================
    // Table Rendering with Pagination
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
                    <td style="font-family:'JetBrains Mono',monospace;color:var(--text-tertiary);font-size:0.78rem;">R-${start + i + 1}</td>
                    <td>${e.from}</td>
                    <td>${e.to}</td>
                    <td style="font-family:'JetBrains Mono',monospace;font-weight:500;">${e.label}</td>
                </tr>`;
            });
        }

        tableBody.innerHTML = html;
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (${filteredEdges.length} rute)`;
        pagePrev.disabled = currentPage <= 1;
        pageNext.disabled = currentPage >= totalPages;
    }

    pagePrev.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });
    pageNext.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredEdges.length / ROWS_PER_PAGE);
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // Table search
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
    // Selector Population
    // ===================================
    function populateSelectors(nodes) {
        const selectors = [searchAsal, searchTujuan, deleteAsal, deleteTujuan, updateAsal, updateTujuan];
        selectors.forEach(sel => {
            sel.innerHTML = '<option value="">— Pilih —</option>';
            nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id;
                opt.textContent = n.id;
                sel.appendChild(opt);
            });
        });
    }

    // ===================================
    // Inspector Panel
    // ===================================
    function renderInspector(data) {
        let html = '<div style="padding: 0.75rem;">';
        html += `<div style="color:var(--accent-indigo);font-weight:600;margin-bottom:0.5rem;font-size:0.82rem;">📊 Data Preview</div>`;
        html += `<div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;line-height:1.8;color:var(--text-secondary);">`;

        const maxShow = Math.min(15, data.edges.length);
        for (let i = 0; i < maxShow; i++) {
            const e = data.edges[i];
            html += `<span style="color:var(--text-muted);">[${i}]</span> "${e.from}" <span style="color:var(--accent-indigo);">→</span> "${e.to}" <span style="color:var(--accent-amber);">(${e.label})</span><br>`;
        }
        if (data.edges.length > maxShow) {
            html += `<br><span style="color:var(--text-muted);">... +${data.edges.length - maxShow} rute lainnya</span>`;
        }
        html += '</div></div>';
        inspectBody.innerHTML = html;
    }

    // ===================================
    // Search Route
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

        // Search in local data
        const found = allEdges.find(e => e.from === asal && e.to === tujuan);
        if (found) {
            addLog(`[+] Rute DITEMUKAN! Jarak: ${found.label}`);
            showToast(`Rute ditemukan: ${asal} → ${tujuan} (Jarak: ${found.label})`, 'success');

            // Highlight in graph
            if (network) {
                network.selectNodes([asal, tujuan]);
                network.focus(asal, { scale: 1.5, animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
            }
        } else {
            addLog(`[-] Rute TIDAK ditemukan: ${asal} → ${tujuan}`);
            showToast(`Rute ${asal} → ${tujuan} tidak ditemukan`, 'error');
        }
    });

    // ===================================
    // Delete Route
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

        const idx = allEdges.findIndex(e => e.from === asal && e.to === tujuan);
        if (idx !== -1) {
            allEdges.splice(idx, 1);
            filteredEdges = [...allEdges];
            currentPage = 1;
            renderTable();
            statEdges.textContent = formatNumber(allEdges.length);

            addLog(`[+] Rute ${asal} → ${tujuan} berhasil DIHAPUS!`);
            showToast(`Rute ${asal} → ${tujuan} dihapus`, 'success');

            // Redraw graph
            drawGraphVis({ nodes: allNodes, edges: allEdges });
        } else {
            addLog(`[-] Rute TIDAK ditemukan: ${asal} → ${tujuan}`);
            showToast(`Rute tidak ditemukan`, 'error');
        }
    });

    // ===================================
    // Update Route (NEW)
    // ===================================
    btnUpdate.addEventListener('click', async () => {
        const asal = updateAsal.value;
        const tujuan = updateTujuan.value;
        const jarak = updateJarak.value;
        if (!asal || !tujuan || !jarak) {
            showToast('Pilih lokasi asal, tujuan, dan masukkan jarak baru!', 'error');
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

        // Update locally in JS
        const edge = allEdges.find(e => e.from === asal && e.to === tujuan);
        if (edge) {
            edge.label = parseFloat(jarak).toString();
            filteredEdges = [...allEdges];
            renderTable();
            drawGraphVis({ nodes: allNodes, edges: allEdges });

            // update benchmarks bar
            const timeUs = data.waktu_us;
            if (currentStruktur === 'list') {
                updateBenchmarks(timeUs, 0);
            } else {
                updateBenchmarks(0, timeUs);
            }

            addLog(`[+] Rute ${asal} → ${tujuan} diupdate menjadi ${jarak} km | Waktu: ${timeUs.toFixed(0)} µs`);
            showToast("Rute berhasil diupdate!", "success");
        } else {
            addLog(`[-] Rute tidak ditemukan di visualisasi: ${asal} → ${tujuan}`);
            showToast("Rute tidak ditemukan di visualisasi", "error");
        }
    });

    // ===================================
    // Benchmark Comparison (NEW)
    // ===================================
    btnRunFullBenchmark.addEventListener('click', async () => {
        benchmarkStatus.innerHTML = '<span class="spinner"></span> Menjalankan...';
        addLog("Menjalankan full benchmark 4 ukuran dataset (100K, 500K, 1M, 5M)...");
        
        let results = null;
        const res = await safeFetch('/api/full-benchmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limits: [100000, 500000, 1000000, 5000000] })
        });
        
        if (res && res.ok) {
            results = await res.json();
            benchmarkStatus.textContent = 'Status: Selesai';
            showToast("Full benchmark berhasil dijalankan!", "success");
            addLog("[+] Full benchmark selesai. Hasil diekspor ke backend.");
        } else {
            addLog("[-] Gagal memanggil C++ server benchmark. Mencoba memuat file fallback...");
            const fallbackRes = await fetch('./benchmark_results.json').catch(() => null);
            if (fallbackRes && fallbackRes.ok) {
                results = await fallbackRes.json();
                benchmarkStatus.textContent = 'Status: Dimuat (Fallback Offline)';
                showToast("Menggunakan data benchmark fallback (offline).", "warning");
                addLog("[+] Berhasil memuat data benchmark statis lokal.");
            } else {
                benchmarkStatus.textContent = 'Status: Gagal memuat data';
                showToast("Gagal memuat data benchmark.", "error");
                return;
            }
        }
        
        window.fullBenchmarkResults = results;
        renderComparisonChart(results, currentChartOp);
        generateAutoAnalysis(results);
    });

    // Chart.js rendering & tab controls
    const tabButtons = document.querySelectorAll('#chartTabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartOp = btn.getAttribute('data-op');
            
            if (window.fullBenchmarkResults) {
                renderComparisonChart(window.fullBenchmarkResults, currentChartOp);
            } else {
                showToast("Jalankan benchmark terlebih dahulu!", "info");
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

        if (myChart) {
            myChart.destroy();
        }

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
                        borderRadius: 6
                    },
                    {
                        label: 'Adjacency Matrix',
                        data: matrixData,
                        backgroundColor: 'rgba(34, 211, 238, 0.65)',
                        borderColor: '#22d3ee',
                        borderWidth: 1.5,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: 'Inter', weight: '600' } }
                    },
                    tooltip: {
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
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' },
                        title: {
                            display: true,
                            text: operation === 'ram' ? 'RAM Usage (MB)' : 'Waktu Eksekusi (ms)',
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11, weight: '600' }
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
            box.innerHTML = `<strong>Analisis Otomatis:</strong> Data benchmark tidak cukup valid.`;
            return;
        }
        
        const item = results[validIndex];
        const searchRatio = (item.list.search_us / Math.max(0.1, item.matrix.search_us)).toFixed(1);
        const ramRatio = (item.matrix.ram_mb / Math.max(0.1, item.list.ram_mb)).toFixed(1);
        const limitStr = formatNumber(item.limit);

        const lastItem = results[results.length - 1];
        let matrixOOMWarning = "";
        if (lastItem.matrix.ram_mb < 0) {
            matrixOOMWarning = `<br><br><span style="color:var(--accent-rose); font-weight:700;">⚠️ Temuan Analisis Kritis:</span> Pada dataset besar (${formatNumber(lastItem.limit)} Edges), Adjacency Matrix mengalami kegagalan alokasi memori (Out Of Memory) karena kompleksitas ruangnya yang bernilai $O(V^2)$. Ini membuktikan secara empiris bahwa Adjacency Matrix tidak skalabel untuk jaringan jalan berskala besar seperti Central USA, dan Adjacency List ($O(V+E)$ space) adalah pilihan yang wajib digunakan.`;
        }
        
        box.innerHTML = `
            <strong>Analisis Otomatis (Evaluasi pada Skala ${limitStr} Edges):</strong>
            <ul style="margin-left: 1.25rem; margin-top: 0.5rem;">
                <li><strong>Pencarian Rute (Search)</strong>: Adjacency Matrix <strong>${searchRatio}× lebih cepat</strong> dibanding Adjacency List (${item.matrix.search_us.toFixed(2)} µs vs ${item.list.search_us.toFixed(2)} µs) karena lookup kompleksitas konstan $O(1)$ dibanding Adjacency List yang bernilai $O(\\text{degree})$.</li>
                <li><strong>Konsumsi Memori (RAM)</strong>: Adjacency Matrix membutuhkan <strong>${ramRatio}× lebih banyak RAM</strong> (${item.matrix.ram_mb.toFixed(1)} MB vs ${item.list.ram_mb.toFixed(1)} MB) akibat alokasi matriks 2D.</li>
            </ul>
            ${matrixOOMWarning}
        `;
    }

    // ===================================
    // Vis.js Graph Drawing
    // ===================================
    function drawGraphVis(data) {
        const nodes = new vis.DataSet(data.nodes.map(n => {
            let color = '#818cf8'; // default road
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
            label: e.label,
            font: { align: 'middle', color: 'rgba(148, 163, 184, 0.6)', size: 9, face: 'Inter' },
            color: { color: 'rgba(129, 140, 248, 0.15)', highlight: '#818cf8', hover: 'rgba(129, 140, 248, 0.4)' }
        })));

        const graphData = { nodes, edges };

        const options = {
            nodes: {
                shape: 'dot',
                size: 12,
                font: { color: 'rgba(255,255,255,0.85)', size: 10, face: 'Inter' },
                borderWidth: 1.5,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 8, x: 0, y: 2 }
            },
            edges: {
                width: 1.5,
                smooth: { type: 'continuous', roundness: 0.2 },
                arrows: { to: { enabled: false } }
            },
            physics: {
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 120,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 1
                },
                stabilization: { enabled: true, iterations: 100 }
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
            network.fit({
                animation: {
                    duration: 800,
                    easingFunction: 'easeInOutQuad'
                }
            });
        });

        // Node click → inspector detail
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = allNodes.find(n => n.id === nodeId);
                const connEdges = allEdges.filter(e => e.from === nodeId || e.to === nodeId);
                let html = `<div style="padding:0.75rem;">`;
                html += `<div style="color:var(--accent-indigo);font-weight:700;margin-bottom:0.5rem;">${nodeId}</div>`;
                html += `<div style="font-size:0.75rem;color:var(--text-tertiary);margin-bottom:0.5rem;">Tipe: ${node ? node.group : 'Unknown'} • Koneksi: ${connEdges.length}</div>`;
                html += `<div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;line-height:1.8;color:var(--text-secondary);">`;
                connEdges.slice(0, 10).forEach(e => {
                    const dir = e.from === nodeId ? `→ ${e.to}` : `← ${e.from}`;
                    html += `${dir} <span style="color:var(--accent-amber);">(${e.label})</span><br>`;
                });
                if (connEdges.length > 10) html += `<span style="color:var(--text-muted);">... +${connEdges.length - 10} lainnya</span>`;
                html += '</div></div>';
                inspectBody.innerHTML = html;
            }
        });
    }

    // ===================================
    // Benchmark Bars
    // ===================================
    function updateBenchmarks(listVal, matrixVal) {
        if (listVal > 0) timeListVal.textContent = `${listVal.toFixed(0)} µs`;
        if (matrixVal > 0) timeMatrixVal.textContent = `${matrixVal.toFixed(0)} µs`;

        const lv = parseFloat(timeListVal.textContent) || 0;
        const mv = parseFloat(timeMatrixVal.textContent) || 0;
        const max = Math.max(lv, mv, 1) * 1.2;

        barListFill.style.width = `${(lv / max) * 100}%`;
        barMatrixFill.style.width = `${(mv / max) * 100}%`;
    }

    // ===================================
    // Global functions for zoom controls
    // ===================================
    window.zoomIn = () => { if (network) network.moveTo({ scale: network.getScale() * 1.3 }); };
    window.zoomOut = () => { if (network) network.moveTo({ scale: network.getScale() * 0.7 }); };
    window.resetZoom = () => { if (network) network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } }); };

    // ===================================
    // Init
    // ===================================
    addLog('═══════════════════════════════════════════');
    addLog('Road Central USA — Graph Explorer v2.0');
    addLog('Dataset: DIMACS Road Network');
    addLog('Menunggu perintah... Klik "Insert Dataset" untuk mulai.');
    addLog('═══════════════════════════════════════════');
});
