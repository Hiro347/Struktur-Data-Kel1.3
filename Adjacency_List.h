#ifndef ADJACENCY_LIST_H
#define ADJACENCY_LIST_H

#include "utils.h"
#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>

class Adjacency
{
public:
    std::unordered_map<std::string, Lokasi> daftar_lokasi;
    std::unordered_map<std::string, std::vector<Rute>> daftar_rute;

    // Dioptimalkan memakai const & agar menghemat memori dan mempercepat run-time
    void masuk_lokasi(const Lokasi& loc)
    {
        daftar_lokasi[loc.id_lokasi] = loc;
        daftar_rute[loc.id_lokasi] = std::vector<Rute>();
    }

    void masuk_rute(const Rute& r)
    {
        daftar_rute[r.lokasi_asal].push_back(r);
    }

    // Dioptimalkan menggunakan 'const std::string&' untuk menghindari penyalinan string
    // dan menggunakan '.find()' agar tidak menambahkan entri kosong baru secara tidak sengaja
    Rute* cari_rute(const std::string& n, const std::string& m)
    {
        auto it_find = daftar_rute.find(n);
        if (it_find != daftar_rute.end())
        {
            for (auto &it : it_find->second)
            {
                if (m == it.lokasi_tujuan)
                {
                    return &it;
                }
            }
        }
        return nullptr; // Menggunakan nullptr daripada 0 di C++ Modern
    }

    // Dioptimalkan menggunakan '.find()' agar aman dari efek samping operator []
    void hapus_rute(const std::string& n, const std::string& m)
    {
        auto it_find = daftar_rute.find(n);
        if (it_find != daftar_rute.end())
        {
            auto &temp = it_find->second;
            for (auto it = temp.begin(); it != temp.end(); ++it)
            {
                if (it->lokasi_tujuan == m)
                {
                    temp.erase(it);
                    std::cout << "[+] Berhasil menghapus rute dari " << n << " ke " << m << std::endl;
                    return;
                }
            }
        }
        std::cout << "[-] Rute dari " << n << " ke " << m << " tidak ditemukan." << std::endl;
    }

    void print_dataset()
    {
        if (daftar_rute.empty()) {
            std::cout << "Dataset masih kosong!" << std::endl;
            return;
        }

        std::cout << "\n=== DATASET RUTE (ADJACENCY LIST) ===" << std::endl;
        for (const auto &it : daftar_rute)
        {
            if (!it.second.empty()) {
                std::cout << "Asal [" << it.first << "]:";
                for (const auto &r : it.second)
                {
                    std::cout << " -> " << r.lokasi_tujuan << " (" << r.jarak_km << " km)";
                }
                std::cout << std::endl;
            }
        }
    }
};

#endif
