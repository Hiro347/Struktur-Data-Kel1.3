#include <bits/stdc++.h>
#include "utils.h"
#include "Adjanceny_me.h"

using namespace std;

int main()
{
    Adjency graf;
    PerformanceTimer timer;

    bool data_sudah_masuk = false;
    int pilihan = 0;

    while (pilihan != 5)
    {
        cout << "\n=== Simple Sistem Rute ===" << endl;
        cout << "1. Insert dataset" << endl;
        cout << "2. Search dataset" << endl;
        cout << "3. Delete dataset" << endl;
        cout << "4. Print Dataset" << endl;
        cout << "5. Keluar" << endl;
        cout << "Pilih aksi (1-5): ";
        cin >> pilihan;

        if (pilihan == 1)
        {
            // Insert logic
            auto data_lokasi = loadLokasi("lokasi.csv");
            auto data_rute = loadRute("rute.csv");

            timer.start();

            // Insert data lokasi
            for (auto it : data_lokasi)
            {
                graf.masuk_lokasi(it.second);
            }

            // Insert data Rute
            for (auto it : data_rute)
            {
                graf.masuk_rute(it);
            }

            double waktu = timer.stop();
            cout << "Waktu untuk Insert : " << waktu << " mikrodetik" << endl;
            data_sudah_masuk = true;
        }
        else if (pilihan == 2)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu!" << endl;
                continue;
            }
            //==========================Logic search============================
            int input;
            cout << "Masukkan Lokasi Asal (1-50) = ";
            cin >> input;
            string asal = "Lokasi_" + to_string(input);

            int input2;
            cout << "Masukkan Lokasi Tujuan (1-50) = ";
            cin >> input2;
            cout << endl;
            string tujuan = "Lokasi_" + to_string(input2);

            // TIMER
            timer.start();
            Rute *hasil = graf.cari_rute(asal, tujuan);
            double waktu_search = timer.stop();

            if (hasil != 0)
            {
                cout << "Rute ditemukan, Jarak: " << hasil->jarak_km << " km" << endl;
                cout << "Waktu pencarian : " << waktu_search << " mikrodetik" << endl;
            }
            else
            {
                cout << "Rute tidak ditemukan." << endl;
                cout << "Waktu pencarian : " << waktu_search << " mikrodetik" << endl;
            }
        }
        else if (pilihan == 3)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu!" << endl;
                continue;
            }
            //===================================Logic delete=======================================
            int input3;
            cout << "Masukkan Lokasi Asal (1-50) = ";
            cin >> input3;
            string asal = "Lokasi_" + to_string(input3);

            int input4;
            cout << "Masukkan Lokasi Tujuan (1-50) = ";
            cin >> input4;
            cout << endl;
            string tujuan = "Lokasi_" + to_string(input4);

            // TIMER 
            timer.start();
            graf.hapus_rute(asal, tujuan);
            double waktu_delete = timer.stop();

            cout << "Kecepatan hapus: " << waktu_delete << " mikrodetik" << endl;
        }
        else if (pilihan == 4)
        {
            if (data_sudah_masuk == false)
            {
                cout << "[!] ERROR: Harap lakukan Insert Dataset (Menu 1) terlebih dahulu!" << endl;
                continue;
            }
            graf.print_dataset();
        }
        else if (pilihan == 5)
        {
            cout << "Berhasil Keluar" << endl;
        }
        else
        {
            cout << "Input tidak valid" << endl;
        }
    }
}