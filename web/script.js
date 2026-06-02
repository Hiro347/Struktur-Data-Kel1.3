// script.js - Main logic and UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const btnInsertDataset = document.getElementById('btnInsertDataset');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toast = document.getElementById('toast');
    
    const toggleListBtn = document.getElementById('toggleListBtn');
    const toggleMatrixBtn = document.getElementById('toggleMatrixBtn');
    
    const consoleLog = document.getElementById('consoleLog');
    
    const canvasContainer = document.getElementById('graphCanvas');
    
    // Stats elements
    const statNodes = document.getElementById('statActiveNodes');
    const statEdges = document.getElementById('statActiveEdges');
    const statMemory = document.getElementById('statMemoryEst');
    const inspectBody = document.getElementById('inspectBody');
    const tableBody = document.getElementById('tableBody');
    
    // Benchmark elements
    const timeListVal = document.getElementById('timeListVal');
    const timeMatrixVal = document.getElementById('timeMatrixVal');
    const barListFill = document.getElementById('barListFill');
    const barMatrixFill = document.getElementById('barMatrixFill');

    let currentStruktur = 'list';
    let network = null;

    // === Helpers ===
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    function addLog(message) {
        const time = new Date().toLocaleTimeString('it-IT');
        consoleLog.textContent += `[${time}] ${message}\n`;
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    // === Event Listeners ===
    
    // Data Structure Toggle
    toggleListBtn.addEventListener('click', () => {
        toggleListBtn.classList.add('active');
        toggleMatrixBtn.classList.remove('active');
        currentStruktur = 'list';
        addLog("Data Structure Switched -> Adjacency List O(V+E)");
    });
    toggleMatrixBtn.addEventListener('click', () => {
        toggleMatrixBtn.classList.add('active');
        toggleListBtn.classList.remove('active');
        currentStruktur = 'matrix';
        addLog("Data Structure Switched -> Adjacency Matrix O(1)");
    });

    // Load Dataset (Fetch from C++ API)
    btnInsertDataset.addEventListener('click', async () => {
        if (window.GraphData && window.GraphData.isLoaded) {
            showToast("Dataset sudah dimuat sebelumnya.");
            return;
        }
        
        btnInsertDataset.disabled = true;
        btnInsertDataset.innerHTML = 'Memuat Data C++...';
        addLog("Meminta data animasi dari Server C++...");
        
        try {
            // 1. Fetch Animation Data (500 Edges)
            const animRes = await fetch('/api/animasi');
            const animData = await animRes.json();
            
            // 2. Fetch Benchmark Data (e.g., 100k edges)
            addLog(`Menjalankan Insert 100.000 Rute di C++ dengan ${currentStruktur}...`);
            const benchRes = await fetch('/api/benchmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 100000, struktur: currentStruktur })
            });
            const benchData = await benchRes.json();
            
            if(!window.GraphData) window.GraphData = {};
            window.GraphData.isLoaded = true;
            
            // Update UI Status
            statusDot.classList.add('active');
            statusText.textContent = `Dataset Aktif (${animData.nodes.length} Node, ${animData.edges.length} Edge Visual)`;
            statusText.style.color = "var(--color-success)";
            
            btnInsertDataset.innerHTML = 'Dataset Dimuat ✓';
            
            // Update Stats
            statNodes.textContent = "100K+";
            statEdges.textContent = "100K+";
            statMemory.textContent = `~${benchData.ram_mb.toFixed(2)} MB`;
            
            // Populate Table (Sample from animData)
            let tableHTML = "";
            let inspectHTML = `<div style="padding: 1rem;"><div style="color: var(--color-primary); margin-bottom: 0.5rem; font-family: 'Fira Code', monospace; font-size: 0.8rem;">`;
            
            for(let i = 0; i < Math.min(10, animData.edges.length); i++) {
                const e = animData.edges[i];
                tableHTML += `<tr><td>R-${i+1}</td><td>${e.from}</td><td>${e.to}</td><td>${e.label}</td></tr>`;
                inspectHTML += `[${i}] "${e.from}" -> "${e.to}"<br>`;
            }
            inspectHTML += `... (${animData.edges.length - 10} rute hidden)</div></div>`;
            
            tableBody.innerHTML = tableHTML;
            inspectBody.innerHTML = inspectHTML;
            
            showToast("Dataset DIMACS berhasil dimuat!");
            addLog(`Selesai! Waktu: ${benchData.waktu_ms.toFixed(2)} ms. RAM Naik: ${benchData.ram_mb.toFixed(2)} MB`);
            
            drawGraphVis(animData);
            
            // Update performance bars (convert ms to us for the UI label)
            let timeUs = benchData.waktu_ms * 1000;
            if (currentStruktur === 'list') {
                updateBenchmarks(timeUs, 0); 
            } else {
                updateBenchmarks(0, timeUs);
            }
            
            btnInsertDataset.disabled = false;
        } catch (error) {
            console.error(error);
            showToast("Error menghubungi C++ Server!");
            addLog("[-] ERROR: C++ Server tidak merespons.");
            btnInsertDataset.innerHTML = 'Coba Lagi';
            btnInsertDataset.disabled = false;
        }
    });

    // === Visualizer (Vis.js) ===
    function drawGraphVis(data) {
        const nodes = new vis.DataSet(data.nodes.map(n => {
            let color = '#58a6ff'; 
            if (n.group === 'Rumah') color = '#3b82f6';
            else if (n.group === 'Kantor') color = '#a855f7';
            else if (n.group === 'Gudang') color = '#f59e0b';
            else if (n.group === 'Tujuan') color = '#10b981';
            
            return {
                id: n.id,
                label: n.id.replace("Lokasi_", "Loc ") + '\n(' + n.group + ')',
                group: n.group,
                color: { background: color, border: '#ffffff' }
            };
        }));

        const edges = new vis.DataSet(data.edges.map(e => ({
            from: e.from,
            to: e.to,
            label: e.label,
            font: { align: 'middle', color: '#cbd5e1', size: 10 },
            color: { color: 'rgba(255, 255, 255, 0.2)', highlight: '#00ff00' }
        })));

        const graphData = { nodes, edges };
        
        const options = {
            nodes: {
                shape: 'dot',
                size: 15,
                font: { color: '#ffffff', size: 12, face: 'Inter' },
                borderWidth: 2,
                shadow: true
            },
            edges: {
                width: 2,
                smooth: { type: 'continuous' }
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -26,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 150 }
            }
        };

        if (network !== null) { network.destroy(); }
        network = new vis.Network(canvasContainer, graphData, options);
    }

    function updateBenchmarks(listVal, matrixVal) {
        if(listVal > 0) timeListVal.textContent = `${listVal.toFixed(0)} µs`;
        if(matrixVal > 0) timeMatrixVal.textContent = `${matrixVal.toFixed(0)} µs`;
        
        const currentListStr = timeListVal.textContent.replace(' µs', '');
        const currentMatrixStr = timeMatrixVal.textContent.replace(' µs', '');
        const currentListVal = parseFloat(currentListStr) || 0;
        const currentMatrixVal = parseFloat(currentMatrixStr) || 0;

        const max = Math.max(currentListVal, currentMatrixVal, 1) * 1.2;
        barListFill.style.width = `${(currentListVal / max) * 100}%`;
        barMatrixFill.style.width = `${(currentMatrixVal / max) * 100}%`;
    }
    
    addLog("Sistem Rute Graf diinisialisasi. Menunggu perintah...");

    window.zoomIn = () => { if(network) network.moveTo({scale: network.getScale() * 1.2}); };
    window.zoomOut = () => { if(network) network.moveTo({scale: network.getScale() * 0.8}); };
    window.resetZoom = () => { if(network) network.fit(); };
});
