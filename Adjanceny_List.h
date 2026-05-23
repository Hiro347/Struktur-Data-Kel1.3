#include "utils.h"
#include <bits/stdc++.h>

using namespace std;

class Adjency
{

public:
    unordered_map<string, Lokasi> daftar_lokasi;
    unordered_map<string, vector<Rute>> daftar_rute;

    void masuk_lokasi(Lokasi loc)
    {
        daftar_lokasi[loc.id_lokasi] = loc;
        daftar_rute[loc.id_lokasi] = vector<Rute>();
    };

    void masuk_rute(Rute r)
    {
        daftar_rute[r.lokasi_asal].push_back(r);
    }

    Rute *cari_rute(string n, string m)
    {
        for (auto &it : daftar_rute[n])
        {
            if (m == it.lokasi_tujuan)
            {
                return &it;
            }
        }
        return 0;
    }

    void hapus_rute(string n, string m)
    {
        auto &temp = daftar_rute[n];
        for (auto it = temp.begin(); it != temp.end(); ++it)
        {
            if (it->lokasi_tujuan == m)
            {
                temp.erase(it);
                break;
            }
        }
    }

    void print_dataset()
    {
        for (auto &it : daftar_rute)
        {

            cout << it.first;

            for (auto &r : it.second)
            {

                cout << " -> " << r.lokasi_tujuan << " (" << r.jarak_km << " km)";
            }

            cout << endl;
        }
    }
};
