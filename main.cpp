#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#include <iostream>
#include <vector>
#include <string>
#include "utils.h"
#include "Adjacency_List.h"
#include "Adjacency_Matrix.h"
#include "httplib.h"

using namespace std;

struct BenchmarkMetrics {
    double insert_us = 0;
    double search_us = 0;
    double update_us = 0;
    double delete_us = 0;
    double ram_mb = 0;
};

inline string getJsonStringValue(const string& json, const string& key) {
    size_t pos = json.find("\"" + key + "\"");
    if (pos == string::npos) return "";
    size_t colon = json.find(":", pos);
    if (colon == string::npos) return "";
    size_t start_quote = json.find("\"", colon);
    if (start_quote == string::npos) {
        size_t next_comma = json.find(",", colon);
        size_t next_brace = json.find("}", colon);
        size_t end_pos = (next_comma != string::npos && next_comma < next_brace) ? next_comma : next_brace;
        if (end_pos == string::npos) return "";
        string val = json.substr(colon + 1, end_pos - colon - 1);
        val.erase(0, val.find_first_not_of(" \t\r\n"));
        val.erase(val.find_last_not_of(" \t\r\n") + 1);
        return val;
    }
    size_t end_quote = json.find("\"", start_quote + 1);
    if (end_quote == string::npos) return "";
    return json.substr(start_quote + 1, end_quote - start_quote - 1);
}

inline double getJsonDoubleValue(const string& json, const string& key) {
    string val = getJsonStringValue(json, key);
    if (val.empty()) {
        size_t pos = json.find("\"" + key + "\"");
        if (pos == string::npos) return 0.0;
        size_t colon = json.find(":", pos);
        if (colon == string::npos) return 0.0;
        size_t next_comma = json.find(",", colon);
        size_t next_brace = json.find("}", colon);
        size_t end_pos = (next_comma != string::npos && next_comma < next_brace) ? next_comma : next_brace;
        if (end_pos == string::npos) return 0.0;
        string num_str = json.substr(colon + 1, end_pos - colon - 1);
        try { return stod(num_str); } catch (...) { return 0.0; }
    }
    try { return stod(val); } catch (...) { return 0.0; }
}

inline BenchmarkMetrics run_benchmark_list(const unordered_map<string, Lokasi>& mapLokasi, const vector<Rute>& listRute) {
    BenchmarkMetrics m;
    double ram_before = get_current_ram_usage_mb();
    
    PerformanceTimer p_timer;
    p_timer.start();
    
    Adjacency graf_list_temp;
    for (auto& pair : mapLokasi) {
        graf_list_temp.masuk_lokasi(pair.second);
    }
    for (auto& rute : listRute) {
        graf_list_temp.masuk_rute(rute);
    }
    
    m.insert_us = p_timer.stop();
    
    double ram_after = get_current_ram_usage_mb();
    m.ram_mb = ram_after - ram_before;
    if (m.ram_mb < 0) m.ram_mb = 0;
    
    int batch_size = min(1000, (int)listRute.size());
    if (batch_size > 0) {
        p_timer.start();
        for (int i = 0; i < batch_size; ++i) {
            auto& r = listRute[i];
            graf_list_temp.cari_rute(r.lokasi_asal, r.lokasi_tujuan);
        }
        m.search_us = (double)p_timer.stop() / batch_size;
        
        p_timer.start();
        for (int i = 0; i < batch_size; ++i) {
            auto& r = listRute[i];
            graf_list_temp.update_rute(r.lokasi_asal, r.lokasi_tujuan, r.jarak_km * 1.1);
        }
        m.update_us = (double)p_timer.stop() / batch_size;
        
        p_timer.start();
        for (int i = 0; i < batch_size; ++i) {
            auto& r = listRute[i];
            graf_list_temp.hapus_rute(r.lokasi_asal, r.lokasi_tujuan);
        }
        m.delete_us = (double)p_timer.stop() / batch_size;
    }
    
    return m;
}

inline BenchmarkMetrics run_benchmark_matrix(const unordered_map<string, Lokasi>& mapLokasi, const vector<Rute>& listRute) {
    BenchmarkMetrics m;
    double ram_before = get_current_ram_usage_mb();
    
    PerformanceTimer p_timer;
    p_timer.start();
    
    AdjacencyMatrix graf_matrix_temp;
    try {
        for (auto& pair : mapLokasi) {
            graf_matrix_temp.masuk_lokasi(pair.second);
        }
        graf_matrix_temp.alokasi_memori_matrix();
        for (auto& rute : listRute) {
            graf_matrix_temp.masuk_rute(rute);
        }
        m.insert_us = p_timer.stop();
        
        double ram_after = get_current_ram_usage_mb();
        m.ram_mb = ram_after - ram_before;
        if (m.ram_mb < 0) m.ram_mb = 0;
        
        int batch_size = min(1000, (int)listRute.size());
        if (batch_size > 0) {
            p_timer.start();
            for (int i = 0; i < batch_size; ++i) {
                auto& r = listRute[i];
                graf_matrix_temp.cari_rute(r.lokasi_asal, r.lokasi_tujuan);
            }
            m.search_us = (double)p_timer.stop() / batch_size;
            
            p_timer.start();
            for (int i = 0; i < batch_size; ++i) {
                auto& r = listRute[i];
                graf_matrix_temp.update_rute(r.lokasi_asal, r.lokasi_tujuan, r.jarak_km * 1.1);
            }
            m.update_us = (double)p_timer.stop() / batch_size;
            
            p_timer.start();
            for (int i = 0; i < batch_size; ++i) {
                auto& r = listRute[i];
                graf_matrix_temp.hapus_rute(r.lokasi_asal, r.lokasi_tujuan);
            }
            m.delete_us = (double)p_timer.stop() / batch_size;
        }
    } catch (...) {
        m.insert_us = -1;
        m.search_us = -1;
        m.update_us = -1;
        m.delete_us = -1;
        m.ram_mb = -1;
    }
    return m;
}

inline void exportBenchmarkToJSON(const string& filename, const string& json_data) {
    ofstream out(filename);
    out << json_data;
    out.close();
    cout << "[+] Hasil benchmark disimpan ke: " << filename << endl;
}

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
    while (app_mode != 1 && app_mode != 2 && app_mode != 3) {
        cout << "=== PILIH MODE APLIKASI ===\n";
        cout << "1. CLI Mode\n";
        cout << "2. Web Server Mode\n";
        cout << "3. Run & Export Full Benchmark to JSON\n";
        cout << "Pilih mode (1-3): ";
        cin >> app_mode;
    }

    if (app_mode == 3) {
        cout << "[+] Menjalankan Full Benchmark (100K, 500K, 1M, 5M) untuk eksport JSON...\n";
        vector<int> limits = {100000, 500000, 1000000, 5000000};
        string resp = "[\n";
        for (size_t i = 0; i < limits.size(); ++i) {
            int limit = limits[i];
            cout << "    -> Memproses limit: " << limit << " edges...\n";
            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, limit);

            BenchmarkMetrics m_list = run_benchmark_list(mapLokasi, listRute);
            BenchmarkMetrics m_matrix = run_benchmark_matrix(mapLokasi, listRute);

            if (i > 0) resp += ",\n";
            resp += "  {\n";
            resp += "    \"limit\": " + to_string(limit) + ",\n";
            resp += "    \"list\": {\n";
            resp += "      \"insert_us\": " + to_string(m_list.insert_us) + ",\n";
            resp += "      \"search_us\": " + to_string(m_list.search_us) + ",\n";
            resp += "      \"update_us\": " + to_string(m_list.update_us) + ",\n";
            resp += "      \"delete_us\": " + to_string(m_list.delete_us) + ",\n";
            resp += "      \"ram_mb\": " + to_string(m_list.ram_mb) + "\n";
            resp += "    },\n";
            resp += "    \"matrix\": {\n";
            resp += "      \"insert_us\": " + to_string(m_matrix.insert_us) + ",\n";
            resp += "      \"search_us\": " + to_string(m_matrix.search_us) + ",\n";
            resp += "      \"update_us\": " + to_string(m_matrix.update_us) + ",\n";
            resp += "      \"delete_us\": " + to_string(m_matrix.delete_us) + ",\n";
            resp += "      \"ram_mb\": " + to_string(m_matrix.ram_mb) + "\n";
            resp += "    }\n";
            resp += "  }";
        }
        resp += "\n]";
        
        exportBenchmarkToJSON("./web/benchmark_results.json", resp);
        return 0;
    }

    if (app_mode == 2) {
        cout << "[+] Memulai Web Server di port 8080...\n";
        httplib::Server svr;

        svr.set_mount_point("/", "./web");

        svr.Get("/api/animasi", [](const httplib::Request& req, httplib::Response& res) {
            int limit = 500;
            if (req.has_param("limit")) {
                try { limit = stoi(req.get_param_value("limit")); }
                catch (...) { limit = 500; }
            }
            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, limit);

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
            
            string body = req.body;
            string limit_val = getJsonStringValue(body, "limit");
            if (!limit_val.empty()) {
                try { limit = stoi(limit_val); } catch (...) {}
            }
            string struct_val = getJsonStringValue(body, "struktur");
            if (struct_val == "matrix") {
                struktur = "matrix";
            }

            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, limit);

            double ram_sebelum = get_current_ram_usage_mb();
            
            PerformanceTimer p_timer;
            p_timer.start();

            bool success = true;
            string error_msg = "";

            try {
                if (struktur == "list") {
                    graf_list.daftar_lokasi.clear();
                    graf_list.daftar_rute.clear();
                    for (auto& pair : mapLokasi) graf_list.masuk_lokasi(pair.second);
                    for (auto& rute : listRute) graf_list.masuk_rute(rute);
                } else {
                    graf_matrix.daftar_lokasi.clear();
                    graf_matrix.lokasi_ke_index.clear();
                    graf_matrix.index_ke_lokasi.clear();
                    graf_matrix.matrix_rute.clear();
                    graf_matrix.jumlah_lokasi = 0;
                    for (auto& pair : mapLokasi) graf_matrix.masuk_lokasi(pair.second);
                    graf_matrix.alokasi_memori_matrix();
                    for (auto& rute : listRute) graf_matrix.masuk_rute(rute);
                }
            } catch (const std::exception& e) {
                success = false;
                error_msg = e.what();
            } catch (...) {
                success = false;
                error_msg = "std::bad_alloc";
            }

            double waktu_us = p_timer.stop();
            double ram_sesudah = get_current_ram_usage_mb();

            double diff_ram = ram_sesudah - ram_sebelum;
            if (diff_ram < 0) diff_ram = 0;

            string resp;
            if (success) {
                resp = "{\"waktu_ms\": " + to_string(waktu_us / 1000.0) + ", \"ram_mb\": " + to_string(diff_ram) + "}";
            } else {
                resp = "{\"waktu_ms\": -1, \"ram_mb\": -1, \"error\": \"" + error_msg + "\"}";
            }
            res.set_content(resp, "application/json");
        });

        svr.Post("/api/update", [&](const httplib::Request& req, httplib::Response& res) {
            string body = req.body;
            string asal = getJsonStringValue(body, "asal");
            string tujuan = getJsonStringValue(body, "tujuan");
            double jarak = getJsonDoubleValue(body, "jarak");
            string struktur = getJsonStringValue(body, "struktur");

            PerformanceTimer p_timer;
            p_timer.start();

            if (struktur == "matrix") {
                graf_matrix.update_rute(asal, tujuan, jarak);
            } else {
                graf_list.update_rute(asal, tujuan, jarak);
            }

            double waktu_us = p_timer.stop();
            string resp = "{\"waktu_us\": " + to_string(waktu_us) + "}";
            res.set_content(resp, "application/json");
        });

        svr.Post("/api/benchmark-compare", [&](const httplib::Request& req, httplib::Response& res) {
            int limit = 100000;
            string body = req.body;
            string limit_val = getJsonStringValue(body, "limit");
            if (!limit_val.empty()) {
                try { limit = stoi(limit_val); } catch (...) {}
            }

            unordered_map<string, Lokasi> mapLokasi;
            vector<Rute> listRute;
            loadDimacsData(mapLokasi, listRute, limit);

            BenchmarkMetrics metrics_list = run_benchmark_list(mapLokasi, listRute);
            BenchmarkMetrics metrics_matrix = run_benchmark_matrix(mapLokasi, listRute);

            string resp = "{";
            resp += "\"limit\": " + to_string(limit) + ",";
            resp += "\"list\": {";
            resp += "\"insert_us\": " + to_string(metrics_list.insert_us) + ",";
            resp += "\"search_us\": " + to_string(metrics_list.search_us) + ",";
            resp += "\"update_us\": " + to_string(metrics_list.update_us) + ",";
            resp += "\"delete_us\": " + to_string(metrics_list.delete_us) + ",";
            resp += "\"ram_mb\": " + to_string(metrics_list.ram_mb);
            resp += "},";
            resp += "\"matrix\": {";
            resp += "\"insert_us\": " + to_string(metrics_matrix.insert_us) + ",";
            resp += "\"search_us\": " + to_string(metrics_matrix.search_us) + ",";
            resp += "\"update_us\": " + to_string(metrics_matrix.update_us) + ",";
            resp += "\"delete_us\": " + to_string(metrics_matrix.delete_us) + ",";
            resp += "\"ram_mb\": " + to_string(metrics_matrix.ram_mb);
            resp += "}";
            resp += "}";

            res.set_content(resp, "application/json");
        });

        svr.Post("/api/full-benchmark", [&](const httplib::Request& req, httplib::Response& res) {
            vector<int> limits = {100000, 500000, 1000000, 5000000};
            
            string body = req.body;
            size_t lim_pos = body.find("\"limits\"");
            if (lim_pos != string::npos) {
                size_t start_arr = body.find("[", lim_pos);
                size_t end_arr = body.find("]", lim_pos);
                if (start_arr != string::npos && end_arr != string::npos && end_arr > start_arr) {
                    limits.clear();
                    string arr_content = body.substr(start_arr + 1, end_arr - start_arr - 1);
                    stringstream ss(arr_content);
                    string item;
                    while (getline(ss, item, ',')) {
                        try {
                            limits.push_back(stoi(item));
                        } catch (...) {}
                    }
                }
            }

            string resp = "[";
            for (size_t i = 0; i < limits.size(); ++i) {
                int limit = limits[i];
                unordered_map<string, Lokasi> mapLokasi;
                vector<Rute> listRute;
                loadDimacsData(mapLokasi, listRute, limit);

                BenchmarkMetrics m_list = run_benchmark_list(mapLokasi, listRute);
                BenchmarkMetrics m_matrix = run_benchmark_matrix(mapLokasi, listRute);

                if (i > 0) resp += ",";
                resp += "{";
                resp += "\"limit\": " + to_string(limit) + ",";
                resp += "\"list\": {";
                resp += "\"insert_us\": " + to_string(m_list.insert_us) + ",";
                resp += "\"search_us\": " + to_string(m_list.search_us) + ",";
                resp += "\"update_us\": " + to_string(m_list.update_us) + ",";
                resp += "\"delete_us\": " + to_string(m_list.delete_us) + ",";
                resp += "\"ram_mb\": " + to_string(m_list.ram_mb);
                resp += "},";
                resp += "\"matrix\": {";
                resp += "\"insert_us\": " + to_string(m_matrix.insert_us) + ",";
                resp += "\"search_us\": " + to_string(m_matrix.search_us) + ",";
                resp += "\"update_us\": " + to_string(m_matrix.update_us) + ",";
                resp += "\"delete_us\": " + to_string(m_matrix.delete_us) + ",";
                resp += "\"ram_mb\": " + to_string(m_matrix.ram_mb);
                resp += "}";
                resp += "}";
            }
            resp += "]";

            exportBenchmarkToJSON("./web/benchmark_results.json", resp);

            res.set_content(resp, "application/json");
        });

        svr.listen("localhost", 8080);
        return 0;
    }

    while (pilihan != 7)
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
        cout << "3. Update dataset" << endl;
        cout << "4. Delete dataset" << endl;
        cout << "5. Print Dataset" << endl;
        cout << "6. Ganti Struktur Data" << endl;
        cout << "7. Keluar" << endl;
        cout << "Pilih aksi (1-7): ";
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

            if (tipe_struktur == 1)
            {
                unordered_map<string, Lokasi>().swap(graf_list.daftar_lokasi);
                unordered_map<string, vector<Rute>>().swap(graf_list.daftar_rute);
            }
            else
            {
                unordered_map<string, Lokasi>().swap(graf_matrix.daftar_lokasi);
                unordered_map<string, int>().swap(graf_matrix.lokasi_ke_index);
                vector<string>().swap(graf_matrix.index_ke_lokasi);
                vector<vector<Rute>>().swap(graf_matrix.matrix_rute);
                graf_matrix.jumlah_lokasi = 0;
            }

            double ram_sebelum = get_current_ram_usage_mb();
            timer.start();

            if (tipe_struktur == 1)
            {
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
                try {
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
                } catch (const std::exception& e) {
                    cout << "\n[!] ERROR: Gagal alokasi matriks (" << e.what() << ")" << endl;
                    cout << "[!] Adjacency Matrix dibatasi maks 5000 lokasi karena kompleksitas O(V^2)." << endl;
                    continue;
                } catch (...) {
                    cout << "\n[!] ERROR: Gagal alokasi memori (Out Of Memory)" << endl;
                    continue;
                }
            }

            double waktu = timer.stop();
            double ram_sesudah = get_current_ram_usage_mb();
            double ram_penggunaan = ram_sesudah - ram_sebelum;
            if (ram_penggunaan < 0) ram_penggunaan = 0.0;

            cout << "\n[+] Waktu untuk Insert (" << nama_struktur << "): " << waktu << " mikrodetik" << endl;
            cout << "[+] Penggunaan RAM saat Insert: " << ram_penggunaan << " MB" << endl;
        }
        else if (pilihan == 2)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }

            string asal, tujuan;
            cout << "Masukkan ID Lokasi Asal (contoh: Lokasi_1023) = ";
            cin >> asal;
            cout << "Masukkan ID Lokasi Tujuan (contoh: Lokasi_5041) = ";
            cin >> tujuan;
            cout << endl;

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
        else if (pilihan == 3) // Update
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }

            string asal, tujuan;
            double jarak_baru;
            cout << "Masukkan ID Lokasi Asal (contoh: Lokasi_1023): ";  cin >> asal;
            cout << "Masukkan ID Lokasi Tujuan (contoh: Lokasi_5041): "; cin >> tujuan;
            cout << "Masukkan Jarak Baru (km): ";  cin >> jarak_baru;

            timer.start();
            if (tipe_struktur == 1)
                graf_list.update_rute(asal, tujuan, jarak_baru);
            else
                graf_matrix.update_rute(asal, tujuan, jarak_baru);
            double waktu_update = timer.stop();

            cout << "Kecepatan update (" << nama_struktur << "): " << waktu_update << " mikrodetik" << endl;
        }
        else if (pilihan == 4) // Delete
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu untuk " << nama_struktur << "!" << endl;
                continue;
            }

            string asal, tujuan;
            cout << "Masukkan ID Lokasi Asal (contoh: Lokasi_1023) = ";
            cin >> asal;
            cout << "Masukkan ID Lokasi Tujuan (contoh: Lokasi_5041) = ";
            cin >> tujuan;
            cout << endl;

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
        else if (pilihan == 5)
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
        else if (pilihan == 6)
        {
            tipe_struktur = 0;
            cout << "[+] Berhasil berpindah struktur data. Silakan pilih kembali.\n" << endl;
        }
        else if (pilihan == 7)
        {
            cout << "Berhasil Keluar" << endl;
        }
        else
        {
            cout << "Input tidak valid" << endl;
        }
    }
}
