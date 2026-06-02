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

    // Mengalokasikan matriks 2D sekaligus (Batch Allocation)
    void alokasi_memori_matrix()
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
