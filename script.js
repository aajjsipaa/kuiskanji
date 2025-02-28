// Variabel untuk menyimpan skor
let score = 0;
let usedQuestions = [];
let questionHistory = []; // Menyimpan 5 pertanyaan terakhir
// Level penguasaan: 0 = belum, 1 = hijau, 2 = biru, 3 = nila
let kanjiMastery = {};
let romajiEnabled = false; // Tambahkan variabel untuk toggle romaji

// Data pertanyaan akan dimuat dari file kanji_n5.json
let questions = [];
let hiraganaList = []; // Daftar semua hiragana untuk opsi jawaban

// Daftar kanji N5
const kanjiList = [
    "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
    "百", "千", "万", "日", "月", "火", "水", "木", "金", "土",
    "本", "語", "人", "女", "男", "子", "友", "国", "学", "校",
    "小", "大", "少", "多", "時", "分", "年", "名", "前", "後",
    "山", "川", "花", "魚", "上", "中", "下", "左", "右", "外",
    "雨", "電", "天", "店", "手", "古", "新", "買", "生", "昼",
    "口", "入", "出", "長", "高", "円", "北", "南", "東", "西",
    "食", "飲", "耳", "目", "見", "聞", "足", "行", "来", "社",
    "休", "車", "道", "空", "言", "話", "読", "書", "立", "母",
    "父", "毎", "気", "白", "何", "週", "問", "間", "半", "今"
];

// Fungsi untuk memutar suara ketika jawaban benar
function playSuccessSound() {
    const audio = new Audio('correct.mp3'); // Ganti dengan path file audio Anda
    audio.play().catch(error => {
        console.error("Error playing sound:", error);
    });
}

// Fungsi untuk memuat data dari JSON
async function loadKanjiData() {
    try {
        const response = await fetch('kanji_n5.json');
        if (!response.ok) {
            throw new Error('Gagal memuat data kanji');
        }

        const kanjiData = await response.json();

        // Menyimpan semua hiragana untuk digunakan sebagai opsi jawaban
        hiraganaList = kanjiData.map(item => item.hiragana.split('、')[0]);

        // Transformasi data JSON ke format questions
        questions = kanjiData.map(item => {
            return {
                kanji: item.kanji,
                answer: item.hiragana.split('、')[0], // Mengambil pembacaan pertama
                meaning: item.arti,
                options: [], // Akan diisi nanti dengan generateOptions
                example: `${item.contoh.kalimat} (${item.contoh.hiragana}) - ${item.contoh.arti}`,
                romaji: item.contoh.romaji // Menambahkan properti romaji
            };
        });

        // Generate opsi untuk setiap pertanyaan
        questions.forEach(question => {
            question.options = generateOptions(question.answer, 3);
        });

        console.log('Data Kanji berhasil dimuat:', questions.length, 'kanji');

        // Inisialisasi kanjiMastery dengan nilai awal 0 untuk semua kanji
        questions.forEach(question => {
            if (!kanjiMastery[question.kanji]) {
                kanjiMastery[question.kanji] = 0;
            }
        });

        // Setelah data dimuat, inisialisasi quiz
        initializeQuiz();
    } catch (error) {
        console.error('Error loading kanji data:', error);
        alert('Gagal memuat data kanji. Silakan refresh halaman.');
    }
}

// Fungsi untuk menghasilkan opsi jawaban (1 benar, sisanya acak)
function generateOptions(correctAnswer, numOptions) {
    // Mulai dengan jawaban yang benar
    const options = [correctAnswer];

    // Acak hiragana dari daftar untuk opsi jawaban yang salah
    const filteredHiragana = hiraganaList.filter(h => h !== correctAnswer);

    // Shuffle daftar hiragana
    const shuffledHiragana = shuffleArray([...filteredHiragana]);

    // Ambil sejumlah hiragana yang dibutuhkan untuk opsi salah
    for (let i = 0; i < numOptions; i++) {
        if (shuffledHiragana.length > i) {
            options.push(shuffledHiragana[i]);
        }
    }

    // Acak urutan opsi jawaban
    return shuffleArray(options);
}

// Fungsi untuk mengacak array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fungsi untuk membuat grid kanji dengan nomor urut
function createKanjiGrid() {
    const grid = document.getElementById("kanji-grid");
    grid.innerHTML = "";

    kanjiList.forEach((kanji, index) => {
        const div = document.createElement("div");
        div.textContent = kanji;
        div.classList.add("kanji-item");
        div.id = `kanji-${kanji}`;

        // Menambahkan tooltip dengan nomor urut
        div.title = `#${index + 1}: ${kanji}`;

        // Menambahkan fungsi klik pada item kanji
        div.addEventListener('click', () => {
            // Mencari pertanyaan dengan kanji yang diklik
            const relatedQuestion = questions.find(q => q.kanji === kanji);
            if (relatedQuestion) {
                showKanjiInfo(relatedQuestion);
            } else {
                // Jika tidak ada pertanyaan terkait, tampilkan info dasar
                alert(`Kanji #${index + 1}: ${kanji}\nInfo: Kanji ini termasuk dalam daftar N5`);
            }
        });

        grid.appendChild(div);
    });
}

// Fungsi untuk menampilkan informasi kanji saat diklik
function showKanjiInfo(questionData) {
    alert(`Kanji: ${questionData.kanji}\nCara baca: ${questionData.answer}\nArti: ${questionData.meaning}\n\nContoh: ${questionData.example}`);
}

// Fungsi untuk memuat pertanyaan
function loadQuestion() {
    // Pastikan data pertanyaan sudah dimuat
    if (questions.length === 0) {
        console.log("Data pertanyaan belum dimuat");
        return;
    }

    // Update grid kanji berdasarkan status tingkat penguasaan
    updateKanjiGrid();

    // Filter pertanyaan berdasarkan aturan:
    // 1. Hindari 5 pertanyaan terakhir untuk mencegah berulang langsung
    // 2. Prioritaskan kanji yang belum mencapai tingkat nila (level 3)
    let availableQuestions = questions.filter(q =>
        !questionHistory.includes(q.kanji) &&
        kanjiMastery[q.kanji] < 3
    );

    // Jika tidak ada pertanyaan tersedia, ambil semua kecuali level 3
    if (availableQuestions.length === 0) {
        availableQuestions = questions.filter(q => kanjiMastery[q.kanji] < 3);
    }

    // Jika masih tidak ada, reset questionHistory dan coba lagi
    if (availableQuestions.length === 0) {
        questionHistory = [];
        availableQuestions = questions.filter(q => kanjiMastery[q.kanji] < 3);
    }

    // Memilih pertanyaan secara acak
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const questionData = availableQuestions[randomIndex];

    // Menandai pertanyaan dalam history
    questionHistory.push(questionData.kanji);
    // Batasi history hanya 5 item
    if (questionHistory.length > 5) {
        questionHistory.shift();
    }

    // Menyembunyikan elemen yang belum perlu ditampilkan
    document.getElementById("meaning").style.visibility = "hidden";
    document.getElementById("example").style.visibility = "hidden";
    document.getElementById("next-btn").style.display = "none";

    // Menampilkan kanji pertanyaan di tengah
    const questionElement = document.getElementById("question");
    questionElement.textContent = questionData.kanji;
    questionElement.style.display = "flex";
    questionElement.style.justifyContent = "center";

    // Highlight kanji dalam grid tanpa melakukan scroll otomatis
    const kanjiElement = document.getElementById(`kanji-${questionData.kanji}`);
    if (kanjiElement) {
        // Tambahkan highlight untuk menonjolkan kanji saat dimuat
        kanjiElement.classList.add('temp-highlight');
        setTimeout(() => {
            kanjiElement.classList.remove('temp-highlight');
        }, 1500);
    }

    // Mengacak opsi jawaban
    const shuffledOptions = shuffleArray([...questionData.options]);

    // Menampilkan opsi jawaban
    const answersContainer = document.getElementById("answers");
    answersContainer.innerHTML = "";

    shuffledOptions.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.classList.add("answer");
        btn.onclick = () => checkAnswer(btn, option, questionData);
        answersContainer.appendChild(btn);
    });
}

// Fungsi untuk memeriksa jawaban
function checkAnswer(button, selected, questionData) {
    // Mencegah pengguna mengklik lagi jawaban yang sudah dipilih
    if (button.disabled) return;

    // Menonaktifkan semua tombol jawaban
    document.querySelectorAll('.answer').forEach(btn => {
        btn.disabled = true;
    });

    // Memeriksa apakah jawaban benar
    if (selected === questionData.answer) {
        // Jawaban benar
        button.classList.add("correct");

        // Memutar suara saat jawaban benar
        try {
            playSuccessSound();
        } catch (e) {
            console.error("Could not play sound:", e);
        }

        // Menampilkan arti dan contoh dengan format yang lebih rapi
        document.getElementById("meaning").textContent = `Arti: ${questionData.meaning}`;
        document.getElementById("meaning").style.visibility = "visible";

        // Format contoh kalimat dengan hiragana
        const exampleElement = document.getElementById("example");
        const contohKalimat = questionData.example.split(' (')[0];
        const contohHiragana = questionData.example.split(' (')[1].split(') - ')[0];
        const contohArti = questionData.example.split(') - ')[1];

        exampleElement.innerHTML = `
            <div><strong>Contoh:</strong> ${contohKalimat}</div>
            <div style="font-size: 0.9rem; color: #888; margin-left: 10px;">${contohHiragana}</div>
            <div style="margin-top: 5px;">${contohArti}</div>
        `;
        exampleElement.style.visibility = "visible";

        // Menampilkan tombol lanjut
        document.getElementById("next-btn").style.display = "block";

        // Update tingkat penguasaan kanji
        const currentLevel = kanjiMastery[questionData.kanji] || 0;
        if (currentLevel < 3) {
            kanjiMastery[questionData.kanji] = currentLevel + 1;
        }

        // Update tampilan di grid kanji
        const kanjiElement = document.getElementById(`kanji-${questionData.kanji}`);
        if (kanjiElement) {
            // Hapus semua class level
            kanjiElement.classList.remove("mastery-1", "mastery-2", "mastery-3", "incorrect");

            // Tambahkan class sesuai level baru
            const newLevel = kanjiMastery[questionData.kanji];
            kanjiElement.classList.add(`mastery-${newLevel}`);
        }

        // Menambah skor
        score++;
        document.getElementById("score").textContent = score;

    } else {
        // Jawaban salah dengan efek getar
        button.classList.add("wrong");

        // Menambahkan efek getaran haptic jika browser mendukung
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(200); // Getar 200ms pada perangkat mobile jika didukung
        }

        // Menampilkan jawaban yang benar
        document.querySelectorAll('.answer').forEach(btn => {
            if (btn.textContent === questionData.answer) {
                btn.classList.add("correct");
            }
        });

        // Menurunkan level jika level > 0 (mundur satu tahap)
        const currentLevel = kanjiMastery[questionData.kanji] || 0;
        if (currentLevel > 0) {
            kanjiMastery[questionData.kanji] = currentLevel - 1;
        }

        // Menampilkan arti dan contoh meskipun jawaban salah dengan format yang lebih rapi
        document.getElementById("meaning").textContent = `Arti: ${questionData.meaning}`;
        document.getElementById("meaning").style.visibility = "visible";

        // Format contoh kalimat dengan hiragana
        const exampleElement = document.getElementById("example");
        const contohKalimat = questionData.example.split(' (')[0];
        const contohHiragana = questionData.example.split(' (')[1].split(') - ')[0];
        const contohArti = questionData.example.split(') - ')[1];

        exampleElement.innerHTML = `
            <div><strong>Contoh:</strong> ${contohKalimat}</div>
            <div style="font-size: 0.9rem; color: #888; margin-left: 10px;">${contohHiragana}</div>
            <div style="margin-top: 5px;">${contohArti}</div>
        `;
        exampleElement.style.visibility = "visible";

        // Menampilkan tombol lanjut
        document.getElementById("next-btn").style.display = "block";

        // Update tampilan di grid
        const kanjiElement = document.getElementById(`kanji-${questionData.kanji}`);
        if (kanjiElement) {
            // Hapus semua class level
            kanjiElement.classList.remove("mastery-1", "mastery-2", "mastery-3");

            // Tambahkan class sesuai level baru atau incorrect jika level 0
            const newLevel = kanjiMastery[questionData.kanji];
            if (newLevel > 0) {
                kanjiElement.classList.add(`mastery-${newLevel}`);
            } else {
                kanjiElement.classList.add("incorrect");
            }
        }
    }

    // Simpan status penguasaan ke localStorage
    localStorage.setItem('kanjiMastery', JSON.stringify(kanjiMastery));
}

// Fungsi untuk memperbarui tampilan grid kanji berdasarkan tingkat penguasaan
function updateKanjiGrid() {
    // Reset semua class mastery dan incorrect
    document.querySelectorAll('.kanji-item').forEach(item => {
        item.classList.remove('mastery-1', 'mastery-2', 'mastery-3', 'incorrect');
    });

    // Terapkan class sesuai tingkat penguasaan
    Object.keys(kanjiMastery).forEach(kanji => {
        const level = kanjiMastery[kanji];
        const element = document.getElementById(`kanji-${kanji}`);

        if (element) {
            if (level > 0) {
                element.classList.add(`mastery-${level}`);
            } else if (level === 0) {
                // Tidak ada class khusus untuk level 0
            }
        }
    });
}

// Fungsi untuk mereset status penguasaan
function resetKanjiStatus() {
    // Reset semua level ke 0
    Object.keys(kanjiMastery).forEach(kanji => {
        kanjiMastery[kanji] = 0;
    });

    score = 0;
    document.getElementById("score").textContent = score;
    localStorage.removeItem('kanjiMastery');
    questionHistory = [];
    updateKanjiGrid();
}

// Inisialisasi quiz setelah data dimuat
function initializeQuiz() {
    createKanjiGrid();
    loadQuestion();

    // Menambahkan event listener untuk tombol next
    document.getElementById("next-btn").addEventListener('click', loadQuestion);

    // Tambahkan tombol reset
    const scoreContainer = document.querySelector('.score-container');
    if (!document.querySelector('.reset-btn')) {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.classList.add('reset-btn');
        resetButton.addEventListener('click', resetKanjiStatus);
        scoreContainer.appendChild(resetButton);
    }

    // Update total pertanyaan
    document.getElementById("total-questions").textContent = questions.length;
}

// Fungsi untuk konversi Hiragana ke Romaji (Implementasi sederhana, perlu diperbaiki untuk akurasi)
function hiraganaToRomaji(hiragana) {
    // Implementasi sederhana, perlu diperluas untuk menangani lebih banyak karakter
    const mapping = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        // ... tambahkan mapping lainnya
    };
    let romaji = '';
    for (let char of hiragana) {
        romaji += mapping[char] || char;
    }
    return romaji;
}


// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    // Memuat status tingkat penguasaan dari localStorage jika ada
    const savedMastery = localStorage.getItem('kanjiMastery');
    if (savedMastery) {
        kanjiMastery = JSON.parse(savedMastery);
    }

    // Memuat data kanji dari JSON
    loadKanjiData();
    
    // Register service worker untuk PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(function(error) {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});