#include <iostream>
#include <vector>
#include <string>
#include "utils.h"
#include "Adjacency_List.h"
#include "Adjacency_Matrix.h"

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
            auto data_lokasi = loadLokasi("lokasi.csv");
            auto data_rute = loadRute("rute.csv");

            timer.start();

            if (tipe_struktur == 1)
            {
                // Insert data lokasi
                for (auto it : data_lokasi)
                {
                    graf_list.masuk_lokasi(it.second);
                }
                // Insert data Rute
                for (auto it : data_rute)
                {
                    graf_list.masuk_rute(it);
                }
                data_list_masuk = true;
            }
            else
            {
                // Insert data lokasi
                for (auto it : data_lokasi)
                {
                    graf_matrix.masuk_lokasi(it.second);
                }
                // Insert data Rute
                for (auto it : data_rute)
                {
                    graf_matrix.masuk_rute(it);
                }
                data_matrix_masuk = true;
            }

            double waktu = timer.stop();
            cout << "Waktu untuk Insert (" << nama_struktur << "): " << waktu << " mikrodetik" << endl;
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
