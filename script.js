// Database lokal khusus penyimpanan data SIASSMANSALA
let dbSiassmansala = JSON.parse(localStorage.getItem('siassmansala_data')) || [];
let loggedInUser = ""; 

// ==========================================================================
// 1. FUNGSI NAVIGASI INTERAL PANEL
// ==========================================================================
function switchPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    
    const targetPanel = document.getElementById(id);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    const container = document.getElementById('main-container');
    if (!container) return;

    // Lebarkan container otomatis saat masuk ke form 5 menu
    if (id === 'panel-menu') {
        container.classList.add('wide');
    } else {
        container.classList.remove('wide');
    }
}

// ==========================================================================
// 2. FUNGSI LOGIN UTAMA (Username & Password)
// ==========================================================================
function loginSistem() {
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value;

    if (!userVal || !passVal) {
        Swal.fire('Perhatian', 'Silakan isi kolom Username dan Password!', 'warning');
        return;
    }

    // Memakai kunci utama bawaan lama Anda atau password sistem baru
    if (passVal === 'SMANSALAPERPUS2026##' || passVal === 'SIAS2026##') {
        loggedInUser = userVal; // Ikat nama pengguna ke sesi global
        
        Swal.fire({
            title: 'Berhasil Masuk!',
            text: `Selamat datang kembali, ${loggedInUser}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        }).then(() => {
            switchPanel('panel-menu');

            // Set kolom Menu Pengguna (readonly) secara otomatis
            const fieldUser = document.getElementById('menu-pengguna');
            if (fieldUser) {
                fieldUser.value = loggedInUser;
            }
        });
    } else {
        Swal.fire('Gagal Masuk', 'Password yang Anda masukkan salah!', 'error');
    }
}

// ==========================================================================
// 3. FUNGSI SIMPAN DATA (5 MENU UTAMA)
// ==========================================================================
function simpanDataSistem() {
    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;

    // Validasi kelengkapan bidang input
    if (!kelas || !nama || !mapel || !nilai) {
        return Swal.fire('Data Belum Lengkap', 'Silakan lengkapi seluruh isian formulir menu.', 'warning');
    }

    // Validasi kisaran angka input nilai
    const numNilai = parseFloat(nilai);
    if (isNaN(numNilai) || numNilai < 0 || numNilai > 100) {
        return Swal.fire('Nilai Tidak Valid', 'Isi kolom nilai dengan angka antara 0 - 100.', 'error');
    }

    // Pembuatan objek data berstruktur
    const recordBaru = {
        id: Date.now(),
        kelas: kelas,
        namaSiswa: nama,
        mataPelajaran: mapel,
        nilaiSiswa: numNilai,
        penggunaPetugas: pengguna,
        waktuSimpan: new Date().toLocaleString('id-ID')
    };

    // Eksekusi penyimpanan ke array lokal dan LocalStorage browser
    dbSiassmansala.push(recordBaru);
    localStorage.setItem('siassmansala_data', JSON.stringify(dbSiassmansala));

    Swal.fire({
        title: 'Tersimpan!',
        text: 'Data pengelolaan siswa berhasil diamankan ke sistem.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
    }).then(() => {
        // Bersihkan kolom isian (Kecuali menu pengguna agar tidak perlu login ulang)
        document.getElementById('menu-kelas').value = '';
        document.getElementById('menu-nama').value = '';
        document.getElementById('menu-mapel').value = '';
        document.getElementById('menu-nilai').value = '';
    });
}

// ==========================================================================
// 4. FUNGSI KELUAR / LOGOUT
// ==========================================================================
function logoutSistem() {
    Swal.fire({
        title: 'Keluar Aplikasi?',
        text: 'Sesi aktif Anda akan segera berakhir.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Keluar',
        cancelButtonText: 'Batal'
    }).then((res) => {
        if (res.isConfirmed) {
            // Pembersihan form login utama
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            loggedInUser = "";

            switchPanel('panel-awal');
        }
    });
      }
