/**
 * UHS Kaparpura - Public Student Examination Result Portal
 * Matches the official BSEB Report Card format from Admin Portal's resultGeneration.js
 */

const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec';
const BSEB_LOGO_B64 = "https://raw.githubusercontent.com/EternalStud/uhskaparpura-admin-web/main/assets/images/bseb-logo.png";

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
            return `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="-2 -2 ${size + 4} ${size + 4}" style="display: block; margin: 0 auto; background: white; border-radius: 4px; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;"><path fill="#0f172a" d="${path}"/></svg>`;
        }
    } catch (e) {
        console.warn("QR generation error:", e);
    }
    return `<div style="width: 70px; height: 70px; background: #f1f5f9; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; margin: 0 auto; border-radius: 4px;">QR</div>`;
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
            // Update sessions if available
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

            // Update exams
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

// ── Report Card Rendering ───────────────────────────────────────────────────
function renderReportCard(data) {
    const sheet = document.getElementById('reportCardSheet');
    if (!sheet) return;

    const res = data.studentResult;
    const isJunior = Number(data.classVal) <= 10;

    if (isJunior) {
        sheet.innerHTML = generateJuniorReportCardHtml(data);
    } else {
        sheet.innerHTML = generateSeniorReportCardHtml(data);
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

// ── Class 9 & 10 (Junior) Report Card Generator (Matches resultGeneration.js) ──
function generateJuniorReportCardHtml(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const assets = data.assets || {};
    const classNumeral = Number(activeClassVal) === 10 ? 'X' : 'IX';

    const issueDate = formatDateDisplay(assets.report_card_issue_date);
    const issuePlace = (assets.report_card_issue_place || "MUZAFFARPUR").toUpperCase();

    const certNo = `Academic Session = ${academicYear} ,Exam Name = ${examName} ,class = ${activeClassVal} , Student Code = ${res.studentId || res.rollNo}`;

    const teacherSig = assets.report_card_teacher_sig || "";
    const hmSig = assets.report_card_hm_sig || "";
    const schoolStamp = assets.report_card_school_stamp || "";

    const teacherSigHtml = teacherSig 
        ? `<img src="${teacherSig}" style="height: 44px; width: 150px; object-fit: contain; display: block; margin: 0 auto 2px auto;">` 
        : `<div style="height: 38px;"></div>`;

    const hmSigHtml = hmSig 
        ? `<img src="${hmSig}" style="position: absolute; bottom: 42px; left: 50%; transform: translateX(-50%); height: 50px; width: 160px; z-index: 2; object-fit: contain;">` 
        : `<div style="height: 38px;"></div>`;

    const stampHtml = schoolStamp
        ? `<img src="${schoolStamp}" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 85mm; height: 42mm; z-index: 1; opacity: 0.90; object-fit: contain;">`
        : ``;

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

    const getFullMarks = (subObj) => {
        if (!subObj || Object.keys(subObj).length === 0) return 100;
        const total = (subObj.tMax || 0) + (subObj.pMax || 0);
        return total > 0 ? total : 100;
    };

    const getPassMarks = (subObj) => {
        if (!subObj || Object.keys(subObj).length === 0) return 30;
        if (subObj.passMarks) return subObj.passMarks;
        return Math.round(getFullMarks(subObj) * 0.3);
    };

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
        if ((p === "" || p === null || p === undefined || p === 0 || p === "0") && obj.internalObt !== undefined && obj.internalObt !== "" && obj.internalObt !== 0 && obj.internalObt !== "0") {
            p = obj.internalObt;
        }

        if (p === 0 || p === "0" || p === "" || p === null || p === undefined) {
            return "-";
        }
        return p;
    };

    const l1Full = getFullMarks(l1), l1Pass = getPassMarks(l1);
    const l2Full = getFullMarks(l2), l2Pass = getPassMarks(l2);
    const matFull = getFullMarks(mat), matPass = getPassMarks(mat);
    const sciFull = getFullMarks(sci), sciPass = getPassMarks(sci);
    const sscFull = getFullMarks(ssc), sscPass = getPassMarks(ssc);
    const engFull = getFullMarks(eng), engPass = getPassMarks(eng);

    const totalFullMarks = l1Full + l2Full + matFull + sciFull + sscFull;
    const totalPassMarks = l1Pass + l2Pass + matPass + sciPass + sscPass;

    return `
    <div class="bseb-report-card-page" style="width: 210mm; min-height: 290mm; max-height: 295mm; padding: 12mm 14mm; margin: 0 auto; background-color: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1e293b; position: relative; overflow: hidden; border: 2.5px solid #0f172a;">

        <!-- Double Inner Border Frame -->
        <div style="position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; border: 1px solid #0f172a; pointer-events: none; z-index: 10;"></div>

        <!-- Centered Emblem Watermark Layer -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 440px; height: 440px; opacity: 0.05; pointer-events: none; z-index: 5;">
            <img src="${BSEB_LOGO_B64}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>

        <!-- Main Content Area -->
        <div style="position: relative; z-index: 1;">
            <!-- Header Container -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="width: 120px; text-align: left; display: flex; align-items: center;">
                    <img src="${BSEB_LOGO_B64}" style="width: 110px; height: 110px; object-fit: contain;">
                </div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                    <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #1e3a8a; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 0px rgba(0,0,0,0.1);">बिहार विद्यालय परीक्षा समिति, पटना</h1>
                    <h2 style="font-size: 16px; font-weight: 600; margin: 3px 0; color: #dc2626;">Bihar School Examination Board, Patna</h2>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px;">विद्यालय: U.H.S. KAPARPURA, KANTI, MUZAFFARPUR</div>
                    
                    <!-- Pill Container for Exam Name -->
                    <div style="display: inline-block; background: linear-gradient(135deg, #f8fafc, #e2e8f0); box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 20px; margin-top: 8px;">
                        <span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${examName} STATEMENT OF MARKS</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px;">CLASS ${classNumeral}</div>
                </div>
                <div style="width: 120px;"></div>
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
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">BSEB CODE</td>
                        <td style="padding: 2px 8px; font-weight: 700;">:</td>
                        <td style="padding: 2px 0; font-weight: 700;">51375</td>
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
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l1Full}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l1Pass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(res.language1)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(res.language1)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(res.language1)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l2.code || '105'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${l2.name || 'SANSKRIT'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l2Full}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${l2Pass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(res.language2)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(res.language2)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(res.language2)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${mat.code || '110'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${mat.name || 'MATHEMATICS'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${matFull}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${matPass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_MAT`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_MAT`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_MAT`)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sci.code || '112'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${sci.name || 'SCIENCE'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sciFull}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sciPass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_SCI`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_SCI`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_SCI`)}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${ssc.code || '111'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${ssc.name || 'SOCIAL SCIENCE'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sscFull}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${sscPass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_SST`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_SST`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_SST`)}</td>
                    </tr>
                    <tr style="height: 34px; font-weight: 700; background: #f8fafc;">
                        <td style="border: 1px solid #0f172a; padding: 6px;" colspan="2">TOTAL</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${totalFullMarks}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${totalPassMarks}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;" colspan="2">-</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 800;">${res.grandTotal !== undefined ? res.grandTotal : ''}</td>
                    </tr>
                    <tr style="height: 34px;">
                        <td style="border: 1px solid #0f172a; padding: 6px;">${eng.code || '113'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px 12px; text-align: left; text-transform: uppercase;">${eng.name || 'ENGLISH'}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${engFull}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${engPass}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getTheoryVal(`${activeClassVal}_ENG`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px;">${getPracVal(`${activeClassVal}_ENG`)}</td>
                        <td style="border: 1px solid #0f172a; padding: 6px; font-weight: 700;">${getScoreVal(`${activeClassVal}_ENG`)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- FINAL RESULT Dashboard Container -->
            <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 12px; background-color: #ffffff;">
                <div style="background: #f1f5f9; padding: 5px; text-align: center; font-weight: 800; font-size: 11.5px; color: #0f172a; border-bottom: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    FINAL RESULT
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px; gap: 4px; text-align: center; align-items: center;">
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">AGGREGATE MARKS</div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.grandTotal !== undefined ? res.grandTotal : '-'}</div>
                    </div>
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">PERCENTAGE</div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #2563eb; margin-top: 2px;">${res.percentage !== '0.0%' ? res.percentage : '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">RESULT / DIVISION</div>
                        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.result} ${res.division ? '/ ' + res.division : ''}</div>
                    </div>
                </div>
            </div>

            <!-- Footer Details & Centered QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; font-size: 11.5px; color: #0f172a;">
                <div>
                    <div style="font-weight: 700;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2.5" style="vertical-align: -1px; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>PLACE : ${issuePlace}</div>
                    <div style="margin-top: 4px; font-weight: 700;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2.5" style="vertical-align: -1px; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>ISSUE DATE : ${issueDate}</div>
                </div>

                <!-- Centered QR Code Stamp -->
                <div style="text-align: center;">
                    <div style="border: 1px solid #0f172a; padding: 4px; background: #fff; display: inline-block; border-radius: 4px;">
                        ${generateQrSvg(certNo)}
                    </div>
                </div>

                <div style="width: 120px;"></div>
            </div>

            <!-- Signatures & Stamp Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; font-size: 12px; font-weight: 700; color: #0f172a;">
                <div style="text-align: center; width: 200px;">
                    ${teacherSigHtml}
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px;">Class Teacher's Signature</div>
                </div>

                <div style="text-align: center; width: 200px; position: relative; height: 160px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
                    ${stampHtml}
                </div>

                <div style="text-align: center; width: 200px; position: relative; height: 160px; display: flex; flex-direction: column; justify-content: flex-end;">
                    ${hmSigHtml}
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px; position: relative; z-index: 3;">Principal's Signature</div>
                </div>
            </div>

            <!-- Disclaimer Note at Very Bottom -->
            <div style="text-align: center; font-size: 10px; color: #475569; margin-top: 12px; font-weight: 600;">
                नोट: यह अंक विवरण विद्यालय द्वारा जारी किया गया है। / Note: This statement of marks is issued by the school.
            </div>
        </div>
    </div>`;
}

// ── Class 11 & 12 (Senior) Report Card Generator (Matches resultGeneration.js) ──
function generateSeniorReportCardHtml(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const stream = data.stream || res.stream || 'Science';
    const assets = data.assets || {};
    const classNumeral = Number(activeClassVal) === 12 ? 'XII' : 'XI';

    const issueDate = formatDateDisplay(assets.report_card_issue_date);
    const issuePlace = (assets.report_card_issue_place || "MUZAFFARPUR").toUpperCase();

    const certNo = `Academic Session = ${academicYear} ,Exam Name = ${examName} ,class = ${activeClassVal} , Student Code = ${res.studentId || res.rollNo}`;

    const teacherSig = assets.report_card_teacher_sig || "";
    const hmSig = assets.report_card_hm_sig || "";
    const schoolStamp = assets.report_card_school_stamp || "";

    const teacherSigHtml = teacherSig 
        ? `<img src="${teacherSig}" style="height: 44px; width: 150px; object-fit: contain; display: block; margin: 0 auto 2px auto;">` 
        : `<div style="height: 38px;"></div>`;

    const hmSigHtml = hmSig 
        ? `<img src="${hmSig}" style="position: absolute; bottom: 42px; left: 50%; transform: translateX(-50%); height: 50px; width: 160px; z-index: 2; object-fit: contain;">` 
        : `<div style="height: 38px;"></div>`;

    const stampHtml = schoolStamp
        ? `<img src="${schoolStamp}" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 85mm; height: 42mm; z-index: 1; opacity: 0.90; object-fit: contain;">`
        : ``;

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
        const score = scoreObj.score !== undefined && scoreObj.score !== null ? scoreObj.score : "-";

        return {
            name: subObj.name,
            theoryObt,
            practicalObt,
            totalObt,
            score,
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
    <div class="bseb-report-card-page" style="width: 210mm; min-height: 290mm; max-height: 295mm; padding: 12mm 14mm; margin: 0 auto; background-color: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1e293b; position: relative; overflow: hidden; border: 2.5px solid #0f172a;">

        <!-- Double Inner Border Frame -->
        <div style="position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; border: 1px solid #0f172a; pointer-events: none; z-index: 10;"></div>

        <!-- Single Centered Faint BSEB Seal Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; height: 420px; opacity: 0.05; pointer-events: none; z-index: 5;">
            <img src="${BSEB_LOGO_B64}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>

        <!-- Main Content Area -->
        <div style="position: relative; z-index: 1;">
            <!-- Header Container -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="width: 120px; text-align: left; display: flex; align-items: center;">
                    <img src="${BSEB_LOGO_B64}" style="width: 110px; height: 110px; object-fit: contain;">
                </div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                    <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #1e3a8a; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 0px rgba(0,0,0,0.1);">बिहार विद्यालय परीक्षा समिति, पटना</h1>
                    <h2 style="font-size: 16px; font-weight: 600; margin: 3px 0; color: #dc2626;">Bihar School Examination Board, Patna</h2>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px;">विद्यालय: U.H.S. KAPARPURA, KANTI, MUZAFFARPUR</div>
                    
                    <!-- Pill Container for Exam Name -->
                    <div style="display: inline-block; background: linear-gradient(135deg, #f8fafc, #e2e8f0); box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 20px; margin-top: 8px;">
                        <span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${examName} STATEMENT OF MARKS</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px;">CLASS ${classNumeral}</div>
                </div>
                <div style="width: 120px;"></div>
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
                        <td style="padding: 2px 8px 2px 0; white-space: nowrap;">FACULTY</td>
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
            <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 12px; background-color: #ffffff;">
                <div style="background: #f1f5f9; padding: 5px; text-align: center; font-weight: 800; font-size: 11.5px; color: #0f172a; border-bottom: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    FINAL RESULT
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px; gap: 4px; text-align: center; align-items: center;">
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">AGGREGATE MARKS</div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.grandTotal !== undefined ? res.grandTotal : '-'}</div>
                    </div>
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 4px;">
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">PERCENTAGE</div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #2563eb; margin-top: 2px;">${res.percentage !== '0.0%' ? res.percentage : '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">RESULT / DIVISION</div>
                        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">${res.result} ${res.division ? '/ ' + res.division : ''}</div>
                    </div>
                </div>
            </div>

            <!-- Footer Details & Centered QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; font-size: 11.5px; color: #0f172a;">
                <div>
                    <div style="font-weight: 700;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2.5" style="vertical-align: -1px; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>PLACE : ${issuePlace}</div>
                    <div style="margin-top: 4px; font-weight: 700;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2.5" style="vertical-align: -1px; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>ISSUE DATE : ${issueDate}</div>
                </div>

                <!-- Centered QR Code Stamp -->
                <div style="text-align: center;">
                    <div style="border: 1px solid #0f172a; padding: 4px; background: #fff; display: inline-block; border-radius: 4px;">
                        ${generateQrSvg(certNo)}
                    </div>
                </div>

                <div style="width: 120px;"></div>
            </div>

            <!-- Signatures & Stamp Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; font-size: 12px; font-weight: 700; color: #0f172a;">
                <div style="text-align: center; width: 200px;">
                    ${teacherSigHtml}
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px;">Class Teacher's Signature</div>
                </div>

                <div style="text-align: center; width: 200px; position: relative; height: 160px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
                    ${stampHtml}
                </div>

                <div style="text-align: center; width: 200px; position: relative; height: 160px; display: flex; flex-direction: column; justify-content: flex-end;">
                    ${hmSigHtml}
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px; position: relative; z-index: 3;">Principal's Signature</div>
                </div>
            </div>

            <!-- Disclaimer Note at Very Bottom -->
            <div style="text-align: center; font-size: 10px; color: #475569; margin-top: 12px; font-weight: 600;">
                नोट: यह अंक विवरण विद्यालय द्वारा जारी किया गया है। / Note: This statement of marks is issued by the school.
            </div>
        </div>
    </div>`;
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
    btnAnother.addEventListener('click', function () {
        document.getElementById('reportCardWrapper').style.display = 'none';
        document.getElementById('searchSection').style.display = 'block';
        document.getElementById('resRollNo').value = '';
        document.getElementById('resDob').value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Bootstrap on Load ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', initResultPortal);
