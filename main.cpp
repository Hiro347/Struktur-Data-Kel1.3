#include <iostream>
#include <vector>
#include <string>
#include "utils.h"
#include "Adjacency_List.h"
#include "Adjacency_Matrix.h"
#include "httplib.h"

using namespace std;

int main()
{
    Adjacency graf_list;
    AdjacencyMatrix graf_matrix;
    PerformanceTimer timer;

    bool data_list_masuk = false;
    bool data_matrix_masuk = false;

    int pilihan = 0;
    int tipe_struktur = 0;

    int app_mode = 0;
    while (app_mode != 1 && app_mode != 2) {
        cout << "=== PILIH MODE APLIKASI ===\n";
        cout << "1. CLI Mode\n";
        cout << "2. Web Server Mode\n";
        cout << "Pilih mode (1-2): ";
        cin >> app_mode;
    }

    if (app_mode == 2) {
        cout << "[+] Memulai Web Server di port 8080...\n";
        httplib::Server svr;

        svr.set_mount_point("/", "./web");

        svr.Get("/api/animasi", [](const httplib::Request&, httplib::Response& res) {
            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, 500);

            string json_str = "{\"nodes\": [";
            bool first = true;
            for (auto& pair : mapLokasi) {
                if (!first) json_str += ", ";
                json_str += "{\"id\": \"" + pair.second.id_lokasi + "\", \"label\": \"" + pair.second.nama_lokasi + "\", \"group\": \"" + pair.second.tipe_lokasi + "\"}";
                first = false;
            }
            json_str += "], \"edges\": [";
            first = true;
            for (auto& rute : listRute) {
                if (!first) json_str += ", ";
                json_str += "{\"from\": \"" + rute.lokasi_asal + "\", \"to\": \"" + rute.lokasi_tujuan + "\", \"label\": \"" + to_string((int)rute.jarak_km) + "\"}";
                first = false;
            }
            json_str += "]}";

            res.set_content(json_str, "application/json");
        });

        svr.Post("/api/benchmark", [&](const httplib::Request& req, httplib::Response& res) {
            int limit = 100000;
            string struktur = "list";
            
            // Basic parsing of json body (e.g. {"limit": 500000, "struktur": "list"})
            // For simplicity in C++, we do rudimentary string matching
            string body = req.body;
            if (body.find("\"limit\"") != string::npos) {
                size_t pos = body.find("\"limit\"");
                size_t colon = body.find(":", pos);
                size_t comma = body.find(",", colon);
                size_t end_brace = body.find("}", colon);
                size_t end_pos = (comma != string::npos && comma < end_brace) ? comma : end_brace;
                if (colon != string::npos && end_pos != string::npos) {
                    string limit_str = body.substr(colon + 1, end_pos - colon - 1);
                    limit = stoi(limit_str);
                }
            }
            if (body.find("\"struktur\"") != string::npos) {
                if (body.find("matrix") != string::npos) {
                    struktur = "matrix";
                }
            }

            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, limit);

            double ram_sebelum = get_current_ram_usage_mb();
            
            PerformanceTimer p_timer;
            p_timer.start();

            if (struktur == "list") {
                Adjacency graf_list_temp;
                for (auto& pair : mapLokasi) graf_list_temp.masuk_lokasi(pair.second);
                for (auto& rute : listRute) graf_list_temp.masuk_rute(rute);
            } else {
                AdjacencyMatrix graf_matrix_temp;
                for (auto& pair : mapLokasi) graf_matrix_temp.masuk_lokasi(pair.second);
                graf_matrix_temp.alokasi_memori_matrix();
                for (auto& rute : listRute) graf_matrix_temp.masuk_rute(rute);
            }

            double waktu_us = p_timer.stop();
            double ram_sesudah = get_current_ram_usage_mb();

            double diff_ram = ram_sesudah - ram_sebelum;
            if (diff_ram < 0) diff_ram = 0;

            string resp = "{\"waktu_ms\": " + to_string(waktu_us / 1000.0) + ", \"ram_mb\": " + to_string(diff_ram) + "}";
            res.set_content(resp, "application/json");
        });

        svr.listen("localhost", 8080);
        return 0;
    }

    while (pilihan != 6)
    {
        if (tipe_struktur == 0)
        {
            while (tipe_struktur != 1 && tipe_struktur != 2)
            {
                cout << "=== PILIH STRUKTUR DATA UTAMA ===" << endl;
                cout << "1. Adjacency List" << endl;
                cout << "2. Adjacency Matrix" << endl;
                cout << "Pilih tipe (1-2): ";
                cin >> tipe_struktur;
                if (tipe_struktur != 1 && tipe_struktur != 2)
                {
                    cout << "[!] ERROR: Pilihan tidak valid! Masukkan 1 atau 2.\n" << endl;
                }
            }
        }

        string nama_struktur = (tipe_struktur == 1) ? "ADJACENCY LIST" : "ADJACENCY MATRIX";
        bool data_sudah_masuk = (tipe_struktur == 1) ? data_list_masuk : data_matrix_masuk;

        cout << "\n=== Simple Sistem Rute (" << nama_struktur << ") ===" << endl;
        cout << "1. Insert dataset" << endl;
        cout << "2. Search dataset" << endl;
        cout << "3. Delete dataset" << endl;
        cout << "4. Print Dataset" << endl;
        cout << "5. Ganti Struktur Data" << endl;
        cout << "6. Keluar" << endl;
        cout << "Pilih aksi (1-6): ";
        cin >> pilihan;

        if (pilihan == 1)
        {
            int opsi_kapasitas;
            cout << "\n=== PILIH KAPASITAS DATASET (BERDASARKAN EDGES / RUTE) ===" << endl;
            cout << "1. 100 Ribu Edges (Rute)" << endl;
            cout << "2. 500 Ribu Edges (Rute)" << endl;
            cout << "3. 1 Juta Edges (Rute)" << endl;
            cout << "4. 10 Juta Edges (Rute)" << endl;
            cout << "5. 20 Juta Edges (Rute)" << endl;
            cout << "6. Gunakan CSV Dummy (lokasi.csv & rute.csv)" << endl;
            cout << "Pilih opsi (1-6): ";
            cin >> opsi_kapasitas;

            unordered_map<string, Lokasi> data_lokasi;
            vector<Rute> data_rute;

            if (opsi_kapasitas >= 1 && opsi_kapasitas <= 5) {
                int limit_edges = 0;
                if (opsi_kapasitas == 1) limit_edges = 100000;
                else if (opsi_kapasitas == 2) limit_edges = 500000;
                else if (opsi_kapasitas == 3) limit_edges = 1000000;
                else if (opsi_kapasitas == 4) limit_edges = 10000000;
                else if (opsi_kapasitas == 5) limit_edges = 20000000;

                // Membaca file dengan limitasi berbasis rute (edge)
                loadDimacsData(data_lokasi, data_rute, limit_edges);
            }
            else if (opsi_kapasitas == 6) {
                data_lokasi = loadLokasi("lokasi.csv");
                data_rute = loadRute("rute.csv");
            }
            else {
                cout << "[!] Pilihan salah. Kembali ke menu utama." << endl;
                continue;
            }

            // Memulai perhitungan performa waktu insert ke dalam struktur graf
            timer.start();

            if (tipe_struktur == 1)
            {
                // Insert data ke Adjacency List
                for (auto it : data_lokasi)
                {
                    graf_list.masuk_lokasi(it.second);
                }
                for (auto it : data_rute)
                {
                    graf_list.masuk_rute(it);
                }
                data_list_masuk = true;
            }
            else
            {
                // Insert data ke Adjacency Matrix
                for (auto it : data_lokasi)
                {
                    graf_matrix.masuk_lokasi(it.second);
                }
                graf_matrix.alokasi_memori_matrix();
                for (auto it : data_rute)
                {
                    graf_matrix.masuk_rute(it);
                }
                data_matrix_masuk = true;
            }

            double waktu = timer.stop();
            cout << "\n[+] Waktu untuk Insert (" << nama_struktur << "): " << waktu << " mikrodetik" << endl;
        }
        else if (pilihan == 2)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }

            int input;
            cout << "Masukkan Lokasi Asal (1-50) = ";
            cin >> input;
            string asal = "Lokasi_" + to_string(input);

            int input2;
            cout << "Masukkan Lokasi Tujuan (1-50) = ";
            cin >> input2;
            cout << endl;
            string tujuan = "Lokasi_" + to_string(input2);

            timer.start();
            Rute *hasil = nullptr;
            if (tipe_struktur == 1)
            {
                hasil = graf_list.cari_rute(asal, tujuan);
            }
            else
            {
                hasil = graf_matrix.cari_rute(asal, tujuan);
            }
            double waktu_search = timer.stop();

            if (hasil != nullptr)
            {
                cout << "Rute ditemukan, Jarak: " << hasil->jarak_km << " km" << endl;
            }
            else
            {
                cout << "Rute tidak ditemukan." << endl;
            }
            cout << "Waktu pencarian (" << nama_struktur << "): " << waktu_search << " mikrodetik" << endl;
        }
        else if (pilihan == 3)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }

            int input3;
            cout << "Masukkan Lokasi Asal (1-50) = ";
            cin >> input3;
            string asal = "Lokasi_" + to_string(input3);

            int input4;
            cout << "Masukkan Lokasi Tujuan (1-50) = ";
            cin >> input4;
            cout << endl;
            string tujuan = "Lokasi_" + to_string(input4);

            timer.start();
            if (tipe_struktur == 1)
            {
                graf_list.hapus_rute(asal, tujuan);
            }
            else
            {
                graf_matrix.hapus_rute(asal, tujuan);
            }
            double waktu_delete = timer.stop();

            cout << "Kecepatan hapus (" << nama_struktur << "): " << waktu_delete << " mikrodetik" << endl;
        }
        else if (pilihan == 4)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }
            if (tipe_struktur == 1)
            {
                graf_list.print_dataset();
            }
            else
            {
                graf_matrix.print_dataset();
            }
        }
        else if (pilihan == 5)
        {
            // Reset tipe_struktur agar masuk ke pemilihan struktur data lagi
            tipe_struktur = 0;
            cout << "[+] Berhasil berpindah struktur data. Silakan pilih kembali.\n" << endl;
        }
        else if (pilihan == 6)
        {
            cout << "Berhasil Keluar" << endl;
        }
        else
        {
            cout << "Input tidak valid" << endl;
        }
    }
}
