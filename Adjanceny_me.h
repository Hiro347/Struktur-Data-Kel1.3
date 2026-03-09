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
};
