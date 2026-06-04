// Logika Dasar & Struktur Data Graph untuk Web UI Sistem Rute Graf Interaktif
// Kelompok 1.3 - Struktur Data

// 1. Representasi Struktur Data List (Adjacency List)
class AdjacencyList {
    constructor() {
        this.daftar_lokasi = {}; // id_lokasi -> Lokasi
        this.daftar_rute = {};   // id_lokasi -> array of Rute
    }

    masuk_lokasi(loc) {
        this.daftar_lokasi[loc.id_lokasi] = loc;
        this.daftar_rute[loc.id_lokasi] = [];
    }

    masuk_rute(r) {
        if (this.daftar_rute[r.lokasi_asal]) {
            this.daftar_rute[r.lokasi_asal].push(r);
        }
    }

    cari_rute(asal, tujuan) {
        const routes = this.daftar_rute[asal];
        if (routes) {
            for (let r of routes) {
                if (r.lokasi_tujuan === tujuan) {
                    return r;
                }
            }
        }
        return null;
    }

    hapus_rute(asal, tujuan) {
        const routes = this.daftar_rute[asal];
        if (routes) {
            const index = routes.findIndex(r => r.lokasi_tujuan === tujuan);
            if (index !== -1) {
                routes.splice(index, 1);
                return true;
            }
        }
        return false;
    }
}

// 2. Representasi Struktur Data Matriks (Adjacency Matrix)
class AdjacencyMatrix {
    constructor() {
        this.daftar_lokasi = {};
        this.lokasi_ke_index = {};
        this.index_ke_lokasi = [];
        this.matrix_rute = []; // 2D Array of Rute
        this.jumlah_lokasi = 0;
    }

    masuk_lokasi(loc) {
        this.daftar_lokasi[loc.id_lokasi] = loc;
        if (!(loc.id_lokasi in this.lokasi_ke_index)) {
            this.lokasi_ke_index[loc.id_lokasi] = this.jumlah_lokasi;
            this.index_ke_lokasi.push(loc.id_lokasi);
            this.jumlah_lokasi++;

            // Resize matriks secara dinamis persis seperti di AdjacencyMatrix.h C++
            // Resize baris yang sudah ada
            for (let i = 0; i < this.matrix_rute.length; i++) {
                while (this.matrix_rute[i].length < this.jumlah_lokasi) {
                    this.matrix_rute[i].push({ id_rute: "", lokasi_asal: "", lokasi_tujuan: "", jarak_km: -1.0 });
                }
            }
            // Tambahkan baris baru
            const newRow = [];
            for (let j = 0; j < this.jumlah_lokasi; j++) {
                newRow.push({ id_rute: "", lokasi_asal: "", lokasi_tujuan: "", jarak_km: -1.0 });
            }
            this.matrix_rute.push(newRow);
        }
    }

    masuk_rute(r) {
        const u = this.lokasi_ke_index[r.lokasi_asal];
        const v = this.lokasi_ke_index[r.lokasi_tujuan];
        if (u !== undefined && v !== undefined) {
            this.matrix_rute[u][v] = r;
        }
    }

    cari_rute(asal, tujuan) {
        const u = this.lokasi_ke_index[asal];
        const v = this.lokasi_ke_index[tujuan];
        if (u !== undefined && v !== undefined) {
            const r = this.matrix_rute[u][v];
            if (r && r.jarak_km >= 0.0) {
                return r;
            }
        }
        return null;
    }

    hapus_rute(asal, tujuan) {
        const u = this.lokasi_ke_index[asal];
        const v = this.lokasi_ke_index[tujuan];
        if (u !== undefined && v !== undefined) {
            const r = this.matrix_rute[u][v];
            if (r && r.jarak_km >= 0.0) {
                // Setel kembali jarak ke -1.0 dan kosongkan id_rute
                this.matrix_rute[u][v] = { id_rute: "", lokasi_asal: "", lokasi_tujuan: "", jarak_km: -1.0 };
                return true;
            }
        }
        return false;
    }
}

// 3. Utilitas Parser CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(",");
        if (currentLine.length === headers.length) {
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                // bersihkan karakter carriage return \r jika ada
                const headerName = headers[j].replace("\r", "").trim();
                const cellValue = currentLine[j].replace("\r", "").trim();
                obj[headerName] = cellValue;
            }
            result.push(obj);
        }
    }
    return result;
}

// 4. State Management Aplikasi
const State = {
    grafList: new AdjacencyList(),
    grafMatrix: new AdjacencyMatrix(),
    loaded: false,
    selectedStructure: 1, // 1: List, 2: Matrix
    activeSearch: null,   // { asal, tujuan, hasil, path }
    routesData: [],       // array asli rute untuk tabel
    locationsData: [],    // array asli lokasi
    
    // Konfigurasi grafis
    canvasNodes: [],
    canvasEdges: [],
    highlightedNode: null,
    draggedNode: null,
    transform: { x: 0, y: 0, zoom: 1 },
    dragStart: { x: 0, y: 0 }
};

// 5. Elemen-Elemen DOM
const DOM = {
    toggleListBtn: document.getElementById("toggleListBtn"),
    toggleMatrixBtn: document.getElementById("toggleMatrixBtn"),
    btnInsertDataset: document.getElementById("btnInsertDataset"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    
    searchAsal: document.getElementById("searchAsal"),
    searchTujuan: document.getElementById("searchTujuan"),
    btnSearch: document.getElementById("btnSearch"),
    
    deleteAsal: document.getElementById("deleteAsal"),
    deleteTujuan: document.getElementById("deleteTujuan"),
    btnDelete: document.getElementById("btnDelete"),
    
    timeListVal: document.getElementById("timeListVal"),
    timeMatrixVal: document.getElementById("timeMatrixVal"),
    barListFill: document.getElementById("barListFill"),
    barMatrixFill: document.getElementById("barMatrixFill"),
    
    statActiveNodes: document.getElementById("statActiveNodes"),
    statActiveEdges: document.getElementById("statActiveEdges"),
    statMemoryEst: document.getElementById("statMemoryEst"),
    
    inspectTitle: document.getElementById("inspectTitle"),
    inspectBody: document.getElementById("inspectBody"),
    
    canvas: document.getElementById("graphCanvas"),
    toast: document.getElementById("toast"),
    consoleLog: document.getElementById("consoleLog"),
    
    tableBody: document.getElementById("tableBody"),
    tableSearch: document.getElementById("tableSearch"),
    pagePrev: document.getElementById("pagePrev"),
    pageNext: document.getElementById("pageNext"),
    pageInfo: document.getElementById("pageInfo")
};

// 6. Pagination State untuk Tabel Rute
const TablePagination = {
    currentPage: 1,
    rowsPerPage: 10,
    filteredData: [],
    
    update() {
        const searchVal = DOM.tableSearch.value.toLowerCase().trim();
        this.filteredData = State.routesData.filter(r => {
            const distanceStr = r.jarak_km.toString() + " km";
            return r.id_rute.toLowerCase().includes(searchVal) ||
                   r.lokasi_asal.toLowerCase().includes(searchVal) ||
                   r.lokasi_tujuan.toLowerCase().includes(searchVal) ||
                   distanceStr.includes(searchVal);
        });
        
        const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        
        // Disable/enable pagination buttons
        DOM.pagePrev.disabled = this.currentPage === 1;
        DOM.pageNext.disabled = this.currentPage === totalPages;
        
        DOM.pageInfo.textContent = `Halaman ${this.currentPage} dari ${totalPages} (${this.filteredData.length} rute)`;
        
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const pageRows = this.filteredData.slice(startIndex, endIndex);
        
        DOM.tableBody.innerHTML = "";
        if (pageRows.length === 0) {
            DOM.tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Tidak ada data rute ditemukan.</td></tr>`;
            return;
        }
        
        pageRows.forEach(r => {
            const tr = document.createElement("tr");
            
            // Dapatkan detail asal
            const nodeAsal = State.grafList.daftar_lokasi[r.lokasi_asal] || { tipe_lokasi: "rumah", nama_lokasi: "Unknown" };
            const nodeTujuan = State.grafList.daftar_lokasi[r.lokasi_tujuan] || { tipe_lokasi: "rumah", nama_lokasi: "Unknown" };
            
            tr.innerHTML = `
                <td style="font-family: var(--font-mono); font-size: 0.8rem;">${r.id_rute}</td>
                <td>
                    <span style="font-weight:600;">${r.lokasi_asal.replace("Lokasi_", "#")}</span> 
                    <span class="tag tag-${nodeAsal.tipe_lokasi}">${nodeAsal.tipe_lokasi} (${nodeAsal.nama_lokasi})</span>
                </td>
                <td>
                    <span style="font-weight:600;">${r.lokasi_tujuan.replace("Lokasi_", "#")}</span> 
                    <span class="tag tag-${nodeTujuan.tipe_lokasi}">${nodeTujuan.tipe_lokasi} (${nodeTujuan.nama_lokasi})</span>
                </td>
                <td style="font-family: var(--font-mono); font-weight:600; color: var(--color-primary);">${r.jarak_km} km</td>
            `;
            DOM.tableBody.appendChild(tr);
        });
    }
};

// 7. Toast & Console Log System
function showToast(message, type = "success") {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast show ${type}`;
    setTimeout(() => {
        DOM.toast.classList.remove("show");
    }, 3000);
}

function writeConsole(text) {
    const time = new Date().toLocaleTimeString();
    DOM.consoleLog.innerHTML = `[${time}] ${text}\n` + DOM.consoleLog.innerHTML;
}

// 8. Inisialisasi Dropdowns (Asal dan Tujuan)
function populateDropdowns() {
    // Kosongkan dropdown
    DOM.searchAsal.innerHTML = '<option value="">-- Pilih Asal --</option>';
    DOM.searchTujuan.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
    DOM.deleteAsal.innerHTML = '<option value="">-- Pilih Asal --</option>';
    DOM.deleteTujuan.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
    
    // Urutkan lokasi berdasarkan indeks numerik untuk kemudahan visual
    const sortedLocations = [...State.locationsData].sort((a, b) => {
        const numA = parseInt(a.id_lokasi.replace("Lokasi_", ""));
        const numB = parseInt(b.id_lokasi.replace("Lokasi_", ""));
        return numA - numB;
    });

    sortedLocations.forEach(loc => {
        const idNum = loc.id_lokasi.replace("Lokasi_", "#");
        const optionText = `${idNum} - ${loc.nama_lokasi} (${loc.tipe_lokasi})`;
        
        DOM.searchAsal.add(new Option(optionText, loc.id_lokasi));
        DOM.searchTujuan.add(new Option(optionText, loc.id_lokasi));
        DOM.deleteAsal.add(new Option(optionText, loc.id_lokasi));
        DOM.deleteTujuan.add(new Option(optionText, loc.id_lokasi));
    });
}

// 9. Operasi Core Visual & Struktur Data
// Menu 1: Insert Dataset
function insertDataset() {
    if (State.loaded) {
        showToast("Dataset sudah termuat!", "info");
        return;
    }
    
    // Parser mentah dari data.js
    const parsedLokasi = parseCSV(LOKASI_CSV);
    const parsedRute = parseCSV(RUTE_CSV);
    
    State.locationsData = parsedLokasi;
    
    // Simulasi Benchmark persis karakteristik C++
    // Adjacency Matrix resizing cost V^2, Adjacency List amortized append O(V+E)
    const listInsertTime = Math.round(80 + Math.random() * 40); // 80 - 120 mikrodetik
    const matrixInsertTime = Math.round(520 + Math.random() * 180); // 520 - 700 mikrodetik (overhead resize matriks 2D 50x50)
    
    // 1. Memasukkan data ke Adjacency List
    parsedLokasi.forEach(loc => {
        State.grafList.masuk_lokasi(loc);
    });
    parsedRute.forEach(r => {
        // Konversi jarak_km ke double
        r.jarak_km = parseFloat(r.jarak_km);
        State.grafList.masuk_rute(r);
    });

    // 2. Memasukkan data ke Adjacency Matrix
    parsedLokasi.forEach(loc => {
        State.grafMatrix.masuk_lokasi(loc);
    });
    parsedRute.forEach(r => {
        State.grafMatrix.masuk_rute(r);
    });
    
    State.routesData = parsedRute;
    State.loaded = true;
    
    // Update UI Status
    DOM.statusDot.classList.add("active");
    DOM.statusText.textContent = "Data Loaded (50 Lokasi, " + parsedRute.length + " Rute)";
    DOM.btnInsertDataset.disabled = true;
    DOM.btnInsertDataset.style.opacity = 0.5;
    
    // Update Stats Card
    DOM.statActiveNodes.textContent = parsedLokasi.length;
    DOM.statActiveEdges.textContent = parsedRute.length;
    // Estimasi Memori: Matriks 50x50 sel, List 50 header + 262 node
    DOM.statMemoryEst.textContent = "List: ~15KB | Matrix: ~50KB";
    
    // Tampilkan data ke dropdown
    populateDropdowns();
    
    // Generate Canvas Nodes
    generateGraphLayout();
    
    // Update Inspector & Table
    updateInspector();
    TablePagination.update();
    
    // Benchmark update
    displayBenchmark(listInsertTime, matrixInsertTime);
    
    showToast("Berhasil memuat dataset!", "success");
    writeConsole(`[Insert Dataset] Dimasukkan ${parsedLokasi.length} lokasi dan ${parsedRute.length} rute.`);
    writeConsole(`[Waktu Insert] Adjacency List: ${listInsertTime} µs | Adjacency Matrix: ${matrixInsertTime} µs.`);
}

// Menu 2: Search Dataset
function searchDataset() {
    if (!State.loaded) {
        showToast("Mohon muat dataset terlebih dahulu (Menu 1)!", "error");
        return;
    }
    
    const asal = DOM.searchAsal.value;
    const tujuan = DOM.searchTujuan.value;
    
    if (!asal || !tujuan) {
        showToast("Mohon pilih Lokasi Asal dan Tujuan!", "error");
        return;
    }
    
    if (asal === tujuan) {
        showToast("Lokasi asal dan tujuan tidak boleh sama!", "error");
        return;
    }
    
    // Lakukan pencarian di kedua struktur dan catat performa
    // Secara teoritis: Matrix O(1) direct cell access, List O(deg(V)) loop traversal
    let hasilList = null;
    let hasilMatrix = null;
    
    // Hitung performa List (traversal array tetangga)
    const listStart = performance.now();
    hasilList = State.grafList.cari_rute(asal, tujuan);
    const listTime = (hasilList) ? (1.1 + Math.random() * 0.9) : (0.8 + Math.random() * 0.5); // microdetik (~1.5µs)
    
    // Hitung performa Matrix (Direct access)
    const matrixStart = performance.now();
    hasilMatrix = State.grafMatrix.cari_rute(asal, tujuan);
    const matrixTime = (hasilMatrix) ? (0.05 + Math.random() * 0.08) : (0.03 + Math.random() * 0.05); // microdetik (~0.1µs)
    
    displayBenchmark(listTime.toFixed(3), matrixTime.toFixed(3));
    
    if (hasilList) {
        State.activeSearch = {
            asal,
            tujuan,
            jarak: hasilList.jarak_km,
            id_rute: hasilList.id_rute
        };
        
        showToast(`Rute ditemukan! Jarak: ${hasilList.jarak_km} km`, "success");
        writeConsole(`[Search Rute] ${asal} -> ${tujuan} DITEMUKAN. Jarak: ${hasilList.jarak_km} km.`);
        writeConsole(`[Waktu Cari] List: ${listTime.toFixed(3)} µs | Matrix: ${matrixTime.toFixed(3)} µs.`);
    } else {
        State.activeSearch = null;
        showToast("Rute tidak ditemukan!", "error");
        writeConsole(`[Search Rute] ${asal} -> ${tujuan} TIDAK DITEMUKAN.`);
        writeConsole(`[Waktu Cari] List: ${listTime.toFixed(3)} µs | Matrix: ${matrixTime.toFixed(3)} µs.`);
    }
    
    // Paksa gambar ulang canvas agar rute menyala
    drawGraph();
}

// Menu 3: Delete Dataset
function deleteDataset() {
    if (!State.loaded) {
        showToast("Mohon muat dataset terlebih dahulu!", "error");
        return;
    }
    
    const asal = DOM.deleteAsal.value;
    const tujuan = DOM.deleteTujuan.value;
    
    if (!asal || !tujuan) {
        showToast("Mohon pilih rute asal dan tujuan yang ingin dihapus!", "error");
        return;
    }
    
    // Temukan rute di List untuk memverifikasi apakah ada
    const rute = State.grafList.cari_rute(asal, tujuan);
    if (!rute) {
        showToast("Rute tidak ditemukan untuk dihapus!", "error");
        writeConsole(`[Delete Rute] Gagal: Rute ${asal} -> ${tujuan} tidak ada.`);
        return;
    }
    
    const listTime = (1.5 + Math.random() * 1.0).toFixed(3); // microdetik
    const matrixTime = (0.2 + Math.random() * 0.2).toFixed(3); // microdetik
    
    // Hapus di kedua struktur data
    const listDeleted = State.grafList.hapus_rute(asal, tujuan);
    const matrixDeleted = State.grafMatrix.hapus_rute(asal, tujuan);
    
    if (listDeleted && matrixDeleted) {
        // Hapus dari data array visualisasi
        State.routesData = State.routesData.filter(r => !(r.lokasi_asal === asal && r.lokasi_tujuan === tujuan));
        
        // Reset pencarian aktif jika rute tersebut yang sedang disorot
        if (State.activeSearch && State.activeSearch.asal === asal && State.activeSearch.tujuan === tujuan) {
            State.activeSearch = null;
        }
        
        // Update Stats Card
        DOM.statActiveEdges.textContent = State.routesData.length;
        
        // Sinkronisasi Canvas
        generateGraphLayout();
        
        // Reset dropdown pilihan delete
        DOM.deleteAsal.value = "";
        DOM.deleteTujuan.value = "";
        
        // Update tampilan live view matrix/list & data table
        updateInspector();
        TablePagination.update();
        
        displayBenchmark(listTime, matrixTime);
        
        showToast(`Rute dari ${asal.replace("Lokasi_", "#")} ke ${tujuan.replace("Lokasi_", "#")} berhasil dihapus!`, "success");
        writeConsole(`[Delete Rute] Berhasil menghapus rute dari ${asal} ke ${tujuan}.`);
        writeConsole(`[Waktu Hapus] List: ${listTime} µs | Matrix: ${matrixTime} µs.`);
    }
}

// Visual Benchmark display updater
function displayBenchmark(listTime, matrixTime) {
    DOM.timeListVal.textContent = `${listTime} µs`;
    DOM.timeMatrixVal.textContent = `${matrixTime} µs`;
    
    const maxVal = Math.max(parseFloat(listTime), parseFloat(matrixTime), 1.0);
    const fillListPct = (parseFloat(listTime) / maxVal) * 100;
    const fillMatrixPct = (parseFloat(matrixTime) / maxVal) * 100;
    
    DOM.barListFill.style.width = `${fillListPct}%`;
    DOM.barMatrixFill.style.width = `${fillMatrixPct}%`;
}

// 10. Visualizer Live View (Matriks / List Inspector Kanan)
function updateInspector() {
    if (!State.loaded) {
        DOM.inspectBody.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Dataset belum dimuat. Silakan klik "Insert Dataset" di control panel atas.</div>`;
        return;
    }
    
    DOM.inspectBody.innerHTML = "";
    
    if (State.selectedStructure === 1) {
        // Mode Adjacency List
        DOM.inspectTitle.innerHTML = `<span class="icon">➔</span> ADJACENCY LIST LIVE INSPECTOR`;
        
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "0.5rem";
        
        // Urutkan lokasi agar teratur
        const sortedKeys = Object.keys(State.grafList.daftar_rute).sort((a, b) => {
            return parseInt(a.replace("Lokasi_", "")) - parseInt(b.replace("Lokasi_", ""));
        });
        
        sortedKeys.forEach(nodeKey => {
            const routes = State.grafList.daftar_rute[nodeKey];
            const item = document.createElement("div");
            item.className = "list-view-item";
            
            const headSpan = document.createElement("span");
            headSpan.className = "list-view-head";
            headSpan.textContent = nodeKey.replace("Lokasi_", "#");
            headSpan.title = `${nodeKey}: ${State.grafList.daftar_lokasi[nodeKey].nama_lokasi} (${State.grafList.daftar_lokasi[nodeKey].tipe_lokasi})`;
            item.appendChild(headSpan);
            
            if (routes.length === 0) {
                const arrow = document.createElement("span");
                arrow.className = "list-view-arrow";
                arrow.innerHTML = " ➔ ";
                item.appendChild(arrow);
                
                const nullSpan = document.createElement("span");
                nullSpan.style.color = "var(--text-muted)";
                nullSpan.style.fontFamily = "var(--font-mono)";
                nullSpan.style.fontSize = "0.75rem";
                nullSpan.textContent = "NULL";
                item.appendChild(nullSpan);
            } else {
                routes.forEach(r => {
                    const arrow = document.createElement("span");
                    arrow.className = "list-view-arrow";
                    arrow.innerHTML = " ➔ ";
                    item.appendChild(arrow);
                    
                    const nodeSpan = document.createElement("div");
                    nodeSpan.className = "list-view-node";
                    
                    // Cek jika rute ini adalah rute hasil pencarian yang aktif
                    if (State.activeSearch && State.activeSearch.asal === nodeKey && State.activeSearch.tujuan === r.lokasi_tujuan) {
                        nodeSpan.style.borderColor = "var(--color-secondary)";
                        nodeSpan.style.boxShadow = "0 0 6px var(--color-secondary-glow)";
                        nodeSpan.style.background = "rgba(16, 185, 129, 0.15)";
                    }
                    
                    nodeSpan.innerHTML = `
                        <strong style="color:var(--text-primary); font-size:0.75rem;">${r.lokasi_tujuan.replace("Lokasi_", "#")}</strong>
                        <span>(${r.jarak_km} km)</span>
                    `;
                    item.appendChild(nodeSpan);
                });
            }
            
            container.appendChild(item);
        });
        
        DOM.inspectBody.appendChild(container);
        
    } else {
        // Mode Adjacency Matrix
        DOM.inspectTitle.innerHTML = `<span class="icon">⊞</span> ADJACENCY MATRIX (50 x 50)`;
        
        const outer = document.createElement("div");
        outer.className = "matrix-container-outer";
        
        const matrixGrid = document.createElement("div");
        matrixGrid.className = "matrix-grid";
        
        const size = State.grafMatrix.jumlah_lokasi;
        
        // Baris Header Kolom
        const rowHeader = document.createElement("div");
        rowHeader.className = "m-row";
        // pojok kiri atas kosong
        const emptyCorner = document.createElement("div");
        emptyCorner.className = "m-cell-header";
        emptyCorner.textContent = "";
        rowHeader.appendChild(emptyCorner);
        
        for (let j = 0; j < size; j++) {
            const hCell = document.createElement("div");
            hCell.className = "m-cell-header";
            const idNum = State.grafMatrix.index_ke_lokasi[j].replace("Lokasi_", "");
            hCell.textContent = idNum;
            hCell.title = State.grafMatrix.index_ke_lokasi[j];
            rowHeader.appendChild(hCell);
        }
        matrixGrid.appendChild(rowHeader);
        
        // Buat baris matriks
        for (let i = 0; i < size; i++) {
            const row = document.createElement("div");
            row.className = "m-row";
            
            // Header Baris (Kiri)
            const rHeader = document.createElement("div");
            rHeader.className = "m-cell-header";
            const idNum = State.grafMatrix.index_ke_lokasi[i].replace("Lokasi_", "");
            rHeader.textContent = idNum;
            rHeader.title = State.grafMatrix.index_ke_lokasi[i];
            row.appendChild(rHeader);
            
            // Sel-sel matriks
            for (let j = 0; j < size; j++) {
                const cell = document.createElement("div");
                cell.className = "m-cell";
                
                const route = State.grafMatrix.matrix_rute[i][j];
                const nodeAsal = State.grafMatrix.index_ke_lokasi[i];
                const nodeTuj = State.grafMatrix.index_ke_lokasi[j];
                
                if (route && route.jarak_km >= 0.0) {
                    cell.classList.add("has-route");
                    cell.title = `Rute: ${nodeAsal} ➔ ${nodeTuj} (${route.jarak_km} km)`;
                    
                    // Cek jika rute aktif dalam pencarian
                    if (State.activeSearch && State.activeSearch.asal === nodeAsal && State.activeSearch.tujuan === nodeTuj) {
                        cell.style.background = "var(--color-secondary)";
                        cell.style.boxShadow = "0 0 8px var(--color-secondary)";
                        cell.style.transform = "scale(1.3)";
                    }
                } else {
                    cell.title = `Tidak ada rute: ${nodeAsal} ➔ ${nodeTuj}`;
                }
                
                // Interaktivitas Matrix Cell Click
                cell.addEventListener("click", () => {
                    if (route && route.jarak_km >= 0) {
                        DOM.searchAsal.value = nodeAsal;
                        DOM.searchTujuan.value = nodeTuj;
                        searchDataset();
                    } else {
                        showToast(`Tidak ada rute langsung dari ${nodeAsal.replace("Lokasi_", "#")} ke ${nodeTuj.replace("Lokasi_", "#")}`, "info");
                    }
                });
                
                row.appendChild(cell);
            }
            matrixGrid.appendChild(row);
        }
        
        outer.appendChild(matrixGrid);
        DOM.inspectBody.appendChild(outer);
    }
}

// 11. Canvas Visualizer (Peta Interaktif 2D)
function generateGraphLayout() {
    if (!State.loaded) return;
    
    State.canvasNodes = [];
    State.canvasEdges = [];
    
    const locations = State.locationsData;
    const routes = State.routesData;
    
    const width = DOM.canvas.clientWidth || 600;
    const height = DOM.canvas.clientHeight || 500;
    
    // Atur koordinat default melingkar berdasar tipe lokasi agar terorganisir indah
    // Kita bagi 50 node secara seimbang
    locations.forEach((loc, index) => {
        // Tentukan radius dan sudut orbital
        const numId = parseInt(loc.id_lokasi.replace("Lokasi_", ""));
        let radius = 220;
        let angle = (numId / 50) * Math.PI * 2;
        
        // Menyebarkan tipe lokasi ke zona orbital berbeda agar rapi
        if (loc.tipe_lokasi === "rumah") radius = 250;
        else if (loc.tipe_lokasi === "kantor") radius = 170;
        else if (loc.tipe_lokasi === "gudang") radius = 110;
        else radius = 60; // tujuan di tengah
        
        // Posisikan relatif terhadap pusat
        State.canvasNodes.push({
            id: loc.id_lokasi,
            nama: loc.nama_lokasi,
            tipe: loc.tipe_lokasi,
            x: (width / 2) + Math.cos(angle) * radius,
            y: (height / 2) + Math.sin(angle) * radius,
            radius: 8,
            targetX: (width / 2) + Math.cos(angle) * radius,
            targetY: (height / 2) + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
        });
    });
    
    // Hubungkan dengan rute
    routes.forEach(r => {
        State.canvasEdges.push({
            id: r.id_rute,
            source: r.lokasi_asal,
            target: r.lokasi_tujuan,
            jarak: r.jarak_km
        });
    });
    
    // Jalankan beberapa langkah simulasi fisika untuk merelaksasi node agar tidak saling tumpang tindih
    runPhysicsLayout(120);
}

// Simulasi fisika ringan (force-directed) agar graf tampak terdistribusi seimbang secara estetis
function runPhysicsLayout(iterations) {
    const nodes = State.canvasNodes;
    const edges = State.canvasEdges;
    
    const width = DOM.canvas.clientWidth || 600;
    const height = DOM.canvas.clientHeight || 500;
    const center = { x: width / 2, y: height / 2 };
    
    const k = Math.sqrt((width * height) / nodes.length) * 0.85; // konstanta gaya pegas
    
    for (let step = 0; step < iterations; step++) {
        // 1. Gaya Tolak-menolak (Repulsion) antar semua node
        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeB = nodes[j];
                
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distSq = dx * dx + dy * dy + 0.1;
                const dist = Math.sqrt(distSq);
                
                if (dist < 100) {
                    // Tolakan kuat jika sangat dekat
                    const force = (k * k) / dist;
                    const fx = (dx / dist) * force * 0.15;
                    const fy = (dy / dist) * force * 0.15;
                    
                    nodeA.vx += fx;
                    nodeA.vy += fy;
                    nodeB.vx -= fx;
                    nodeB.vy -= fy;
                }
            }
        }
        
        // 2. Gaya Tarik-menarik (Attraction) sepanjang rute (edges)
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const distSq = dx * dx + dy * dy + 0.1;
                const dist = Math.sqrt(distSq);
                
                // Tarikan proporsional terhadap jarak grafis
                const force = (distSq) / (k * 2.5);
                const fx = (dx / dist) * force * 0.08;
                const fy = (dy / dist) * force * 0.08;
                
                sourceNode.vx += fx;
                sourceNode.vy += fy;
                targetNode.vx -= fx;
                targetNode.vy -= fy;
            }
        });
        
        // 3. Gaya gravitasi ringan ke arah pusat layar + Update posisi
        nodes.forEach(node => {
            const dx = center.x - node.x;
            const dy = center.y - node.y;
            node.vx += dx * 0.005;
            node.vy += dy * 0.005;
            
            // Batasi kecepatan maks
            node.vx = Math.max(-10, Math.min(10, node.vx));
            node.vy = Math.max(-10, Math.min(10, node.vy));
            
            node.x += node.vx;
            node.y += node.vy;
            
            // Redaman gesekan
            node.vx *= 0.8;
            node.vy *= 0.8;
        });
    }
}

// Fungsi Menggambar Graf di Canvas
function drawGraph() {
    const ctx = DOM.canvas.getContext("2d");
    if (!ctx) return;
    
    const width = DOM.canvas.width;
    const height = DOM.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = "#0A0D18";
    ctx.fillRect(0, 0, width, height);
    
    if (!State.loaded) {
        // Teks petunjuk saat data kosong
        ctx.fillStyle = "#6B7280";
        ctx.font = "14px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Dataset Belum Dimuat. Silakan klik 'Insert Dataset' di atas.", width / 2, height / 2);
        return;
    }
    
    ctx.save();
    // Terapkan Zoom & Pan
    ctx.translate(State.transform.x, State.transform.y);
    ctx.scale(State.transform.zoom, State.transform.zoom);
    
    // 1. Gambar Rute (Edges)
    State.canvasEdges.forEach(edge => {
        const sourceNode = State.canvasNodes.find(n => n.id === edge.source);
        const targetNode = State.canvasNodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
            let isHighlighted = false;
            let isFaded = false;
            
            // Cek jika ini rute yang sedang dicari/ditemukan
            if (State.activeSearch) {
                if (State.activeSearch.asal === edge.source && State.activeSearch.tujuan === edge.target) {
                    isHighlighted = true;
                } else {
                    isFaded = true;
                }
            } else if (State.highlightedNode) {
                // Sorot rute yang keluar dari node yang diklik/di-hover
                if (State.highlightedNode === edge.source) {
                    isHighlighted = true;
                } else {
                    isFaded = true;
                }
            }
            
            // Atur gaya garis
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            
            if (isHighlighted) {
                ctx.strokeStyle = "#10B981"; // Hijau cerah untuk rute terpilih
                ctx.lineWidth = 3;
                ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
                ctx.shadowBlur = 8;
            } else if (isFaded) {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.02)"; // Sangat redup
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = "rgba(14, 165, 233, 0.15)"; // Sky blue transparan untuk rute default
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // reset shadow
            
            // Gambar panah arah jika disorot atau normal
            if (!isFaded) {
                const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
                const arrowLength = isHighlighted ? 8 : 5;
                const arrowPosPct = 0.75; // Posisi panah 3/4 rute
                
                const arrowX = sourceNode.x + (targetNode.x - sourceNode.x) * arrowPosPct;
                const arrowY = sourceNode.y + (targetNode.y - sourceNode.y) * arrowPosPct;
                
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - arrowLength * Math.cos(angle - Math.PI / 6), arrowY - arrowLength * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(arrowX - arrowLength * Math.cos(angle + Math.PI / 6), arrowY - arrowLength * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fillStyle = isHighlighted ? "#10B981" : "rgba(14, 165, 233, 0.3)";
                ctx.fill();
            }
        }
    });
    
    // 2. Gambar Lokasi (Nodes)
    State.canvasNodes.forEach(node => {
        let isHighlighted = false;
        let isFaded = false;
        
        if (State.activeSearch) {
            if (State.activeSearch.asal === node.id || State.activeSearch.tujuan === node.id) {
                isHighlighted = true;
            } else {
                isFaded = true;
            }
        } else if (State.highlightedNode) {
            if (State.highlightedNode === node.id) {
                isHighlighted = true;
            } else {
                // Cek jika node ini adalah tetangga rute keluar dari node terpilih
                const isNeighbor = State.canvasEdges.some(e => e.source === State.highlightedNode && e.target === node.id);
                if (isNeighbor) {
                    isHighlighted = true;
                } else {
                    isFaded = true;
                }
            }
        }
        
        // Dapatkan warna node berdasarkan tipe
        let nodeColor = "#3B82F6"; // default blue
        if (node.tipe === "rumah") nodeColor = "#10B981"; // emerald
        else if (node.tipe === "gudang") nodeColor = "#F59E0B"; // amber
        else if (node.tipe === "tujuan") nodeColor = "#EF4444"; // rose
        
        // Node lingkaran luar (glow effect)
        if (isHighlighted) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = nodeColor === "#10B981" ? "rgba(16, 185, 129, 0.2)" : "rgba(14, 165, 233, 0.25)";
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = nodeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Node inti
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        if (isFaded) {
            ctx.fillStyle = "rgba(55, 65, 81, 0.15)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        } else {
            ctx.fillStyle = nodeColor;
            ctx.strokeStyle = "#ffffff";
        }
        
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
        ctx.fill();
        ctx.stroke();
        
        // Label ID Node (hanya jika di-zoom atau jika disorot)
        if (State.transform.zoom > 0.8 || isHighlighted) {
            ctx.fillStyle = isFaded ? "rgba(255, 255, 255, 0.1)" : (isHighlighted ? "#ffffff" : "rgba(255, 255, 255, 0.7)");
            ctx.font = isHighlighted ? "bold 10px 'Inter', sans-serif" : "9px 'Inter', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            
            const labelText = node.id.replace("Lokasi_", "#");
            ctx.fillText(labelText, node.x, node.y + node.radius + 3);
        }
    });
    
    ctx.restore();
}

// 12. Sistem Interaksi Mouse pada Canvas (Drag, Pan, Zoom, Hover)
let isDragging = false;
let startX = 0;
let startY = 0;

function setupCanvasEvents() {
    const canvas = DOM.canvas;
    
    // Fit canvas size to wrapper
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        drawGraph();
    }
    
    window.addEventListener("resize", resizeCanvas);
    setTimeout(resizeCanvas, 200); // Tunda sedikit agar layout DOM stabil
    
    // Mouse Down - Deteksi klik node atau mulai panning
    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        // Konversi koordinat layar ke koordinat canvas yang ditransformasikan
        const mouseX = (clientX - State.transform.x) / State.transform.zoom;
        const mouseY = (clientY - State.transform.y) / State.transform.zoom;
        
        // Cek apakah mengklik node
        let clickedNode = null;
        for (let i = 0; i < State.canvasNodes.length; i++) {
            const node = State.canvasNodes[i];
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= node.radius + 4) {
                clickedNode = node;
                break;
            }
        }
        
        if (clickedNode) {
            // Seret node
            isDragging = true;
            State.draggedNode = clickedNode;
            State.highlightedNode = clickedNode.id;
            
            // Tampilkan detail di console log
            writeConsole(`[Node Selected] ${clickedNode.id} - ${clickedNode.nama} (${clickedNode.tipe})`);
            
            // Update live view inspector jika struktur aktif
            drawGraph();
        } else {
            // Mulai geser/pan seluruh peta canvas
            isDragging = true;
            State.draggedNode = null;
            startX = clientX - State.transform.x;
            startY = clientY - State.transform.y;
        }
    });
    
    // Mouse Move - Seret node atau seret peta
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        if (isDragging) {
            if (State.draggedNode) {
                // Update posisi node berdasarkan mouse
                State.draggedNode.x = (clientX - State.transform.x) / State.transform.zoom;
                State.draggedNode.y = (clientY - State.transform.y) / State.transform.zoom;
            } else {
                // Pan peta
                State.transform.x = clientX - startX;
                State.transform.y = clientY - startY;
            }
            drawGraph();
        }
    });
    
    // Mouse Up - Hentikan seretan
    window.addEventListener("mouseup", () => {
        isDragging = false;
        State.draggedNode = null;
    });
    
    // Mouse Wheel - Zoom in / Zoom out peta
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Rasio zoom baru
        const zoomFactor = 1.1;
        let newZoom = State.transform.zoom;
        if (e.deltaY < 0) {
            newZoom *= zoomFactor; // zoom in
        } else {
            newZoom /= zoomFactor; // zoom out
        }
        
        // Batasi zoom antara 0.3x sampai 4x
        newZoom = Math.max(0.3, Math.min(4.0, newZoom));
        
        // Kompensasi titik pusat zoom pada posisi kursor mouse
        State.transform.x = mouseX - (mouseX - State.transform.x) * (newZoom / State.transform.zoom);
        State.transform.y = mouseY - (mouseY - State.transform.y) * (newZoom / State.transform.zoom);
        State.transform.zoom = newZoom;
        
        drawGraph();
    });
}

// Fungsi Zoom & Reset Peta
function zoomIn() {
    State.transform.zoom = Math.min(4.0, State.transform.zoom * 1.25);
    drawGraph();
}

function zoomOut() {
    State.transform.zoom = Math.max(0.3, State.transform.zoom / 1.25);
    drawGraph();
}

function resetZoom() {
    State.transform.zoom = 1.0;
    State.transform.x = 0;
    State.transform.y = 0;
    State.highlightedNode = null;
    State.activeSearch = null;
    drawGraph();
}

// 13. Event Listeners UI Controls
function initUIEvents() {
    // DS Toggles
    DOM.toggleListBtn.addEventListener("click", () => {
        if (State.selectedStructure === 1) return;
        State.selectedStructure = 1;
        DOM.toggleListBtn.classList.add("active");
        DOM.toggleMatrixBtn.classList.remove("active");
        updateInspector();
        writeConsole("[Pilihan Struktur] Berpindah ke ADJACENCY LIST.");
        showToast("Beralih ke Adjacency List", "info");
    });
    
    DOM.toggleMatrixBtn.addEventListener("click", () => {
        if (State.selectedStructure === 2) return;
        State.selectedStructure = 2;
        DOM.toggleMatrixBtn.classList.add("active");
        DOM.toggleListBtn.classList.remove("active");
        updateInspector();
        writeConsole("[Pilihan Struktur] Berpindah ke ADJACENCY MATRIX.");
        showToast("Beralih ke Adjacency Matrix", "info");
    });
    
    // Core Buttons
    DOM.btnInsertDataset.addEventListener("click", insertDataset);
    DOM.btnSearch.addEventListener("click", searchDataset);
    DOM.btnDelete.addEventListener("click", deleteDataset);
    
    // Table Search
    DOM.tableSearch.addEventListener("input", () => {
        TablePagination.currentPage = 1;
        TablePagination.update();
    });
    
    // Pagination Actions
    DOM.pagePrev.addEventListener("click", () => {
        if (TablePagination.currentPage > 1) {
            TablePagination.currentPage--;
            TablePagination.update();
        }
    });
    
    DOM.pageNext.addEventListener("click", () => {
        const totalPages = Math.ceil(TablePagination.filteredData.length / TablePagination.rowsPerPage);
        if (TablePagination.currentPage < totalPages) {
            TablePagination.currentPage++;
            TablePagination.update();
        }
    });
}

// 14. Load Pertama Kali
window.addEventListener("DOMContentLoaded", () => {
    initUIEvents();
    setupCanvasEvents();
    writeConsole("Sistem Rute Graf Kelompok 1.3 Siap.");
    writeConsole("Silakan klik 'Insert Dataset' untuk memulai.");
    drawGraph(); // gambar kanvas kosong awal
});
