const SUPABASE_URL = "https://jtvfacdloqykdlbiariy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dmZhY2Rsb3F5a2RsYmlhcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzgzNTcsImV4cCI6MjA5NjUxNDM1N30.Q-zNIS0tki5Tn37P8R6u-LPTkOCnE2r5jllMj922N2k";

let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (err) {
    console.error("Supabase crash:", err);
}

let loggedInUser = "";
const mapelWajibDefault = ["Bahasa Indonesia", "Bahasa Sunda", "Bahasa Inggris", "Matematika", "Informatika", "Biologi", "Fisika", "Sejarah", "Ekonomi", "PKWU"];
let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelWajibDefault;

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
        title: 'Tambah Mapel',
        input: 'text',
        inputPlaceholder: 'Nama mata pelajaran...',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        inputValidator: (value) => {
            if (!value) return 'Tidak boleh kosong!';
            if (listMapelSistem.some(m => m.toLowerCase() === value.trim().toLowerCase())) return 'Sudah terdaftar!';
        }
    }).then((res) => {
        if (res.isConfirmed) {
            listMapelSistem.push(res.value.trim());
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            muatPilihanMapel();
            muatDaftarMapelTab();
            Swal.fire('Sukses', 'Mapel ditambahkan', 'success');
        }
    });
}

// LOGIKA NAVIGASI TAB SIDEBAR INTERNAL
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

// TOMBOL LOGIN PERBAIKAN FIX TOTAL
function loginSistem() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;

    if (!u || !p) {
        Swal.fire('Peringatan', 'Username/Password kosong!', 'warning');
        return;
    }

    if (u === 'AdminSMANSALA#' && p === 'SIAS2026-27##') {
        loggedInUser = u;
        Swal.fire({ title: 'Berhasil Masuk', icon: 'success', timer: 1000, showConfirmButton: false })
        .then(() => {
            switchPanel('panel-menu');
            document.getElementById('menu-pengguna').value = loggedInUser;
            hitungStatistikNilai();
        });
    } else {
        Swal.fire('Gagal', 'Akun tidak terdaftar!', 'error');
    }
}

// AMBIL DATA DARI SUPABASE (MENU SELURUH SISWA)
async function muatSeluruhSiswa() {
    if (!supabase) return;
    const tbody = document.getElementById('tabel-semua-siswa');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Mengunduh data server...</td></tr>';

    const { data, error } = await supabase.from('data_siswa').select('*').order('id', { ascending: false });
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data!</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data siswa.</td></tr>';
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
    if (!kelasPilihan) return;
    const tbody = document.getElementById('tabel-per-kelas');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Mencari data kelas...</td></tr>';

    const { data, error } = await supabase.from('data_siswa').select('*').eq('kelas', kelasPilihan);

    if (error || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Tidak ada data di kelas ${kelasPilihan}</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    data.forEach(s => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
        tbody.appendChild(tr);
    });
}

// HITUNG ANALISIS (MENU NILAI)
async function hitungStatistikNilai() {
    if (!supabase) return;
    const { data, error } = await supabase.from('data_siswa').select('nilai_siswa');
    if (error || !data || data.length === 0) return;

    let nilaiArray = data.map(d => d.nilai_siswa);
    let max = Math.max(...nilaiArray);
    let min = Math.min(...nilaiArray);
    let avg = nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length;

    document.getElementById('stat-max').textContent = max;
    document.getElementById('stat-min').textContent = min;
    document.getElementById('stat-avg').textContent = avg.toFixed(1);
}

// ACTION INPUT FORM DATA
async function simpanDataSistem() {
    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;

    if (!kelas || !nama || !mapel || !nilai) return Swal.fire('Gagal', 'Lengkapi formulir!', 'warning');
    
    let numNilai = parseFloat(nilai);
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const { error } = await supabase.from('data_siswa').insert([{ kelas, nama_siswa: nama, mata_pelajaran: mapel, nilai_siswa: numNilai, pengguna_petugas: pengguna }]);
    Swal.close();

    if (error) {
        Swal.fire('Gagal', error.message, 'error');
    } else {
        Swal.fire('Berhasil', 'Data siswa disimpan ke cloud.', 'success');
        document.getElementById('menu-nama').value = "";
        document.getElementById('menu-nilai').value = "";
        hitungStatistikNilai();
    }
}

function clearMapelCache() {
    localStorage.removeItem('siassmansala_mapel');
    listMapelSistem = mapelWajibDefault;
    muatPilihanMapel();
    muatDaftarMapelTab();
    Swal.fire('Reset', 'Daftar mata pelajaran dikembalikan ke default.', 'success');
}

function logoutSistem() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    switchPanel('panel-awal');
    }
                                
