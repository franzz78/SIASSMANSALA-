// ==========================================
// KONFIGURASI ENGINE INTEGRASI SUPABASE CLOUD
// ==========================================
const SUPABASE_URL = "https://jtvfacdloqykdlbiariy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dmZhY2Rsb3F5a2RsYmlhcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzgzNTcsImV4cCI6MjA5NjUxNDM1N30.Q-zNIS0tki5Tn37P8R6u-LPTkOCnE2r5jllMj922N2k";

let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error("Library eksternal Supabase CDN tidak terbaca sempurna.");
    }
} catch (err) {
    console.error("Koneksi gagal diinisiasi:", err);
}

let loggedInUser = "";
const mapelWajibDefault = [
    "Bahasa Indonesia", "Bahasa Sunda", "Bahasa Inggris", "Matematika", 
    "Informatika", "Biologi", "Fisika", "Sejarah", "Ekonomi", "PKWU"
];

let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelWajibDefault;

// Pemuatan data awal aplikasi
document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
    muatDaftarMapelTab();
});

function muatPilihanMapel() {
    const selectMapel = document.getElementById('menu-mapel');
    if (!selectMapel) return;
    selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
    listMapelSistem.forEach(m => {
        let opt = document.createElement('option');
        opt.value = m; opt.textContent = m;
        selectMapel.appendChild(opt);
    });
}

function muatDaftarMapelTab() {
    const wrapper = document.getElementById('daftar-mapel-list');
    if (!wrapper) return;
    wrapper.innerHTML = "";
    listMapelSistem.forEach(m => {
        let li = document.createElement('li');
        li.className = "mapel-item-list";
        li.textContent = m;
        wrapper.appendChild(li);
    });
}

function tambahMapelKustom() {
    Swal.fire({
        title: 'Tambah Mapel Baru',
        input: 'text',
        inputPlaceholder: 'Tulis nama mapel...',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        inputValidator: (value) => {
            if (!value) return 'Nama mata pelajaran tidak boleh kosong!';
            if (listMapelSistem.some(m => m.toLowerCase() === value.trim().toLowerCase())) {
                return 'Mata pelajaran ini sudah ada!';
            }
        }
    }).then((res) => {
        if (res.isConfirmed) {
            listMapelSistem.push(res.value.trim());
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            muatPilihanMapel();
            muatDaftarMapelTab();
            Swal.fire({ title: 'Sukses', text: 'Mata pelajaran baru berhasil didaftarkan.', icon: 'success', timer: 1200, showConfirmButton: false });
        }
    });
}

// EKSEKUSI PERPINDAHAN SUB TAB MENU INTERNAL
function bukaTab(evt, tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));

    const links = document.querySelectorAll('.tab-link');
    links.forEach(l => l.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function switchPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    const container = document.getElementById('main-container');
    if (id === 'panel-menu') container.classList.add('wide');
    else container.classList.remove('wide');
}

// LOGIKA LOGIN (DIJAMIN RESPONSIF SAAT DIKLIK)
function loginSistem() {
    const uField = document.getElementById('login-username');
    const pField = document.getElementById('login-password');
    if (!uField || !pField) return;

    const u = uField.value.trim();
    const p = pField.value;

    if (!u || !p) {
        Swal.fire('Perhatian', 'Silakan masukkan Username dan Password Anda!', 'warning');
        return;
    }

    if (u === 'AdminSMANSALA#' && p === 'SIAS2026-27##') {
        loggedInUser = u;
        Swal.fire({ title: 'Akses Diterima!', text: `Selamat datang kembali, ${loggedInUser}`, icon: 'success', timer: 1000, showConfirmButton: false })
        .then(() => {
            switchPanel('panel-menu');
            document.getElementById('menu-pengguna').value = loggedInUser;
        });
    } else {
        Swal.fire('Gagal Masuk', 'Akun petugas tidak terdaftar atau password salah!', 'error');
    }
}

// AMBIL DATA REALTIME UNTUK MENU SELURUH SISWA
async function muatSeluruhSiswa() {
    if (!supabase) return;
    const tbody = document.getElementById('tabel-semua-siswa');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Menghubungkan ke cloud database server...</td></tr>';

    const { data, error } = await supabase.from('data_siswa').select('*').order('id', { ascending: false });
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444; font-weight:bold;">Gagal sinkronisasi data!</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Belum ada record data siswa tersimpan.</td></tr>';
        return;
    }

    tbody.innerHTML = "";
    data.forEach(s => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td><span class="badge-kelas">${s.kelas}</span></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
        tbody.appendChild(tr);
    });
}

// AMBIL DATA BERDASARKAN FILTER (MENU SETIAP KELAS)
async function muatDataPerKelas(kelasPilihan) {
    const tbody = document.getElementById('tabel-per-kelas');
    if (!kelasPilihan) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">Silakan pilih kelas di atas terlebih dahulu.</td></tr>';
        return;
    }
    if (!supabase) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">Menyaring data kelas...</td></tr>';

    const { data, error } = await supabase.from('data_siswa').select('*').eq('kelas', kelasPilihan).order('nama_siswa', { ascending: true });

    if (error || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Tidak ditemukan data siswa aktif untuk kelas ${kelasPilihan}.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    data.forEach(s => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
        tbody.appendChild(tr);
    });
}

// HITUNG REKAP OTOMATIS (MENU NILAI)
async function hitungStatistikNilai() {
    if (!supabase) return;
    const { data, error } = await supabase.from('data_siswa').select('nilai_siswa');
    if (error || !data || data.length === 0) {
        document.getElementById('stat-max').textContent = "-";
        document.getElementById('stat-min').textContent = "-";
        document.getElementById('stat-avg').textContent = "-";
        return;
    }

    let nilaiArray = data.map(d => d.nilai_siswa);
    let max = Math.max(...nilaiArray);
    let min = Math.min(...nilaiArray);
    let avg = nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length;

    document.getElementById('stat-max').textContent = max;
    document.getElementById('stat-min').textContent = min;
    document.getElementById('stat-avg').textContent = avg.toFixed(1);
}

// FORM SUBMISSION UNTUK SIMPAN DATA KE SUPABASE
async function simpanDataSistem() {
    if (!supabase) return Swal.fire('Error', 'Sistem tidak terhubung ke database.', 'error');

    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;

    if (!kelas || !nama || !mapel || !nilai) {
        return Swal.fire('Gagal Menyimpan', 'Formulir isian tidak boleh kosong!', 'warning');
    }
    
    let numNilai = parseFloat(nilai);
    if (isNaN(numNilai) || numNilai < 0 || numNilai > 100) {
        return Swal.fire('Nilai Salah', 'Skala nilai harus berkisar dari 0 sampai 100.', 'error');
    }

    Swal.fire({ title: 'Mengamankan Data...', text: 'Mengunggah ke cloud storage', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const { error } = await supabase.from('data_siswa').insert([{ kelas, nama_siswa: nama, mata_pelajaran: mapel, nilai_siswa: numNilai, pengguna_petugas: pengguna }]);
    Swal.close();

    if (error) {
        Swal.fire('Gagal', 'Terjadi gangguan: ' + error.message, 'error');
    } else {
        Swal.fire('Sukses Tersimpan', 'Record data siswa dikunci aman di cloud.', 'success');
        document.getElementById('menu-nama').value = "";
        document.getElementById('menu-nilai').value = "";
    }
}

function clearMapelCache() {
    localStorage.removeItem('siassmansala_mapel');
    listMapelSistem = mapelWajibDefault;
    muatPilihanMapel();
    muatDaftarMapelTab();
    Swal.fire('Reset Berhasil', 'Pilihan daftar mata pelajaran dikembalikan ke bawaan.', 'success');
}

function logoutSistem() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    loggedInUser = "";
    switchPanel('panel-awal');
                         }
            
