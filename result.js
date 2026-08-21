/**
 * UHS Kaparpura - Public Student Examination Result Portal
 * 
 * Features:
 * 1. Mobile Cards View (Responsive touch UI for students on smartphones)
 * 2. Strict 1-Page A4 Printable Marksheet (Web Version)
 *    - Repeating Hindi School Name Watermark
 *    - NO BSEB Logo
 *    - NO Teacher / Headmaster signatures (Provisional Computer Generated)
 *    - Instant 1-click A4 PDF / Paper Print
 */

const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec';

let currentResultData = null;

function showLoader(text = "प्राप्तांक विवरण लोड हो रहा है...") {
    const loader = document.getElementById('loader');
    if (loader) {
        const p = loader.querySelector('p');
        if (p) p.textContent = text;
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

/**
 * Generates an inline SVG QR Code representation of the certificate number.
 */
function generateQrSvg(text) {
    try {
        if (window.QrCode) {
            const qr = window.QrCode.encodeText(text, window.QrCode.Ecc.LOW);
            const size = qr.size;
            let path = "";
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (qr.getModule(x, y)) {
                        path += `M${x},${y}h1v1h-1z `;
                    }
                }
            }
            return `<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="-2 -2 ${size + 4} ${size + 4}" style="display: block; margin: 0 auto; background: white; border-radius: 4px; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;"><path fill="#0f172a" d="${path}"/></svg>`;
        }
    } catch (e) {
        console.warn("QR generation error:", e);
    }
    return `<div style="width: 65px; height: 65px; background: #f1f5f9; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; margin: 0 auto; border-radius: 4px;">QR</div>`;
}

// ── Initial Setup & Settings Check ──────────────────────────────────────────
async function initResultPortal() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const startYear = today.getMonth() >= 3 ? year : year - 1;
        const defaultSession = `${startYear}-${String(startYear + 1).slice(-2)}`;
        
        const dispSession = document.getElementById('displaySession');
        if (dispSession) dispSession.textContent = defaultSession;

        const res = await fetch(`${ADMIN_API_URL}?action=public.settings.get`);
        const data = await res.json();

        const isResultPublished = data?.settings?.result_published;
        const searchSec = document.getElementById('searchSection');
        const closedNotice = document.getElementById('portalClosedNotice');

        if (!isResultPublished) {
            if (searchSec) searchSec.style.display = 'none';
            if (closedNotice) closedNotice.style.display = 'block';
            return;
        }

        if (searchSec) searchSec.style.display = 'block';
        if (closedNotice) closedNotice.style.display = 'none';

        // Load available exams from database
        await loadExamList();

    } catch (err) {
        console.error("Portal status check failed:", err);
        await loadExamList();
    }
}

// ── Load Exams that actually have marks feeded ──────────────────────────────
async function loadExamList() {
    const sessionSelect = document.getElementById('resSession');
    const classSelect = document.getElementById('resClass');
    const examSelect = document.getElementById('resExam');

    const selectedSession = sessionSelect ? sessionSelect.value : '';
    const selectedClass = classSelect ? classSelect.value : '';

    try {
        let url = `${ADMIN_API_URL}?action=public.result.getExams`;
        if (selectedSession) url += `&academicYear=${encodeURIComponent(selectedSession)}`;
        if (selectedClass) url += `&classNum=${encodeURIComponent(selectedClass)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.success) {
            if (data.sessions && data.sessions.length && sessionSelect) {
                const curVal = sessionSelect.value;
                sessionSelect.innerHTML = '';
                data.sessions.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = s;
                    if (s === curVal || (!curVal && s.includes('2026'))) opt.selected = true;
                    sessionSelect.appendChild(opt);
                });
            }

            if (examSelect) {
                examSelect.innerHTML = '<option value="">-- परीक्षा चुनें --</option>';
                const exams = data.exams || [];
                if (exams.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = "";
                    opt.textContent = "-- कोई परीक्षा उपलब्ध नहीं --";
                    examSelect.appendChild(opt);
                } else {
                    exams.forEach(ex => {
                        const opt = document.createElement('option');
                        opt.value = ex;
                        opt.textContent = formatExamNameHindi(ex);
                        examSelect.appendChild(opt);
                    });
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load feeded exam list:", e);
        if (examSelect) {
            examSelect.innerHTML = `
                <option value="">-- परीक्षा चुनें --</option>
                <option value="Half-Yearly Examination">अर्द्धवार्षिक परीक्षा (Half-Yearly)</option>
                <option value="Annual Examination">वार्षिक परीक्षा (Annual)</option>
                <option value="Quarterly Examination">त्रैमासिक परीक्षा (Quarterly)</option>
                <option value="Sent-Up Examination">सेंट-अप परीक्षा (Sent-Up)</option>
            `;
        }
    }
}

function formatExamNameHindi(examName) {
    if (!examName) return "";
    const en = String(examName).toLowerCase();
    if (en.includes("quarterly") || en.includes("त्रैमासिक")) return "त्रैमासिक परीक्षा (Quarterly Exam)";
    if (en.includes("half") || en.includes("अर्द्धवार्षिक")) return "अर्द्धवार्षिक परीक्षा (Half-Yearly Exam)";
    if (en.includes("annual") || en.includes("वार्षिक")) return "वार्षिक परीक्षा (Annual Exam)";
    if (en.includes("sent-up") || en.includes("सेंट-अप")) return "सेंट-अप परीक्षा (Sent-Up Exam)";
    if (en.includes("monthly") || en.includes("मासिक")) return "मासिक परीक्षा (Monthly Exam)";
    return examName;
}

// Class change listener
const resClass = document.getElementById('resClass');
if (resClass) {
    resClass.addEventListener('change', function () {
        const streamGroup = document.getElementById('streamGroup');
        const isSenior = (this.value === '11' || this.value === '12');
        if (streamGroup) {
            streamGroup.style.display = isSenior ? 'block' : 'none';
            if (!isSenior) document.getElementById('resStream').value = '';
        }
        loadExamList();
    });
}

const resSession = document.getElementById('resSession');
if (resSession) {
    resSession.addEventListener('change', loadExamList);
}

// ── Search Form Submit Handler ──────────────────────────────────────────────
const resultSearchForm = document.getElementById('resultSearchForm');
if (resultSearchForm) {
    resultSearchForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const session = document.getElementById('resSession').value;
        const classNum = document.getElementById('resClass').value;
        const stream = document.getElementById('resStream') ? document.getElementById('resStream').value : '';
        const examName = document.getElementById('resExam').value;
        const rollNo = document.getElementById('resRollNo').value.trim();
        const dob = document.getElementById('resDob').value.trim();
        const msgEl = document.getElementById('searchMsg');

        if (!session || !classNum || !examName || !rollNo || !dob) {
            alert('कृपया सभी आवश्यक फ़ील्ड भरें।');
            return;
        }

        if ((classNum === '11' || classNum === '12') && !stream) {
            alert('कृपया संकाय (Stream) चुनें।');
            return;
        }

        if (msgEl) msgEl.textContent = '';
        showLoader('परीक्षा परिणाम खोजा जा रहा है...');

        try {
            const url = `${ADMIN_API_URL}?action=public.result.get&academicYear=${encodeURIComponent(session)}&examName=${encodeURIComponent(examName)}&className=${encodeURIComponent(classNum)}&stream=${encodeURIComponent(stream)}&rollNo=${encodeURIComponent(rollNo)}&dob=${encodeURIComponent(dob)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            hideLoader();

            if (data.success && data.studentResult) {
                currentResultData = data;
                renderReportCard(data);
                
                document.getElementById('searchSection').style.display = 'none';
                document.getElementById('reportCardWrapper').style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                if (msgEl) {
                    msgEl.style.color = '#dc2626';
                    msgEl.textContent = '❌ ' + (data.message || data.error || 'परिणाम नहीं मिला। कृपया अपने विवरण की जाँच करें।');
                }
            }
        } catch (err) {
            hideLoader();
            console.error(err);
            if (msgEl) {
                msgEl.style.color = '#dc2626';
                msgEl.textContent = '❌ सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।';
            }
        }
    });
}

// ── Report Card Rendering (Dual View: Mobile Cards + Desktop/Print Marksheet) ─
function renderReportCard(data) {
    const sheet = document.getElementById('reportCardSheet');
    if (!sheet) return;

    const isJunior = Number(data.classVal) <= 10;

    const desktopHtml = isJunior ? generateJuniorDesktopA4(data) : generateSeniorDesktopA4(data);
    const mobileHtml = isJunior ? generateJuniorMobileCards(data) : generateSeniorMobileCards(data);

    sheet.innerHTML = `
        <div class="desktop-only-result">
            ${desktopHtml}
        </div>
        <div class="mobile-only-result">
            ${mobileHtml}
        </div>
    `;

    // Re-bind click on any mobile print buttons
    const mobilePrintBtn = document.getElementById('btnMobilePrint');
    if (mobilePrintBtn) {
        mobilePrintBtn.addEventListener('click', () => window.print());
    }
    const mobileSearchAgain = document.getElementById('btnMobileSearchAgain');
    if (mobileSearchAgain) {
        mobileSearchAgain.addEventListener('click', resetSearch);
    }
}

// Format Date as DD/MM/YYYY
function formatDateDisplay(d) {
    if (!d) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }
    if (d instanceof Date) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }
    const s = String(d).trim().split('T')[0];
    if (s.includes('-')) {
        const p = s.split('-');
        if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return s;
}

// ── JUNIOR (CLASS 9-10) DESKTOP & PRINT A4 MARKSHEET ────────────────────────
function generateJuniorDesktopA4(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const classNumeral = Number(activeClassVal) === 10 ? 'X' : 'IX';

    const issueDate = formatDateDisplay(new Date());
    const issuePlace = "MUZAFFARPUR";
    const certNo = `Academic Session = ${academicYear} ,Exam Name = ${examName} ,class = ${activeClassVal} , Student Code = ${res.studentId || res.rollNo}`;

    const getSubObj = (subId) => {
        if (!subId) return {};
        const found = (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId));
        const subObj = found ? { ...found } : {};
        const sId = String(subId || "").toUpperCase();
        if (sId.endsWith("_SCI")) subObj.code = "112";
        if (sId.endsWith("_SST")) subObj.code = "111";
        if (sId.endsWith("_MAT")) subObj.code = "110";
        if (sId.endsWith("_ENG")) subObj.code = "113";
        return subObj;
    };

    const l1 = getSubObj(res.language1);
    const l2 = getSubObj(res.language2);
    const mat = getSubObj(`${activeClassVal}_MAT`);
    const sci = getSubObj(`${activeClassVal}_SCI`);
    const ssc = getSubObj(`${activeClassVal}_SST`);
    const eng = getSubObj(`${activeClassVal}_ENG`);

    const getScoreVal = (subId) => {
        const obj = res.subjectScores ? res.subjectScores[subId] : null;
        if (!obj) return "";
        return obj.totalObt !== undefined ? obj.totalObt : "";
    };

    const getTheoryVal = (subId) => {
        const obj = res.subjectScores ? res.subjectScores[subId] : null;
        if (!obj) return "";
        return obj.theoryObt !== undefined && obj.theoryObt !== null ? obj.theoryObt : "";
    };

    const getPracVal = (subId) => {
        const isSciOrSst = String(subId || "").includes("_SCI") || String(subId || "").includes("_SST");
        if (!isSciOrSst) return "-";
        const obj = res.subjectScores ? res.subjectScores[subId] : null;
        if (!obj) return "-";
        let p = obj.practicalObt;
        if ((p === "" || p === null || p === undefined || p === 0 || p === "0") && obj.internalObt) {
            p = obj.internalObt;
        }
        if (p === 0 || p === "0" || p === "" || p === null || p === undefined) return "-";
        return p;
    };

    return `
    <div class="bseb-web-print-card" style="width: 210mm; min-height: 290mm; max-height: 295mm; padding: 12mm 14mm; margin: 0 auto; background-color: #ffffff; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'130\\' viewBox=\\'0 0 280 130\\'><text x=\\'50%\\' y=\\'50%\\' fill=\\'rgba(0,0,0,0.035)\\' font-size=\\'12\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' transform=\\'rotate(-22 140 65)\\'>उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर</text></svg>'); background-repeat: repeat; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1e293b; position: relative; overflow: hidden; border: 2px solid #0f172a;">

        <!-- Double Inner Border Frame -->
        <div style="position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; border: 1px solid #0f172a; pointer-events: none; z-index: 10;"></div>

        <!-- Main Content Area -->
        <div style="position: relative; z-index: 1;">
            <!-- Header Container -->
            <div style="text-align: center; margin-bottom: 12px;">
                <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #1e3a8a; letter-spacing: 0.5px;">उच्चतर माध्यमिक विद्यालय कपरपुरा, काँटी, मुजफ्फरपुर</h1>
                <h2 style="font-size: 14px; font-weight: 600; margin: 3px 0; color: #475569;">UCHCH MADHYAMIK VIDYALAYA KAPARPURA, KANTI, MUZAFFARPUR</h2>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 4px;">UDISE : 10140616812 • BSEB MATRIC CODE : 51375</div>
                
                <!-- Pill Container for Exam Name -->
                <div style="display: inline-block; background: linear-gradient(135deg, #f8fafc, #e2e8f0); box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 20px; margin-top: 8px;">
                    <span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${examName} — STATEMENT OF MARKS (CLASS ${classNumeral})</span>
                </div>
            </div>

            <hr style="border: none; border-top: 1.5px solid #0f172a; margin: 0 0 12px 0;">

            <!-- Student Profile Info Grid -->
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; line-height: 1.65; margin-bottom: 14px; color: #0f172a;">
                <table style="border-collapse: collapse;">
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">नाम Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700; text-transform: uppercase;">${res.studentName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">पिता का नाम Father's Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; text-transform: uppercase;">${res.fatherName || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">माता का नाम Mother's Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; text-transform: uppercase;">${res.motherName || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">रोल नं. Roll No.</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">${res.rollNo}</td>
                    </tr>
                </table>

                <table style="border-collapse: collapse;">
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">UDISE CODE</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">10140616812</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">सत्र Session</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">${academicYear}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">कक्षा Class</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">Class ${activeClassVal} (${classNumeral})</td>
                    </tr>
                </table>
            </div>

            <!-- Marks Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; margin-bottom: 14px; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden;" border="1">
                <thead>
                    <tr style="background: #f1f5f9; font-weight: 700; color: #0f172a; height: 38px;">
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 10%;">CODE</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 30%;">SUBJECT</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;">FULL MARKS</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;">PASS MARKS</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;">THEORY</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;">INT/PRAC</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;">MARKS OBTAINED</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l1.code || '101'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${l1.name || 'HINDI'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(res.language1)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(res.language1)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(res.language1)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l2.code || '105'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${l2.name || 'SANSKRIT'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(res.language2)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(res.language2)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(res.language2)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${mat.code || '110'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${mat.name || 'MATHEMATICS'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_MAT`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_MAT`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_MAT`)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sci.code || '112'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${sci.name || 'SCIENCE'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_SCI`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_SCI`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_SCI`)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${ssc.code || '111'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${ssc.name || 'SOCIAL SCIENCE'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_SST`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_SST`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_SST`)}</td>
                    </tr>
                    <tr style="height: 34px; font-weight: 700; background: #f8fafc;">
                        <td style="border: 1px solid #0f172a; padding: 6px;" colspan="2">TOTAL</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">500</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">150</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;" colspan="2">-</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 800;">${res.grandTotal !== undefined ? res.grandTotal : ''}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${eng.code || '113'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${eng.name || 'ENGLISH'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">100</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">30</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_ENG`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_ENG`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_ENG`)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- FINAL RESULT Dashboard Container -->
            <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
                <div style="background: #f1f5f9; padding: 5px; text-align: center; font-weight: 800; font-size: 11.5px; color: #0f172a; border-bottom: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    FINAL RESULT SUMMARY
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px; gap: 4px; text-align: center; align-items: center;">
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">AGGREGATE MARKS</div>
                        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.grandTotal !== undefined ? res.grandTotal : '-'} / 500</div>
                    </div>
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">PERCENTAGE</div>
                        <div style="font-size: 14px; font-weight: 800; color: #2563eb; margin-top: 2px;">${res.percentage !== '0.0%' ? res.percentage : '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">RESULT / DIVISION</div>
                        <div style="font-size: 13px; font-weight: 800; color: #047857; margin-top: 2px;">${res.result} ${res.division ? '/ ' + res.division : ''}</div>
                    </div>
                </div>
            </div>

            <!-- Footer Details & Centered QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; font-size: 11px; color: #0f172a; padding: 0 10px;">
                <div>
                    <div style="font-weight: 700;">स्थान PLACE : ${issuePlace}</div>
                    <div style="margin-top: 4px; font-weight: 700;">दिनांक DATE : ${issueDate}</div>
                </div>

                <!-- Centered QR Code Stamp -->
                <div style="text-align: center;">
                    <div style="border: 1px solid #0f172a; padding: 4px; background: #fff; display: inline-block; border-radius: 4px;">
                        ${generateQrSvg(certNo)}
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 2px; font-weight: 600;">Scan to Verify</div>
                </div>

                <div style="text-align: right; font-size: 9.5px; color: #475569; max-width: 220px; line-height: 1.4;">
                    <strong>💻 ऑनलाइन प्राप्तांक विवरण</strong><br>
                    (Computer Generated Provisional Marksheet)
                </div>
            </div>

            <!-- Disclaimer Note at Very Bottom -->
            <div style="text-align: center; font-size: 9.5px; color: #64748b; margin-top: 24px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                नोट: यह इंटरनेट पर उपलब्ध कराया गया कंप्यूटर जनित प्राप्तांक विवरण है। किसी भी विसंगति की स्थिति में विद्यालय का मूल अभिलेख अंतिम एवं मान्य होगा।
            </div>
        </div>
    </div>`;
}

// ── SENIOR (CLASS 11-12) DESKTOP & PRINT A4 MARKSHEET ───────────────────────
function generateSeniorDesktopA4(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const stream = data.stream || res.stream || 'Science';
    const classNumeral = Number(activeClassVal) === 12 ? 'XII' : 'XI';

    const issueDate = formatDateDisplay(new Date());
    const issuePlace = "MUZAFFARPUR";
    const certNo = `Academic Session = ${academicYear} ,Exam Name = ${examName} ,class = ${activeClassVal} , Student Code = ${res.studentId || res.rollNo}`;

    const getSubDetails = (subId) => {
        if (!subId) return null;
        return (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId)) || null;
    };

    const getSubData = (subObj) => {
        if (!subObj) return { name: "", theoryObt: "-", practicalObt: "-", totalObt: "-", score: "-", tMax: 100, pMax: 0, fullMarks: 100, passMarks: 30, code: "" };
        const scoreObj = res.subjectScores ? res.subjectScores[subObj.subjectId] : null;
        const tMax = subObj.tMax || 100;
        const pMax = subObj.pMax || 0;
        const fullMarks = tMax + pMax;
        const passMarks = Math.ceil(fullMarks * 0.3);

        if (!scoreObj) {
            return { name: subObj.name, theoryObt: "-", practicalObt: "-", totalObt: "-", score: "-", tMax, pMax, fullMarks, passMarks, code: subObj.code || "" };
        }

        const theoryObt = scoreObj.theoryObt !== undefined && scoreObj.theoryObt !== null ? scoreObj.theoryObt : "-";
        const practicalObt = pMax > 0 ? (scoreObj.practicalObt !== undefined && scoreObj.practicalObt !== null ? scoreObj.practicalObt : "-") : "-";
        const totalObt = scoreObj.totalObt !== undefined && scoreObj.totalObt !== null ? scoreObj.totalObt : "-";

        return {
            name: subObj.name,
            theoryObt,
            practicalObt,
            totalObt,
            tMax,
            pMax,
            fullMarks,
            passMarks,
            code: subObj.code || ""
        };
    };

    const l1 = getSubDetails(res.language1);
    const l2 = getSubDetails(res.language2);
    const e1 = getSubDetails(res.elective1);
    const e2 = getSubDetails(res.elective2);
    const e3 = getSubDetails(res.elective3);
    const add = getSubDetails(res.additional);

    const sdL1 = getSubData(l1);
    const sdL2 = getSubData(l2);
    const sdE1 = getSubData(e1);
    const sdE2 = getSubData(e2);
    const sdE3 = getSubData(e3);
    const sdAdd = getSubData(add);

    const renderSubRow = (sd) => {
        if (!sd.name) return "";
        return `
        <tr style="height: 34px;">
            <td style="border: 1px solid #0f172a; padding: 6px;">${sd.code || '-'}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${sd.name}</td>
            <td style="border: 1px solid #0f172a; padding: 6px;">${sd.fullMarks}</td>
            <td style="border: 1px solid #0f172a; padding: 6px;">${sd.passMarks}</td>
            <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${sd.theoryObt}</td>
            <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${sd.pMax > 0 ? sd.practicalObt : '-'}</td>
            <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 800;">${sd.totalObt}</td>
        </tr>`;
    };

    return `
    <div class="bseb-web-print-card" style="width: 210mm; min-height: 290mm; max-height: 295mm; padding: 12mm 14mm; margin: 0 auto; background-color: #ffffff; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'130\\' viewBox=\\'0 0 280 130\\'><text x=\\'50%\\' y=\\'50%\\' fill=\\'rgba(0,0,0,0.035)\\' font-size=\\'12\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' transform=\\'rotate(-22 140 65)\\'>उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर</text></svg>'); background-repeat: repeat; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1e293b; position: relative; overflow: hidden; border: 2px solid #0f172a;">

        <!-- Double Inner Border Frame -->
        <div style="position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; border: 1px solid #0f172a; pointer-events: none; z-index: 10;"></div>

        <!-- Main Content Area -->
        <div style="position: relative; z-index: 1;">
            <!-- Header Container -->
            <div style="text-align: center; margin-bottom: 12px;">
                <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #1e3a8a; letter-spacing: 0.5px;">उच्चतर माध्यमिक विद्यालय कपरपुरा, काँटी, मुजफ्फरपुर</h1>
                <h2 style="font-size: 14px; font-weight: 600; margin: 3px 0; color: #475569;">UCHCH MADHYAMIK VIDYALAYA KAPARPURA, KANTI, MUZAFFARPUR</h2>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 4px;">UDISE : 10140616812 • BSEB INTER CODE : 31445</div>
                
                <!-- Pill Container for Exam Name -->
                <div style="display: inline-block; background: linear-gradient(135deg, #f8fafc, #e2e8f0); box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 20px; margin-top: 8px;">
                    <span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${examName} — STATEMENT OF MARKS (CLASS ${classNumeral} • ${stream.toUpperCase()} STREAM)</span>
                </div>
            </div>

            <hr style="border: none; border-top: 1.5px solid #0f172a; margin: 0 0 12px 0;">

            <!-- Student Profile Info Grid -->
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; line-height: 1.65; margin-bottom: 14px; color: #0f172a;">
                <table style="border-collapse: collapse;">
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">नाम Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700; text-transform: uppercase;">${res.studentName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">पिता का नाम Father's Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; text-transform: uppercase;">${res.fatherName || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">माता का नाम Mother's Name</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; text-transform: uppercase;">${res.motherName || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">रोल नं. Roll No.</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">${res.rollNo}</td>
                    </tr>
                </table>

                <table style="border-collapse: collapse;">
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">UDISE CODE</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">10140616812</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">सत्र Session</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">${academicYear}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">INTER CODE</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">31445</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">संकाय FACULTY</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700; text-transform: uppercase;">${stream.toUpperCase()}</td>
                    </tr>
                </table>
            </div>

            <!-- Marks Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12.5px; margin-bottom: 14px; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden;" border="1">
                <thead>
                    <tr style="background: #f1f5f9; font-weight: 700; color: #0f172a; height: 36px;">
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;" rowspan="2">CODE</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 32%;" rowspan="2">SUBJECT</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;" rowspan="2">FULL<br>MARKS</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;" rowspan="2">PASS<br>MARKS</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 22%;" colspan="2">MARKS OBTAINED</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 12%;" rowspan="2">SUBJECT<br>TOTAL</th>
                    </tr>
                    <tr style="background: #f1f5f9; font-weight: 700; color: #0f172a; height: 26px;">
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 11%;">THEORY</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 11%;">PRACTICAL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #f8fafc; font-weight: 700; text-align: left; height: 28px;">
                        <td colspan="7" style="border: 1px solid #0f172a; padding: 4px 10px; color: #0f172a;">1. अनिवार्य (Compulsory)</td>
                    </tr>
                    ${renderSubRow(sdL1)}
                    ${renderSubRow(sdL2)}
                    
                    <tr style="background: #f8fafc; font-weight: 700; text-align: left; height: 28px;">
                        <td colspan="7" style="border: 1px solid #0f172a; padding: 4px 10px; color: #0f172a;">2. ऐच्छिक (Elective)</td>
                    </tr>
                    ${renderSubRow(sdE1)}
                    ${renderSubRow(sdE2)}
                    ${renderSubRow(sdE3)}
                    
                    ${sdAdd.name ? `<tr style="background: #f8fafc; font-weight: 700; text-align: left; height: 28px;"><td colspan="7" style="border: 1px solid #0f172a; padding: 4px 10px; color: #0f172a;">3. अतिरिक्त (Additional)</td></tr>` + renderSubRow(sdAdd) : ''}
                </tbody>
            </table>

            <!-- FINAL RESULT Dashboard Container -->
            <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
                <div style="background: #f1f5f9; padding: 5px; text-align: center; font-weight: 800; font-size: 11.5px; color: #0f172a; border-bottom: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    FINAL RESULT SUMMARY
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px; gap: 4px; text-align: center; align-items: center;">
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">AGGREGATE MARKS</div>
                        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.grandTotal !== undefined ? res.grandTotal : '-'} / 500</div>
                    </div>
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">PERCENTAGE</div>
                        <div style="font-size: 14px; font-weight: 800; color: #2563eb; margin-top: 2px;">${res.percentage !== '0.0%' ? res.percentage : '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">RESULT / DIVISION</div>
                        <div style="font-size: 13px; font-weight: 800; color: #047857; margin-top: 2px;">${res.result} ${res.division ? '/ ' + res.division : ''}</div>
                    </div>
                </div>
            </div>

            <!-- Footer Details & Centered QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; font-size: 11px; color: #0f172a; padding: 0 10px;">
                <div>
                    <div style="font-weight: 700;">स्थान PLACE : ${issuePlace}</div>
                    <div style="margin-top: 4px; font-weight: 700;">दिनांक DATE : ${issueDate}</div>
                </div>

                <!-- Centered QR Code Stamp -->
                <div style="text-align: center;">
                    <div style="border: 1px solid #0f172a; padding: 4px; background: #fff; display: inline-block; border-radius: 4px;">
                        ${generateQrSvg(certNo)}
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 2px; font-weight: 600;">Scan to Verify</div>
                </div>

                <div style="text-align: right; font-size: 9.5px; color: #475569; max-width: 220px; line-height: 1.4;">
                    <strong>💻 ऑनलाइन प्राप्तांक विवरण</strong><br>
                    (Computer Generated Provisional Marksheet)
                </div>
            </div>

            <!-- Disclaimer Note at Very Bottom -->
            <div style="text-align: center; font-size: 9.5px; color: #64748b; margin-top: 24px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                नोट: यह इंटरनेट पर उपलब्ध कराया गया कंप्यूटर जनित प्राप्तांक विवरण है। किसी भी विसंगति की स्थिति में विद्यालय का मूल अभिलेख अंतिम एवं मान्य होगा।
            </div>
        </div>
    </div>`;
}

// ── JUNIOR (CLASS 9-10) MOBILE CARD VIEW ────────────────────────────────────
function generateJuniorMobileCards(data) {
    const res = data.studentResult;
    const isPass = (res.result === 'Pass' || !String(res.result).toLowerCase().includes('fail'));

    const getSubObj = (subId) => {
        if (!subId) return {};
        const found = (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId));
        return found ? { ...found } : {};
    };

    const getScores = (subId) => {
        const obj = res.subjectScores ? res.subjectScores[subId] : null;
        if (!obj) return { theory: '-', practical: '-', total: '-' };
        return {
            theory: obj.theoryObt !== undefined && obj.theoryObt !== null ? obj.theoryObt : '-',
            practical: obj.practicalObt !== undefined && obj.practicalObt !== null ? obj.practicalObt : (obj.internalObt || '-'),
            total: obj.totalObt !== undefined ? obj.totalObt : '-'
        };
    };

    const renderCard = (title, code, subId, hasPrac = false) => {
        const sc = getScores(subId);
        return `
        <div class="res-sub-card">
            <div>
                <div class="res-sub-title">${title} <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">(${code})</span></div>
                <div class="res-sub-meta">
                    सैद्धांतिक (Theory): <strong>${sc.theory}</strong>
                    ${hasPrac ? ` | प्रायोगिक (Prac): <strong>${sc.practical}</strong>` : ''}
                </div>
            </div>
            <div class="res-sub-score">
                ${sc.total}
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 500;">/ 100</div>
            </div>
        </div>
        `;
    };

    const l1 = getSubObj(res.language1);
    const l2 = getSubObj(res.language2);

    return `
    <div style="padding-bottom: 20px;">
        <!-- Student Header Card -->
        <div class="res-mobile-header-card">
            <div style="font-size: 0.85rem; color: #93c5fd; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                🎓 ${data.academicYear} • Class ${data.classVal}
            </div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">
                ${res.studentName}
            </div>
            <div style="font-size: 0.9rem; color: #cbd5e1; margin-top: 4px;">
                पिता: ${res.fatherName || '-'}
            </div>
            <div style="display: inline-flex; gap: 8px; margin-top: 12px;">
                <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                    क्रमांक (Roll): ${res.rollNo}
                </span>
                <span style="background: #d97706; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; color: #fff;">
                    ${data.examName}
                </span>
            </div>
        </div>

        <!-- Grand Total Score Banner -->
        <div class="res-mobile-score-card ${isPass ? '' : 'fail'}">
            <div style="font-size: 0.8rem; font-weight: 700; color: #047857; text-transform: uppercase;">
                कुल प्राप्तांक (Total Marks)
            </div>
            <div style="font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 4px 0;">
                ${res.grandTotal !== undefined ? res.grandTotal : '-'} <span style="font-size: 1.1rem; color: #64748b; font-weight: 600;">/ 500</span>
            </div>
            <div style="display: flex; justify-content: center; gap: 12px; align-items: center; margin-top: 6px;">
                <span style="font-size: 1.1rem; font-weight: 800; color: #2563eb;">
                    ${res.percentage !== '0.0%' ? res.percentage : '-'}
                </span>
                <span style="background: ${isPass ? '#10b981' : '#ef4444'}; color: white; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase;">
                    ${res.result} ${res.division ? '• ' + res.division : ''}
                </span>
            </div>
        </div>

        <!-- Subject List Header -->
        <div style="font-weight: 800; color: #0f172a; font-size: 1rem; margin: 18px 0 10px 4px; display: flex; align-items: center; gap: 6px;">
            📚 विषयवार प्राप्तांक विवरण (Subject Scores)
        </div>

        <!-- Subject Cards -->
        ${renderCard(l1.name || 'M.I.L. (Hindi/Urdu)', l1.code || '101', res.language1)}
        ${renderCard(l2.name || 'S.I.L. (Sanskrit/NLH)', l2.code || '105', res.language2)}
        ${renderCard('Mathematics (गणित)', '110', `${data.classVal}_MAT`)}
        ${renderCard('Science (विज्ञान)', '112', `${data.classVal}_SCI`, true)}
        ${renderCard('Social Science (सामाजिक विज्ञान)', '111', `${data.classVal}_SST`, true)}
        ${renderCard('English (अंग्रेज़ी)', '113', `${data.classVal}_ENG`)}

        <!-- Mobile Floating Action Bar -->
        <div style="margin-top: 22px; display: flex; flex-direction: column; gap: 10px;">
            <button type="button" id="btnMobilePrint" class="btn-primary btn-accent" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 14px;">
                🖨️ अंक-पत्रक प्रिंट / डाउनलोड करें (Print A4)
            </button>
            <button type="button" id="btnMobileSearchAgain" class="btn-primary btn-outline" style="width: 100%; padding: 12px; font-size: 0.95rem; border-radius: 14px;">
                🔍 अन्य छात्र का परिणाम खोजें
            </button>
        </div>
    </div>
    `;
}

// ── SENIOR (CLASS 11-12) MOBILE CARD VIEW ───────────────────────────────────
function generateSeniorMobileCards(data) {
    const res = data.studentResult;
    const stream = data.stream || res.stream || 'Science';
    const isPass = (res.result === 'Pass' || !String(res.result).toLowerCase().includes('fail'));

    const getSubDetails = (subId) => {
        if (!subId) return null;
        return (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId)) || null;
    };

    const renderSeniorCard = (subId, label) => {
        if (!subId) return '';
        const sub = getSubDetails(subId);
        if (!sub) return '';
        const scoreObj = res.subjectScores ? res.subjectScores[subId] : null;
        const th = scoreObj && scoreObj.theoryObt !== undefined ? scoreObj.theoryObt : '-';
        const pr = (sub.pMax > 0 && scoreObj && scoreObj.practicalObt !== undefined) ? scoreObj.practicalObt : '-';
        const tot = scoreObj && scoreObj.totalObt !== undefined ? scoreObj.totalObt : '-';

        return `
        <div class="res-sub-card">
            <div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">${label}</div>
                <div class="res-sub-title">${sub.name} <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">(${sub.code || '-'})</span></div>
                <div class="res-sub-meta">
                    सैद्धांतिक (Theory): <strong>${th}</strong>
                    ${sub.pMax > 0 ? ` | प्रायोगिक (Prac): <strong>${pr}</strong>` : ''}
                </div>
            </div>
            <div class="res-sub-score">
                ${tot}
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 500;">/ ${sub.tMax + sub.pMax}</div>
            </div>
        </div>
        `;
    };

    return `
    <div style="padding-bottom: 20px;">
        <!-- Student Header Card -->
        <div class="res-mobile-header-card">
            <div style="font-size: 0.85rem; color: #93c5fd; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                🎓 ${data.academicYear} • Class ${data.classVal} [${stream.toUpperCase()}]
            </div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">
                ${res.studentName}
            </div>
            <div style="font-size: 0.9rem; color: #cbd5e1; margin-top: 4px;">
                पिता: ${res.fatherName || '-'}
            </div>
            <div style="display: inline-flex; gap: 8px; margin-top: 12px;">
                <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                    क्रमांक (Roll): ${res.rollNo}
                </span>
                <span style="background: #d97706; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; color: #fff;">
                    ${data.examName}
                </span>
            </div>
        </div>

        <!-- Grand Total Score Banner -->
        <div class="res-mobile-score-card ${isPass ? '' : 'fail'}">
            <div style="font-size: 0.8rem; font-weight: 700; color: #047857; text-transform: uppercase;">
                कुल प्राप्तांक (Total Marks)
            </div>
            <div style="font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 4px 0;">
                ${res.grandTotal !== undefined ? res.grandTotal : '-'} <span style="font-size: 1.1rem; color: #64748b; font-weight: 600;">/ 500</span>
            </div>
            <div style="display: flex; justify-content: center; gap: 12px; align-items: center; margin-top: 6px;">
                <span style="font-size: 1.1rem; font-weight: 800; color: #2563eb;">
                    ${res.percentage !== '0.0%' ? res.percentage : '-'}
                </span>
                <span style="background: ${isPass ? '#10b981' : '#ef4444'}; color: white; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase;">
                    ${res.result} ${res.division ? '• ' + res.division : ''}
                </span>
            </div>
        </div>

        <!-- Subject List Header -->
        <div style="font-weight: 800; color: #0f172a; font-size: 1rem; margin: 18px 0 10px 4px; display: flex; align-items: center; gap: 6px;">
            📚 विषयवार प्राप्तांक विवरण (Subject Scores)
        </div>

        <!-- Subject Cards -->
        ${renderSeniorCard(res.language1, 'Compulsory 1 (अनिवार्य)')}
        ${renderSeniorCard(res.language2, 'Compulsory 2 (अनिवार्य)')}
        ${renderSeniorCard(res.elective1, 'Elective 1 (ऐच्छिक)')}
        ${renderSeniorCard(res.elective2, 'Elective 2 (ऐच्छिक)')}
        ${renderSeniorCard(res.elective3, 'Elective 3 (ऐच्छिक)')}
        ${res.additional ? renderSeniorCard(res.additional, 'Additional (अतिरिक्त)') : ''}

        <!-- Mobile Floating Action Bar -->
        <div style="margin-top: 22px; display: flex; flex-direction: column; gap: 10px;">
            <button type="button" id="btnMobilePrint" class="btn-primary btn-accent" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 14px;">
                🖨️ अंक-पत्रक प्रिंट / डाउनलोड करें (Print A4)
            </button>
            <button type="button" id="btnMobileSearchAgain" class="btn-primary btn-outline" style="width: 100%; padding: 12px; font-size: 0.95rem; border-radius: 14px;">
                🔍 अन्य छात्र का परिणाम खोजें
            </button>
        </div>
    </div>
    `;
}

// ── Reset Search ────────────────────────────────────────────────────────────
function resetSearch() {
    document.getElementById('reportCardWrapper').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('resRollNo').value = '';
    document.getElementById('resDob').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Action Buttons ──────────────────────────────────────────────────────────
const btnPrint = document.getElementById('btnPrintReportCard');
if (btnPrint) {
    btnPrint.addEventListener('click', function () {
        window.print();
    });
}

const btnAnother = document.getElementById('btnSearchAnother');
if (btnAnother) {
    btnAnother.addEventListener('click', resetSearch);
}

// ── Bootstrap on Load ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', initResultPortal);
