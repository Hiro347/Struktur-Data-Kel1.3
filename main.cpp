#include <iostream>
#include "utils.h"
#include "AdjacencyList.h"

using namespace std;

int main() {
    cout << "Sistem Rekomendasi Rute Distribusi Kel 1.3\n\n";

   
    unordered_map<string, Lokasi> mapLokasi = loadLokasi("lokasi.csv");
    vector<Rute> listRute = loadRute("rute.csv");

    AdjacencyList grafRute;
    PerformanceTimer timer;

    // 2. Pengujian Awal Insert
    cout << "Memulai pengujian INSERT...\n";
    timer.start();
    
    // Insert Lokasi
    for (const auto& pair : mapLokasi) {
        grafRute.insertLokasi(pair.second);
    }
    
    // Insert Rute
    for (const auto& rute : listRute) {
        grafRute.insertRute(rute);
    }
    
    long long waktuInsert = timer.stop();
    cout << "Waktu eksekusi Insert Adjacency List : " << waktuInsert << " mikrodetik.\n\n";

    // Menampilkan graf untuk memastikan data masuk dengan benar
    grafRute.printGraph();

    // 3. Pengujian Awal Search
    cout << "\nMemulai pengujian SEARCH...\n";
    
    string asalCari = "L001";
    string tujuanCari = "L006";
    
    timer.start();
    Rute* hasilPencarian = grafRute.searchRute(asalCari, tujuanCari);
    long long waktuSearch = timer.stop();

    if (hasilPencarian != nullptr) {
        cout << "Rute ditemukan: " << hasilPencarian->id_rute 
             << " | Jarak: " << hasilPencarian->jarak_km << " km\n";
    } else {
        cout << "Rute dari " << asalCari << " ke " << tujuanCari << " tidak ditemukan.\n";
    };
    
    cout << "Waktu Selesai : " << waktuSearch << " mikrodetik.\n";

    return 0;
}