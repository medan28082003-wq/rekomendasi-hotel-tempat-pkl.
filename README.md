# Rekomendasi Hotel Tempat PKL

Website responsif berbahasa Indonesia untuk menampilkan rekomendasi hotel, login Google, formulir minat PKL, dan dashboard pemilik. Dibuat dengan HTML/CSS/JavaScript dan Firebase.

## Sebelum mulai
- Siapkan akun Google.
- Gunakan komputer/laptop bila memungkinkan; pengaturan Firebase lebih mudah di layar besar. Dari HP Android, buka browser dan aktifkan "Situs desktop".
- Jangan bagikan password, private key, atau file service-account.

## 1. Buat proyek Firebase
1. Buka https://console.firebase.google.com/ lalu pilih **Add project**.
2. Buat proyek, lalu tambahkan aplikasi Web (ikon `</>`).
3. Salin konfigurasi Firebase yang diberikan.

## 2. Aktifkan login Google
1. Firebase Console → **Authentication** → **Get started** → **Sign-in method**.
2. Aktifkan **Google** dan pilih email dukungan proyek.
3. Di Authentication → Settings → Authorized domains, tambahkan domain hosting yang digunakan bila belum terdaftar.

## 3. Buat database
1. Firebase Console → **Firestore Database** → **Create database**.
2. Pilih lokasi yang sesuai dengan kebutuhan pengguna dan kebijakan data. Lokasi database sulit dipindahkan setelah dibuat.
3. Buka tab **Rules**. Salin isi `firestore.rules` dari proyek ini.
4. Ganti `GANTI_DENGAN_EMAIL_PEMILIK@gmail.com` dengan email Google pemilik, lalu **Publish**.
5. Aturan yang sama juga harus diperbarui di file `firestore.rules` sebelum deploy.

## 4. Isi konfigurasi di app.js
Buka `app.js` dengan editor teks.
- Ganti semua nilai `GANTI_DENGAN_...` pada `firebaseConfig` dengan konfigurasi aplikasi Web dari Firebase.
- Ganti `ADMIN_EMAIL` dengan email Google pemilik.
- Simpan. Jangan menambahkan service-account key atau private key ke `app.js`.

Penting: email admin pada `app.js` hanya mengatur tampilan dashboard. Perlindungan data sesungguhnya dilakukan oleh Firestore Rules. Email pemilik di kedua tempat harus sama.

## 5. Terbitkan website dengan Firebase Hosting
1. Pasang Node.js dari https://nodejs.org/ pada komputer.
2. Buka terminal di folder proyek.
3. Jalankan:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy
   ```
4. Pilih proyek Firebase yang benar saat diminta. URL website akan tampil setelah deploy.
5. Jika menggunakan HP saja, gunakan komputer/cloud development environment yang mendukung terminal; Firebase Console sendiri tidak meng-host folder website secara otomatis.

## 6. Uji keamanan dan fitur
- Buka URL publik dengan mode incognito: halaman hotel harus terlihat.
- Login menggunakan akun pengunjung dan kirim formulir uji.
- Pastikan akun pengunjung tidak bisa membaca koleksi `applications`.
- Login menggunakan email pemilik yang ditentukan: dashboard admin dan data pendaftar harus terlihat.
- Uji tambah/hapus hotel, lalu uji kembali dengan akun biasa.
- Hapus data pendaftar uji setelah selesai.

## 7. Agar ditemukan di Google
1. Buka https://search.google.com/search-console/ dan tambahkan properti domain/URL.
2. Verifikasi kepemilikan domain.
3. Minta pengindeksan URL utama melalui URL Inspection.
4. Tambahkan informasi asli dan berguna tentang setiap hotel, hindari konten salinan atau klaim lowongan yang belum diverifikasi.
5. Indeks dan peringkat tidak langsung muncul dan tidak dapat dijamin. Jika memakai domain sendiri, siapkan domain dan DNS terlebih dahulu.

## Catatan penting
- Kartu "Hotel Contoh" adalah data demo, bukan rekomendasi nyata dan bukan lowongan terkonfirmasi. Ganti/hapus setelah konfigurasi.
- Data pendaftar mengandung informasi pribadi. Batasi akses, berikan pemberitahuan privasi, jangan meminta data sensitif, dan hapus data saat tidak diperlukan.
- Website ini tidak otomatis mengirim email pemberitahuan, memverifikasi kuota PKL, atau menghubungi hotel.
- Untuk situs produksi, pertimbangkan App Check, pembatasan spam, kebijakan privasi, serta pengujian Firestore Rules yang lebih lengkap.
