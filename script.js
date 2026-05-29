let dbSiassmansala = JSON.parse(localStorage.getItem('siassmansala_data')) || [];
let loggedInUser = ""; 

// Daftar Mata Pelajaran Default sesuai permintaan Anda
const mapelDefault = [
    "Bahasa Indonesia",
    "Bahasa Sunda",
    "Bahasa Inggris",
    "Matematika",
    "Informatika",
    "Biologi",
    "Fisika",
    "Sejarah",
    "Ekonomi",
    "PKWU"
];

// Ambil daftar mapel kustom dari localStorage jika ada, kalau tidak gunakan default
let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelDefault;

// Jalankan fungsi memuat data pilihan mapel saat aplikasi pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
});

// Fungsi untuk memasukkan array mapel ke elemen select HTML
function muatPilihanMapel() {
    const selectMapel = document.getElementById('menu-mapel');
    if (!selectMapel) return;

    // Bersihkan isi sebelumnya, buat placeholder awal
    selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';

    // Loop data mapel ke dalam tag option
    listMapelSistem.forEach(mapel => {
        const option = document.createElement('option');
        option.value = mapel;
        option.textContent = mapel;
        selectMapel.appendChild(option);
    });
}

// Fungsi untuk menambah Mata Pelajaran baru sendiri langsung dari layar aplikasi
function tambahMapelKustom() {
    Swal.fire({
        title: 'Tambah Mapel Baru',
        input: 'text',
        inputPlaceholder: 'Tulis nama mata pelajaran baru...',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Tambahkan',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value) {
                return 'Nama mata pelajaran tidak boleh kosong!';
            }
            // Mencegah duplikasi nama mapel yang sama
            if (listMapelSistem.some(m => m.toLowerCase() === value.trim().toLowerCase())) {
                return 'Mata pelajaran ini sudah terdaftar di sistem!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const namaMapelBaru = result.value.trim();
            
            // Masukkan ke array sistem dan amankan ke localStorage
            listMapelSistem.push(namaMapelBaru);
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            
            // Refresh ulang isi dropdown select
            muatPilihanMapel();
            
            // Set otomatis pilihan dropdown ke mapel baru tersebut
            document.getElementById('menu-mapel').value = namaMapelBaru;

            Swal.fire({
                title: 'Berhasil!',
                text: `Mapel "${namaMapelBaru}" telah ditambahkan ke menu pilihan.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// Fungsi navigasi dengan efek transisi animasi bergerak
function switchPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    
    const targetPanel = document.getElementById(id);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    const container = document.getElementById('main-container');
    if (!container) return;

    if (id === 'panel-menu') {
        container.classList.add('wide');
    } else {
        container.classList.remove('wide');
    }
}

// Fungsi eksekusi login SIASSMANSALA
function loginSistem() {
    const userField = document.getElementById('login-username');
    const passField = document.getElementById('login-password');

    if (!userField || !passField) return;

    const userVal = userField.value.trim();
    const passVal = passField.value;

    if (!userVal || !passVal) {
        Swal.fire('Perhatian', 'Silakan isi kolom Username dan Password!', 'warning');
        return;
    }

    // PENGECEKAN KREDENSIAL AKUN UTAMA
    if (userVal === 'AdminSMANSALA#' && passVal === 'SIAS2026-27##') {
        loggedInUser = userVal; 
        
        Swal.fire({
            title: 'Berhasil Masuk!',
            text: `Selamat datang kembali, ${loggedInUser}`,
            icon: 'success',
            timer: 1100,
            showConfirmButton: false
        }).then(() => {
            switchPanel('panel-menu');

            const fieldUser = document.getElementById('menu-pengguna');
            if (fieldUser) {
                fieldUser.value = loggedInUser;
            }
        });
    } else {
        Swal.fire('Gagal Masuk', 'Username atau Password salah!', 'error');
    }
}

// Fungsi Simpan Formulir 5 Menu Utama
function simpanDataSistem() {
    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;

    if (!kelas || !nama || !mapel || !nilai) {
        return Swal.fire('Data Belum Lengkap', 'Silakan lengkapi seluruh isian formulir menu.', 'warning');
    }

    const numNilai = parseFloat(nilai);
    if (isNaN(numNilai) || numNilai < 0 || numNilai > 100) {
        return Swal.fire('Nilai Tidak Valid', 'Isi kolom nilai dengan angka antara 0 - 100.', 'error');
    }

    const recordBaru = {
        id: Date.now(),
        kelas: kelas,
        namaSiswa: nama,
        mataPelajaran: mapel,
        nilaiSiswa: numNilai,
        penggunaPetugas: pengguna,
        waktuSimpan: new Date().toLocaleString('id-ID')
    };

    dbSiassmansala.push(recordBaru);
    localStorage.setItem('siassmansala_data', JSON.stringify(dbSiassmansala));

    Swal.fire({
        title: 'Tersimpan!',
        text: 'Data pengelolaan siswa berhasil diamankan ke sistem.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
    }).then(() => {
        document.getElementById('menu-kelas').value = '';
        document.getElementById('menu-nama').value = '';
        document.getElementById('menu-mapel').value = '';
        document.getElementById('menu-nilai').value = '';
    });
}

// Fungsi Log Out Sistem
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
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            loggedInUser = "";
            switchPanel('panel-awal');
        }
    });
}
