#ifndef ADJACENCY_MATRIX_H
#define ADJACENCY_MATRIX_H

#include "utils.h"
#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>

class AdjacencyMatrix
{
public:
    std::unordered_map<std::string, Lokasi> daftar_lokasi;
    std::unordered_map<std::string, int> lokasi_ke_index;
    std::vector<std::string> index_ke_lokasi;
    std::vector<std::vector<Rute>> matrix_rute;
    int jumlah_lokasi = 0;

    // Menambahkan lokasi baru dan meresize ukuran matriks secara dinamis
    void masuk_lokasi(const Lokasi& loc)
    {
        daftar_lokasi[loc.id_lokasi] = loc;
        
        // Hanya tambahkan jika lokasi belum terdaftar dalam koordinat matriks
        if (lokasi_ke_index.find(loc.id_lokasi) == lokasi_ke_index.end())
        {
            lokasi_ke_index[loc.id_lokasi] = jumlah_lokasi;
            index_ke_lokasi.push_back(loc.id_lokasi);
            jumlah_lokasi++;
        }
    }

    // Menambahkan lokasi ke matriks yang sudah dialokasikan (membutuhkan realokasi)
    void tambah_lokasi_dinamis(const Lokasi& loc)
    {
        if (lokasi_ke_index.find(loc.id_lokasi) != lokasi_ke_index.end()) return;
        
        masuk_lokasi(loc);
        
        // O(V) resize operasi
        matrix_rute.resize(jumlah_lokasi);
        for (int i = 0; i < jumlah_lokasi; i++) {
            matrix_rute[i].resize(jumlah_lokasi);
            if (i < jumlah_lokasi - 1) {
                matrix_rute[i][jumlah_lokasi - 1].jarak_km = -1.0;
            } else {
                for (int j = 0; j < jumlah_lokasi; j++) {
                    matrix_rute[jumlah_lokasi - 1][j].jarak_km = -1.0;
                }
            }
        }
    }

    // Mengalokasikan matriks 2D sekaligus (Batch Allocation)
    void alokasi_memori_matrix()
    {
        long long sizeof_rute = sizeof(Rute);
        long long sizeof_vector = sizeof(std::vector<Rute>);
        long long estimated_bytes = (long long)jumlah_lokasi * sizeof_vector + 
                                    (long long)jumlah_lokasi * (long long)jumlah_lokasi * sizeof_rute;

        // Ambil info memori sistem menggunakan API Windows
        MEMORYSTATUSEX statex;
        statex.dwLength = sizeof(statex);
        if (GlobalMemoryStatusEx(&statex))
        {
            // Ambil RAM fisik yang tersedia (ullAvailPhys)
            // Sebagai batas aman, kita batasi alokasi maksimal 85% dari RAM fisik yang tersedia
            // untuk menghindari thrashing dan menjaga kestabilitas OS.
            unsigned long long max_allowed_bytes = (statex.ullAvailPhys * 85) / 100;
            
            if (estimated_bytes > max_allowed_bytes)
            {
                throw std::bad_alloc();
            }
        }
        else
        {
            // Fallback jika API gagal, gunakan batas aman statis 5000 lokasi
            if (jumlah_lokasi > 5000)
            {
                throw std::bad_alloc();
            }
        }

        try
        {
            matrix_rute.resize(jumlah_lokasi);
            for (int i = 0; i < jumlah_lokasi; i++)
            {
                matrix_rute[i].resize(jumlah_lokasi);
                for (int j = 0; j < jumlah_lokasi; j++)
                {
                    matrix_rute[i][j].jarak_km = -1.0;
                }
            }
        }
        catch (...)
        {
            // Bersihkan memori yang sempat dialokasikan sebagian
            std::vector<std::vector<Rute>>().swap(matrix_rute);
            throw; // Re-throw agar ditangkap di pemanggil
        }
    }

    // Memasukkan data rute ke dalam koordinat baris dan kolom yang tepat
    void masuk_rute(const Rute& r)
    {
        auto it_asal = lokasi_ke_index.find(r.lokasi_asal);
        auto it_tujuan = lokasi_ke_index.find(r.lokasi_tujuan);
        
        if (it_asal != lokasi_ke_index.end() && it_tujuan != lokasi_ke_index.end())
        {
            int u = it_asal->second;
            int v = it_tujuan->second;
            matrix_rute[u][v] = r;
        }
    }

    // Mencari rute langsung di koordinat (u, v) dengan kompleksitas waktu konstan O(1)
    Rute* cari_rute(const std::string& n, const std::string& m)
    {
        auto it_asal = lokasi_ke_index.find(n);
        auto it_tujuan = lokasi_ke_index.find(m);
        
        if (it_asal != lokasi_ke_index.end() && it_tujuan != lokasi_ke_index.end())
        {
            int u = it_asal->second;
            int v = it_tujuan->second;
            // Jika jarak >= 0.0, berarti rute tersebut aktif dan ada hubungan
            if (matrix_rute[u][v].jarak_km >= 0.0)
            {
                return &matrix_rute[u][v];
            }
        }
        return nullptr; // Rute tidak ditemukan
    }

    void update_rute(const std::string& n, const std::string& m, double jarak_baru)
    {
        auto it_asal   = lokasi_ke_index.find(n);
        auto it_tujuan = lokasi_ke_index.find(m);

        if (it_asal   != lokasi_ke_index.end() &&
            it_tujuan != lokasi_ke_index.end())
        {
            int u = it_asal->second;
            int v = it_tujuan->second;
            if (matrix_rute[u][v].jarak_km >= 0.0)
            {
                matrix_rute[u][v].jarak_km = jarak_baru;
                std::cout << "[+] Berhasil update rute " << n 
                          << " -> " << m 
                          << " menjadi " << jarak_baru << " km" << std::endl;
                return;
            }
        }
        std::cout << "[-] Rute dari " << n << " ke " << m 
                  << " tidak ditemukan." << std::endl;
    }

    // Menghapus rute dengan menyetel kembali nilai jarak ke -1.0
    void hapus_rute(const std::string& n, const std::string& m)
    {
        auto it_asal = lokasi_ke_index.find(n);
        auto it_tujuan = lokasi_ke_index.find(m);
        
        if (it_asal != lokasi_ke_index.end() && it_tujuan != lokasi_ke_index.end())
        {
            int u = it_asal->second;
            int v = it_tujuan->second;
            if (matrix_rute[u][v].jarak_km >= 0.0)
            {
                matrix_rute[u][v].jarak_km = -1.0;
                matrix_rute[u][v].id_rute = "";
                std::cout << "[+] Berhasil menghapus rute dari " << n << " ke " << m << std::endl;
                return;
            }
        }
        std::cout << "[-] Rute dari " << n << " ke " << m << " tidak ditemukan." << std::endl;
    }

    // Mencetak dataset matriks yang memiliki rute keluar
    void print_dataset()
    {
        if (jumlah_lokasi == 0) {
            std::cout << "Dataset masih kosong!" << std::endl;
            return;
        }

        std::cout << "\n=== DATASET RUTE (ADJACENCY MATRIX) ===" << std::endl;
        for (int i = 0; i < jumlah_lokasi; i++)
        {
            bool ada_rute_keluar = false;
            for (int j = 0; j < jumlah_lokasi; j++)
            {
                if (matrix_rute[i][j].jarak_km >= 0.0)
                {
                    if (!ada_rute_keluar) {
                        std::cout << "Asal [" << index_ke_lokasi[i] << "]:";
                        ada_rute_keluar = true;
                    }
                    std::cout << " -> " << index_ke_lokasi[j] << " (" << matrix_rute[i][j].jarak_km << " km)";
                }
            }
            if (ada_rute_keluar) {
                std::cout << std::endl;
            }
        }
    }
};

#endif
