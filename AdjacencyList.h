#ifndef ADJACENCY_LIST_H
#define ADJACENCY_LIST_H

#include "utils.h"
#include <iostream>
#include <unordered_map>
#include <vector>
#include <string>

class AdjacencyList {
private:
    // Menyimpan detail lokasi (ID -> Data Lokasi)
    std::unordered_map<std::string, Lokasi> daftarLokasi;
    
    // Struktur Adjacency List: ID Lokasi Asal -> Daftar Rute Keluar
    std::unordered_map<std::string, std::vector<Rute>> adjList;

public:

    // 1. Insert data lokasi
    void insertLokasi(const Lokasi& loc) {
        daftarLokasi[loc.id_lokasi] = loc;
        // Inisialisasi list kosong untuk lokasi ini jika belum ada
        if (adjList.find(loc.id_lokasi) == adjList.end()) {
            adjList[loc.id_lokasi] = std::vector<Rute>();
        }
    }

    // 2. Insert data rute
    void insertRute(const Rute& rute) {
        // Tambahkan rute ke daftar rute keluar dari lokasi asal
        adjList[rute.lokasi_asal].push_back(rute);
    }

    // 3. Search data rute berdasarkan lokasi asal dan tujuan
    // Mengembalikan pointer ke Rute jika ditemukan, nullptr jika tidak ada
    Rute* searchRute(const std::string& asal, const std::string& tujuan) {
        // Cek apakah lokasi asal ada di graf
        if (adjList.find(asal) != adjList.end()) {
            // Cari rute yang tujuannya cocok
            for (auto& rute : adjList[asal]) {
                if (rute.lokasi_tujuan == tujuan) {
                    return &rute; // Rute ditemukan
                }
            }
        }
        return nullptr; // Rute tidak ditemukan
    }


    void printGraph() {
        std::cout << "\n=== Representasi Adjacency List ===\n";
        for (const auto& pair : adjList) {
            std::cout << "Lokasi [" << pair.first << "] terhubung ke:\n";
            for (const auto& rute : pair.second) {
                std::cout << "  -> " << rute.lokasi_tujuan 
                          << " (Jarak: " << rute.jarak_km << " km, ID Rute: " << rute.id_rute << ")\n";
            }
        }
        std::cout << "===================================\n";
    }
};

#endif