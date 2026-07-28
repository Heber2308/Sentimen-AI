let lastCsvData = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSuccessSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}
window.copyToClipboard = function(btn) {
    const text = btn.previousElementSibling.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        icon.style.color = 'var(--positif)';
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            icon.style.color = '';
        }, 2000);
    });
};
document.addEventListener('DOMContentLoaded', function() {
    const teksInput = document.getElementById('teksInput');
    const charCount = document.getElementById('charCount');
    const btnPredict = document.getElementById('btnPredict');
    const csvUpload = document.getElementById('csvUpload');
    const resultSection = document.getElementById('resultSection');
    const csvResultSection = document.getElementById('csvResultSection');
    const statsRow = document.getElementById('statsRow');
    const confettiCanvas = document.getElementById('confettiCanvas');
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 50) {
                navbar.style.top = '10px';
                navbar.style.background = 'rgba(5, 8, 22, 0.85)';
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
            } else {
                navbar.style.top = '16px';
                navbar.style.background = 'rgba(5, 8, 22, 0.7)';
                navbar.style.boxShadow = 'var(--shadow-sm)';
            }
        });
    }
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.style.setProperty('--mouse-x', `${x}px`);
            this.style.setProperty('--mouse-y', `${y}px`);
        });
    });
    if (teksInput && charCount) {
        teksInput.addEventListener('input', function() {
            const len = this.value.length;
            charCount.textContent = len + ' / 2000 karakter';
            charCount.style.color = len > 1800 ? 'var(--negatif)' : len > 1500 ? 'var(--netral)' : 'var(--text-muted)';
        });
    }
    if (btnPredict) {
        btnPredict.addEventListener('click', function() {
            const teks = teksInput.value.trim();
            if (!teks) { showToast('Masukkan teks terlebih dahulu', 'error'); return; }
            if (teks.length < 5) { showToast('Minimal 5 karakter', 'error'); return; }
            if (resultSection) resultSection.style.display = 'none';
            if (csvResultSection) csvResultSection.style.display = 'none';
            const skeletonSection = document.getElementById('skeletonSection');
            if (skeletonSection) skeletonSection.style.display = 'block';
            btnPredict.disabled = true;
            const origHTML = btnPredict.innerHTML;
            btnPredict.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span> Menganalisis...';
            fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'teks=' + encodeURIComponent(teks)
            })
            .then(r => r.json())
            .then(data => {
                btnPredict.disabled = false;
                btnPredict.innerHTML = origHTML;
                if (skeletonSection) skeletonSection.style.display = 'none';
                if (data.error) { showToast(data.error, 'error'); return; }
                playSuccessSound(); 
                displayResult(data);
                if (resultSection) { 
                    resultSection.style.display = 'block'; 
                    setTimeout(() => {
                        resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                    }, 50);
                }
                if (data.sentimen === 'positif') launchConfetti();
                fetchStats();
            })
            .catch(() => { 
                btnPredict.disabled = false; 
                btnPredict.innerHTML = origHTML; 
                if (skeletonSection) skeletonSection.style.display = 'none';
                showToast('Gagal menghubungi server', 'error'); 
            });
        });
    }
    const dropZoneBtn = document.getElementById('dropZone');
    const uploadIcon = document.getElementById('uploadIcon');
    const uploadText = document.getElementById('uploadText');
    const dropZones = [dropZoneBtn, teksInput].filter(el => el !== null);
    if (csvUpload) {
        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
        dropZones.forEach(zone => {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, preventDefaults, false);
            });
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    if (zone === dropZoneBtn) {
                        zone.classList.add('drag-over');
                        if(uploadIcon) uploadIcon.className = 'fa-solid fa-file-arrow-down';
                        if(uploadText) uploadText.textContent = 'Drop file CSV di sini';
                    } else if (zone === teksInput) {
                        zone.classList.add('drag-over-input');
                        zone.placeholder = 'Lepaskan file CSV di sini untuk mengunggah...';
                    }
                }, false);
            });
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    if (zone === dropZoneBtn) {
                        zone.classList.remove('drag-over');
                        if(uploadIcon) uploadIcon.className = 'fa-solid fa-file-csv';
                        if(uploadText) uploadText.textContent = 'Upload CSV Dataset';
                    } else if (zone === teksInput) {
                        zone.classList.remove('drag-over-input');
                        zone.placeholder = 'Tuliskan aspirasi, kritik, atau saran mahasiswa di sini...';
                    }
                }, false);
            });
            zone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files && files.length > 0) {
                    csvUpload.files = files;
                    const event = new Event('change');
                    csvUpload.dispatchEvent(event);
                } else if (zone === teksInput) {
                    const text = dt.getData('text');
                    if (text) {
                        teksInput.value += text;
                        teksInput.dispatchEvent(new Event('input'));
                    }
                }
            }, false);
        });
    }
    if (csvUpload) {
        csvUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            if (!file.name.endsWith('.csv')) { showToast('Hanya file CSV yang didukung', 'error'); return; }
            if (resultSection) resultSection.style.display = 'none';
            if (csvResultSection) csvResultSection.style.display = 'none';
            const formData = new FormData(); 
            formData.append('file', file);
            const loadDiv = document.createElement('div');
            loadDiv.className = 'loading';
            loadDiv.innerHTML = '<div class="loading-spinner"></div><p class="loading-text">Menganalisis CSV dengan AI...</p>';
            this.parentElement.parentElement.appendChild(loadDiv); 
            fetch('/upload-csv', { method: 'POST', body: formData })
                .then(r => r.json())
                .then(data => {
                    loadDiv.remove();
                    if (data.error) { showToast(data.error, 'error'); return; }
                    playSuccessSound();
                    displayCsvResult(data);
                    if (csvResultSection) { 
                        csvResultSection.style.display = 'block'; 
                        setTimeout(() => {
                            csvResultSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                        }, 50);
                    }
                    fetchStats();
                    this.value = ''; 
                })
                .catch(() => { 
                    loadDiv.remove(); 
                    showToast('Gagal memproses file CSV', 'error'); 
                    this.value = '';
                });
        });
    }
    function displayResult(data) {
        const sentimenDiv = document.getElementById('sentimenResult');
        if (sentimenDiv) {
            sentimenDiv.innerHTML = `<span class="sentimen-badge sentimen-${data.sentimen}">${data.sentimen.toUpperCase()}</span>`;
        }
        ['Positif', 'Netral', 'Negatif'].forEach(label => {
            const key = label.toLowerCase();
            const val = data.probabilitas[key] || 0;
            const vel = document.getElementById('prob' + label);
            const bel = document.getElementById('bar' + label);
            if (vel) {
                let current = 0;
                const interval = setInterval(() => {
                    current += val / 20;
                    if (current >= val) {
                        current = val;
                        clearInterval(interval);
                    }
                    vel.textContent = Math.round(current * 10) / 10 + '%';
                }, 30);
            }
            if (bel) {
                bel.style.width = '0%'; 
                setTimeout(() => { bel.style.width = val + '%'; }, 100);
            }
        });
        const kwDiv = document.getElementById('kataKunciList');
        if (kwDiv) {
            kwDiv.innerHTML = '';
            if (data.kata_kunci && data.kata_kunci.length) {
                data.kata_kunci.forEach((k, idx) => {
                    const tag = document.createElement('span');
                    tag.className = 'keyword-tag'; 
                    tag.textContent = k;
                    tag.style.opacity = '0';
                    tag.style.transform = 'translateY(10px)';
                    tag.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                    kwDiv.appendChild(tag);
                    setTimeout(() => {
                        tag.style.opacity = '1';
                        tag.style.transform = 'translateY(0)';
                    }, 100 + (idx * 100));
                });
                const insightText = document.getElementById('insightText');
                if (insightText) {
                    const keywordsStr = data.kata_kunci.slice(0, 3).map(k => `'${k}'`).join(', ');
                    insightText.textContent = `Sistem menemukan kata kunci seperti ${keywordsStr} yang memiliki probabilitas tinggi terhadap sentimen ${data.sentimen} berdasarkan model Multinomial Naive Bayes.`;
                }
            } else {
                kwDiv.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">Tidak ada kata kunci dominan yang terdeteksi.</span>';
                const insightText = document.getElementById('insightText');
                if (insightText) insightText.textContent = `Model memprediksi sentimen ${data.sentimen} berdasarkan distribusi bobot TF-IDF pada keseluruhan kalimat, tanpa ada kata tunggal yang sangat mendominasi.`;
            }
        }
    }
    let csvCurrentPage = 1;
    const csvRowsPerPage = 5;
    function displayCsvResult(data) {
        lastCsvData = data.all_data || data.data;
        const totalEl = document.getElementById('csvTotal');
        if (totalEl) totalEl.textContent = `✓ Berhasil menganalisis ${data.total} data`;
        csvCurrentPage = 1;
        displayCsvPage(1);
    }
    window.displayCsvPage = function(page) {
        if (!lastCsvData) return;
        csvCurrentPage = page;
        const tbody = document.querySelector('#csvTable tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const startIndex = (page - 1) * csvRowsPerPage;
            const endIndex = startIndex + csvRowsPerPage;
            const pageData = lastCsvData.slice(startIndex, endIndex);
            pageData.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.animationDelay = `${index * 0.05}s`;
                tr.innerHTML = `
                    <td class="td-teks" title="${escapeHtml(item.teks)}">${escapeHtml(item.teks)}</td>
                    <td><span class="badge badge-${item.sentimen}">${item.sentimen.toUpperCase()}</span></td>
                    <td style="color:var(--positif)">${item.positif}%</td>
                    <td style="color:var(--netral)">${item.netral}%</td>
                    <td style="color:var(--negatif)">${item.negatif}%</td>
                `;
                tbody.appendChild(tr);
            });
            renderCsvPagination();
        }
    }
    window.renderCsvPagination = function() {
        const container = document.getElementById('csvPaginationControls');
        if (!container || !lastCsvData) return;
        container.innerHTML = '';
        const totalPages = Math.ceil(lastCsvData.length / csvRowsPerPage);
        if (totalPages <= 1) return;
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = csvCurrentPage === 1;
        prevBtn.onclick = () => window.displayCsvPage(csvCurrentPage - 1);
        container.appendChild(prevBtn);
        let pagesToShow = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
        } else {
            if (csvCurrentPage <= 4) {
                pagesToShow = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (csvCurrentPage >= totalPages - 3) {
                pagesToShow = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pagesToShow = [1, '...', csvCurrentPage - 1, csvCurrentPage, csvCurrentPage + 1, '...', totalPages];
            }
        }
        pagesToShow.forEach(p => {
            if (p === '...') {
                const dots = document.createElement('span');
                dots.className = 'page-dots';
                dots.textContent = '...';
                container.appendChild(dots);
            } else {
                const btn = document.createElement('button');
                btn.className = `page-btn ${p === csvCurrentPage ? 'active' : ''}`;
                btn.textContent = p;
                btn.onclick = () => window.displayCsvPage(p);
                container.appendChild(btn);
            }
        });
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = csvCurrentPage === totalPages;
        nextBtn.onclick = () => window.displayCsvPage(csvCurrentPage + 1);
        container.appendChild(nextBtn);
    }
    function fetchStats() {
        fetch('/api/stats')
            .then(r => r.json())
            .then(data => {
                if (data.stats) {
                    animateCounter('totalPrediksi', data.stats.total || 0);
                    animateCounter('totalPositif', data.stats.positif || 0);
                    animateCounter('totalNetral', data.stats.netral || 0);
                    animateCounter('totalNegatif', data.stats.negatif || 0);
                    if (statsRow) statsRow.style.display = 'grid';
                }
            })
            .catch(() => {});
    }
    function animateCounter(id, target) {
        const el = document.getElementById(id);
        if (!el) return;
        const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
        if (current === target) return;
        const duration = 1500;
        const start = performance.now();
        function update(now) {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4); 
            el.textContent = Math.floor(current + (target - current) * ease).toLocaleString('id-ID');
            if (p < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
    function showToast(msg, type) {
        let container = document.querySelector('.toast-container');
        if (!container) { 
            container = document.createElement('div'); 
            container.className = 'toast-container'; 
            document.body.appendChild(container); 
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`; 
        const icon = type === 'success' ? '<i class="fa-solid fa-circle-check" style="color:var(--positif)"></i>' : 
                     type === 'error' ? '<i class="fa-solid fa-circle-exclamation" style="color:var(--negatif)"></i>' : '';
        toast.innerHTML = `${icon} <span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { 
            if (toast.parentNode) { 
                toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                setTimeout(() => toast.remove(), 400); 
            } 
        }, 4000);
    }
    function launchConfetti() {
        if (!confettiCanvas) return;
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth; 
        confettiCanvas.height = window.innerHeight;
        const particles = [];
        const colors = ['#7C3AED', '#8B5CF6', '#2563EB', '#60A5FA', '#22C55E', '#34D399', '#06b6d4'];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * confettiCanvas.width, 
                y: -40 - Math.random() * 200,
                size: Math.random() * 8 + 4, 
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 6, 
                vy: Math.random() * 4 + 4,
                rotation: Math.random() * 360, 
                rotationSpeed: (Math.random() - 0.5) * 12,
                opacity: 1, 
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }
        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            particles.forEach(p => {
                p.x += p.vx; 
                p.y += p.vy; 
                p.vy += 0.05; 
                p.vx *= 0.99; 
                p.rotation += p.rotationSpeed; 
                p.opacity -= 0.005;
                if (p.opacity <= 0) return;
                ctx.save(); 
                ctx.translate(p.x, p.y); 
                ctx.rotate(p.rotation * Math.PI / 180); 
                ctx.globalAlpha = p.opacity; 
                ctx.fillStyle = p.color;
                if (p.shape === 'circle') { 
                    ctx.beginPath(); 
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); 
                    ctx.fill(); 
                } else { 
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); 
                }
                ctx.restore();
            });
            frame++;
            if (frame < 200) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
        animate();
    }
    function escapeHtml(text) { 
        const div = document.createElement('div'); 
        div.textContent = text; 
        return div.innerHTML; 
    }
    if (statsRow) fetchStats();
    if (document.getElementById('riwayatTable')) {
        initPagination();
    }
});
window.downloadCsvResult = function() {
    if (!lastCsvData || lastCsvData.length === 0) {
        alert('Tidak ada data untuk didownload');
        return;
    }
    fetch('/download-hasil-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: lastCsvData })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil_upload_csv.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(() => alert('Gagal mendownload file'));
};
let currentPage = 1;
const rowsPerPage = 5;
let filteredRows = [];
window.initPagination = function() {
    const rows = Array.from(document.querySelectorAll('#riwayatTable tbody tr'));
    if (rows.length === 0) return;
    filteredRows = rows;
    displayPage(1);
}
window.filterTable = function() {
    const sentimenEl = document.getElementById('filterSentimen');
    const searchEl = document.getElementById('filterSearch');
    if (!sentimenEl || !searchEl) return;
    const sentimen = sentimenEl.value;
    const search = searchEl.value.toLowerCase();
    const allRows = Array.from(document.querySelectorAll('#riwayatTable tbody tr'));
    filteredRows = allRows.filter(row => {
        const rowSentimen = row.getAttribute('data-sentimen');
        const rowTeks = row.querySelector('.td-teks').textContent.toLowerCase();
        const matchSentimen = sentimen === 'semua' || rowSentimen === sentimen;
        const matchSearch = search === '' || rowTeks.includes(search);
        return matchSentimen && matchSearch;
    });
    allRows.forEach(row => { row.style.display = 'none'; row.style.opacity = '0'; });
    displayPage(1);
};
window.displayPage = function(page) {
    currentPage = page;
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const allRows = Array.from(document.querySelectorAll('#riwayatTable tbody tr'));
    allRows.forEach(row => { row.style.display = 'none'; row.style.opacity = '0'; });
    filteredRows.forEach((row, index) => {
        if (index >= startIndex && index < endIndex) {
            row.style.display = '';
            setTimeout(() => { row.style.opacity = '1'; }, 10);
        }
    });
    renderPagination();
}
window.renderPagination = function() {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    if (totalPages <= 1) return;
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayPage(currentPage - 1);
    paginationContainer.appendChild(prevBtn);
    let pagesToShow = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
        if (currentPage <= 4) {
            pagesToShow = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (currentPage >= totalPages - 3) {
            pagesToShow = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pagesToShow = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }
    pagesToShow.forEach(p => {
        if (p === '...') {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
            btn.textContent = p;
            btn.onclick = () => displayPage(p);
            paginationContainer.appendChild(btn);
        }
    });
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => displayPage(currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}
