ROADMAP

TAHAP 0:
1. UI KIT app.tsx, main.tsx
2. Setup Skill dan Agents.md

📌 TAHAP 1: Setup Workspace & Struktur Folder Dasar
Fokus: Mempersiapkan fondasi backend dan frontend agar saling terhubung di localhost.

* Instalasi Lingkungan Lokal:
    * Unduh dan instal TeX Live atau MacTeX. Pastikan perintah pdflatex --version berfungsi di terminal.
    * Setup folder utama proyek: Buat folder bernama latex-ide/ dengan dua subfolder: frontend/ dan backend /
* Inisialisasi Backend (FastAPI):
    * Buat file main.py dan buat folder penampung proyek bernama latex_workspaces/.
    * Nyalakan server FastAPI di http://localhost:8000.
* Inisialisasi Frontend (Vite + React):
    * Instal Vite React di folder frontend: npm create vite@latest . -- --template react
    * Nyalakan server frontend di http://localhost:5173.
* Uji Koneksi Awal (CORS): Pastikan frontend bisa melakukan fetch() ke backend tanpa terkena blokir kebijakan CORS.

📌 TAHAP 2: Workspace & File Tree (Manajemen Folder)
Fokus: Mengatur cara sistem mendeteksi folder proyek dan menampilkannya di UI.

* Pembuatan Endpoint Folder (Backend):
    * Implementasikan API untuk membuat folder proyek baru (/api/projects).
    * Implementasikan API untuk scan isi folder (/api/projects/{name}/files) guna membaca file .tex.
* Desain Layout Multi-Panel (Frontend):
    * Pasang pustaka react-resizable-panels.
    * Bagi layar menjadi 3 kolom: Sidebar (kiri), Editor Teks (tengah), dan Preview PDF (kanan).
* Komponen Sidebar File Tree:
    * Buat daftar file dinamis di panel kiri berdasarkan hasil scan folder dari API backend.
    * Pastikan jika user mengklik salah satu file .tex, sistem bisa memicu aksi berikutnya.

📌 TAHAP 3: Engine Editor Teks & Sinkronisasi File
Fokus: Menghadirkan pengalaman mengetik layaknya VS Code dan sistem simpan otomatis.

* Integrasi Monaco Editor:
    * Pasang pustaka @monaco-editor/react pada panel tengah.
    * Atur konfigurasi bahasa editor ke latex agar mendapatkan syntax highlighting bawaan.
* Fitur Membaca Isi File (Load Teks): Hubungkan event klik file di Sidebar agar memicu API GET backend untuk mengambil string teks dokumen .tex dan memasukkannya ke Monaco Editor.
* Fitur Simpan File (Save Teks):
    * Implementasikan API PUT backend untuk menimpa/menulis teks baru ke dalam file fisik di laptop.
    * Buat fungsi event listener di React untuk mendeteksi shortcut Ctrl + S (atau Cmd + S) agar otomatis mengirimkan isi teks editor terbaru ke backend.

📌 TAHAP 4: Compiler LaTeX Lokal & Preview PDF
Fokus: Mengubah kode teks di editor menjadi dokumen PDF riil secara instan.

* Pembuatan API Compiler (Backend):
    * Buat endpoint POST /api/projects/{name}/compile.
    * Gunakan modul Python subprocess.run untuk mengeksekusi perintah terminal: pdflatex -interaction=nonstopmode -output-directory=. main.tex
    * Atur parameter cwd (Current Working Directory) di Python agar proses kompilasi berjalan tepat di dalam folder proyek tersebut.
* Penanganan Hasil Kompilasi:
    * Jika sukses, backend akan membaca file main.pdf yang terbentuk lalu mengirimkannya ke frontend menggunakan FileResponse.
    * Jika gagal, backend akan membaca file main.log, menyaring pesan error-nya, dan mengirimkan log error ke frontend dengan status HTTP 400.
* Komponen Preview PDF (Frontend):
    * Gunakan tag <iframe> di panel kanan.
    * Ubah source (src) dari <iframe> menggunakan objek Blob URL dari file PDF yang dikirim oleh backend 

📌 TAHAP 5: Integrasi Asisten Pintar AI Lokal (Ollama)
Fokus: Menambahkan kecerdasan buatan untuk membantu menulis dan memperbaiki eror tanpa internet.

* Setup Model AI Offline:
    * Instal Ollama di laptop Anda.
    * Unduh model khusus coding yang ringan melalui terminal, contohnya: ollama run deepseek-coder:1.3b atau ollama run qwen2.5-coder:1.5b (sangat ringan untuk laptop standar).
* Jembatan AI di Backend:
    * Instal pustaka Python: pip install ollama.
    * Buat endpoint API /api/ai/fix-error. Jika kompilasi di Tahap 4 menghasilkan status error, kirimkan potongan teks kode yang rusak beserta isi log pesan erornya ke Ollama dengan instruksi prompt perbaiki sintaks LaTeX tersebut.
* Fitur AI di Antarmuka (Frontend):
    * Tambahkan tombol "Perbaiki dengan AI" di panel editor yang hanya muncul ketika proses kompilasi mendeteksi adanya eror.
    * Tampilkan teks saran perbaikan dari AI di jendela pop-up (modal) atau berikan opsi bagi user untuk langsung mengganti kode yang rusak dengan satu klik.

📌 TAHAP 6: Navigasi Dua Arah SyncTeX & Native PDF.js Viewport (Selesai)
Fokus: Menghadirkan sinkronisasi presisi tinggi antara teks editor LaTeX dan dokumen PDF preview secara dua arah (bidirectional).

* Kompilasi dengan Flag SyncTeX:
    * Menambahkan flag `-synctex=1` pada eksekusi `pdflatex` di `backend/services/compiler.py` untuk menghasilkan file `.synctex.gz`.
* Backend Engine SyncTeX (FastAPI Subprocess):
    * Modul `backend/services/synctex.py` mengeksekusi CLI `synctex edit` (inverse) dan `synctex view` (forward) secara asynchronous tanpa memblokir server event loop.
    * Endpoint `POST /api/projects/{name}/synctex/inverse`: Menerima nomor halaman dan koordinat X/Y (72 DPI points), mengembalikan file sumber dan baris baris LaTeX target.
    * Endpoint `POST /api/projects/{name}/synctex/forward`: Menerima nama file `.tex` dan nomor baris editor, mengembalikan halaman target dan koordinat box PDF.
* Frontend Native Multi-Page PDF.js Canvas Viewer:
    * Migrasi dari wrapper pihak ketiga ke canvas rendering multi-halaman continuous berbasis `pdfjs-dist` langsung.
    * Rasio aspek halaman (A4, US Letter, Beamer) terjamin 100% presisi tanpa distorsi CSS.
    * Dukungan layar Retina / High-DPI: Menggunakan penyesuaian matriks transformasi canvas (`transform: [dpr, 0, 0, dpr, 0, 0]`) agar teks sangat tajam tanpa terpotong di layar resolusi tinggi.
    * Fitur Fit to Width, Fit to Page, dan zoom dinamis (25% - 300%).
* Interaksi Navigasi Dua Arah:
    * Inverse Search: Double-click pada teks di halaman PDF memicu lompatan instan ke baris kode di Monaco Editor, dengan efek visual animasi pulse line highlight (1.5s), serta otomatis membuka tab file baru jika target berada di subfile terpisah.
    * Forward Search: Shortcut keyboard `Cmd/Ctrl + Alt + J` atau tombol "Sync to PDF" di Ribbon Bar melompatkan viewport preview ke halaman dan posisi paragraf yang bersangkutan dengan overlay highlight box.


📌 TAHAP 7: Manajemen Bibliografi, Style Switcher & Preamble Guard (Selesai)
Fokus: Integrasi sitasi dan bibliografi multi-format (APA, IEEE, Custom) dengan pengaman preamble otomatis dan resolusi multi-pass.

* Integrasi Style Switcher UI (Frontend):
    * Menu References Ribbon > Citations & Bibliography menyediakan tab Style untuk memilih APA Style (Author, Year), IEEE Style (Numeric [1]), atau Custom Style (.bst bebas).
    * Fitur pengaman dokumen (`styleGuardHelper.ts`) menyuntikkan paket `\usepackage{apalike}` ke preamble secara otomatis jika memilih APA, dan membersihkan paket yang berkonflik jika beralih ke IEEE.
    * Penempatan otomatis perintah `\bibliographystyle{...}` dan `\bibliography{...}` sebelum `\end{document}` tanpa merusak isi naskah.
* Kompilasi Multi-Pass Bebas Tanda Tanya [?]:
    * Engine kompilasi backend mendeteksi pemanggilan sitasi dan bibliografi dari file `.aux` lalu mengeksekusi urutan `pdflatex` -> `bibtex` -> `pdflatex` -> `pdflatex`.
    * Resolusi referensi silang tuntas hingga tanda tanya `[?]` terisi dengan nama penulis & tahun (APA) atau nomor referensi (IEEE).
