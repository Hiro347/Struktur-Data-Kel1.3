#ifndef UTILS_H
#define UTILS_H

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <unordered_map>
#include <chrono>
#include <windows.h>
#include <psapi.h>

// 1. Representasi Data
struct Lokasi {
    std::string id_lokasi;
    std::string nama_lokasi;
    std::string tipe_lokasi;
};

struct Rute {
    std::string id_rute;
    std::string lokasi_asal;
    std::string lokasi_tujuan;
    double jarak_km;
};

// 2. Alat Pengukur Waktu Eksekusi
class PerformanceTimer {
private:
    std::chrono::time_point<std::chrono::high_resolution_clock> start_time;
public:
    void start() {
        start_time = std::chrono::high_resolution_clock::now();
    }

    long long stop() {
        auto end_time = std::chrono::high_resolution_clock::now();
        return std::chrono::duration_cast<std::chrono::microseconds>(end_time - start_time).count();
    }
};

inline double get_current_ram_usage_mb() {
    PROCESS_MEMORY_COUNTERS pmc;
    if (GetProcessMemoryInfo(GetCurrentProcess(), &pmc, sizeof(pmc))) {
        return static_cast<double>(pmc.WorkingSetSize) / (1024.0 * 1024.0);
    }
    return 0.0;
}




// PARSINGGGGGGG PUSINGGGGGG
// 3. Fungsi Utilitas Baca File CSV (Read) 
inline std::unordered_map<std::string, Lokasi> loadLokasi(const std::string& filename) {
    std::unordered_map<std::string, Lokasi> mapLokasi;
    std::ifstream file(filename);
    std::string line;

    if (!file.is_open()) {
        std::cerr << "Error: Tidak dapat membuka file " << filename << "\n";
        return mapLokasi;
    }

    std::getline(file, line); 

    while (std::getline(file, line)) {
        std::stringstream ss(line);
        Lokasi loc;
        std::getline(ss, loc.id_lokasi, ',');
        std::getline(ss, loc.nama_lokasi, ',');
        std::getline(ss, loc.tipe_lokasi, ',');
        mapLokasi[loc.id_lokasi] = loc;
    }
    file.close();
    return mapLokasi;
}

inline std::vector<Rute> loadRute(const std::string& filename) {
    std::vector<Rute> listRute;
    std::ifstream file(filename);
    std::string line;

    if (!file.is_open()) {
        std::cerr << "Error: Tidak dapat membuka file " << filename << "\n";
        return listRute;
    }

    std::getline(file, line); 

    while (std::getline(file, line)) {
        std::stringstream ss(line);
        Rute r;
        std::string jarak_str;
        
        std::getline(ss, r.id_rute, ',');
        std::getline(ss, r.lokasi_asal, ',');
        std::getline(ss, r.lokasi_tujuan, ',');
        std::getline(ss, jarak_str, ',');
        

        // Falback Kalo Data gada
        try {
            r.jarak_km = std::stod(jarak_str);
        } catch (...) {
            r.jarak_km = 0.0; 
        }
        listRute.push_back(r);
    }
    file.close();
    return listRute;
}

// 4. Fungsi Utilitas Baca File DIMACS (.gr) berdasarkan Jumlah Edges
inline void loadDimacsData(std::unordered_map<std::string, Lokasi>& mapLokasi, 
                           std::vector<Rute>& listRute, 
                           int limit_edges) {
    std::string filename = "Dataset-Road-Central-USA.gr";
    std::ifstream file(filename);
    std::string line;

    if (!file.is_open()) {
        std::cerr << "[-] Error: Tidak dapat membuka file dataset " << filename << "\n";
        return;
    }

    int edge_counter = 0;

    while (std::getline(file, line)) {
        // Hanya proses baris yang diawali dengan 'a' (arc / rute)
        if (line.empty() || line[0] != 'a') continue; 

        std::stringstream ss(line);
        char type;
        int origin, dest;
        double weight;

        // Parsing format DIMACS: a [node_asal] [node_tujuan] [bobot]
        ss >> type >> origin >> dest >> weight;

        std::string id_origin = "Lokasi_" + std::to_string(origin);
        std::string id_dest = "Lokasi_" + std::to_string(dest);

        // Aturan penamaan & tipe sesuai dokumen spesifikasi (Modulo 100)
        if (mapLokasi.find(id_origin) == mapLokasi.end()) {
            mapLokasi[id_origin] = {id_origin, id_origin, (origin % 100 == 0) ? "Gudang" : "Tujuan"};
        }

        if (mapLokasi.find(id_dest) == mapLokasi.end()) {
            mapLokasi[id_dest] = {id_dest, id_dest, (dest % 100 == 0) ? "Gudang" : "Tujuan"};
        }

        // Simpan objek rute ke dalam list
        listRute.push_back({"Rute_" + std::to_string(edge_counter + 1), id_origin, id_dest, weight});
        edge_counter++;

        // Hentikan pembacaan jika batasan Edges sudah terpenuhi
        if (limit_edges > 0 && edge_counter >= limit_edges) {
            break;
        }
    }
    file.close();
    std::cout << "[+] Sukses memuat data ke memori!\n";
    std::cout << "    -> Total Node (Lokasi Unik) Berhasil Dibuat: " << mapLokasi.size() << "\n";
    std::cout << "    -> Total Edge (Rute) Berhasil Dibuat: " << listRute.size() << "\n";
}

#endif