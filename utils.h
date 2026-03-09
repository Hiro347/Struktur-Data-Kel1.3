#ifndef UTILS_H
#define UTILS_H

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <unordered_map>
#include <chrono>

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

#endif