// ==========================================
// KONFIGURASI KONEKSI DATABASE SUPABASE (SUDAH TERHUBUNG)
// ==========================================
const SUPABASE_URL = "https://jtvfacdloqykdlbiariy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dmZhY2Rsb3F5a2RsYmlhcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzgzNTcsImV4cCI6MjA5NjUxNDM1N30.Q-zNIS0tki5Tn37P8R6u-LPTkOCnE2r5jllMj922N2k";

// MenginisialisASI Client Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let loggedInUser = ""; 

// List 10 Mata Pelajaran Wajib Sesuai Permintaan Anda
const mapelWajibDefault = [
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

// Ambil data mapel dari penyimpanan browser (localStorage) agar mapel kustom yang ditambahkan tidak hilang saat di-refresh
let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelWajibDefault;

// Jalankan pemuatan otomatis setelan dropdown mapel saat aplikasi terbuka
document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
});

// Fungsi memproses list array ke dalam bentuk elemen opsi select HTML
function muatPilihanMapel() {
    const selectMapel = document.getElementById('menu-mapel');
    if (!selectMapel) return;

    selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';

    listMapelSistem.forEach(mapel => {
        const option = document.createElement('option');
        option.value = mapel;
        option.textContent = mapel;
        selectMapel.appendChild(option);
    });
}

// Fungsi menambah/edit mata pelajaran sendiri secara langsung
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
            if (listMapelSistem.some(m => m.toLowerCase() === value.trim().toLowerCase())) {
                return 'Mata pelajaran tersebut sudah ada dalam daftar sistem!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const mapelBaru = result.value.trim();
            
            listMapelSistem.push(mapelBaru);
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            
            muatPilihanMapel();
            document.getElementById('menu-mapel').value = mapelBaru;

            Swal.fire({
                title: 'Berhasil!',
                text: `Mapel "${mapelBaru}" sukses ditambahkan ke daftar pilihan.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// Fungsi perpindahan halaman + Animasi Bergerak Mulus
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

// Eksekusi Login Sistem Admin Berdasarkan Akun Resmi
function loginSistem() {
    const userField = document.getElementById('login-username');
    const passField = document.getElementById('login-password');

    if (!userField || !passField) return;

    const userVal = userField.value.trim();
    const passVal = passField.value;

    if (!userVal || !passVal) {
        Swal.fire('Perhatian', 'Silakan masukkan Username dan Password Anda!', 'warning');
        return;
    }

    // VALIDASI USERNAME & PASSWORD FIX
    if (userVal === 'AdminSMANSALA#' && passVal === 'SIAS2026-27##') {
        loggedInUser = userVal;
        
        Swal.fire({
            title: 'Akses Diterima!',
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

// ==========================================================================
// LOGIKA UTAMA: MENGIRIM DATA FORMULIR KE CLOUD DATABASE SUPABASE
// ==========================================================================
async function simpanDataSistem() {
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

    // Tampilkan Loading Spinner saat proses upload sedang berjalan
    Swal.fire({
        title: 'Menyimpan Data...',
        text: 'Sedang menghubungkan ke server Supabase',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // Kirim data ke tabel 'data_siswa' di Supabase
    const { data, error } = await supabase
        .from('data_siswa')
        .insert([
            { 
                kelas: kelas, 
                nama_siswa: nama, 
                mata_pelajaran: mapel, 
                nilai_siswa: numNilai, 
                pengguna_petugas: pengguna 
            }
        ]);

    // Tutup loading spinner
    Swal.close();

    if (error) {
        console.error("Gagal Menyimpan ke Supabase:", error);
        Swal.fire('Gagal Menyimpan', 'Terjadi kesalahan sistem: ' + error.message, 'error');
    } else {
        Swal.fire({
            title: 'Berhasil Tersimpan!',
            text: 'Data pengelolaan siswa berhasil diamankan ke cloud database Supabase.',
            icon: 'success',
            confirmButtonColor: '#2563eb'
        }).then(() => {
            // Reset isian formulir setelah berhasil
            document.getElementById('menu-kelas').value = '';
            document.getElementById('menu-nama').value = '';
            document.getElementById('menu-mapel').value = '';
            document.getElementById('menu-nilai').value = '';
        });
    }
}

// Fungsi Keluar Sistem (Log Out)
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
