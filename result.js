/**
 * UHS Kaparpura - Public Student Examination Result Portal
 * Features:
 * 1. Live status check (result_published)
 * 2. Dynamic Exam loading (only exams with feeded marks)
 * 3. DOB-based student authentication & result verification
 * 4. Official BSEB Junior (9-10) and Senior (11-12) report card generation
 * 5. Strict 1-Page A4 print layout with embedded watermarks and signatures
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
        // Fallback: load exams
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
        // Fallback list
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
        sheet.innerHTML = generateJuniorReportCard(data);
    } else {
        sheet.innerHTML = generateSeniorReportCard(data);
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

// ── Class 9 & 10 (Junior) Report Card Generator ─────────────────────────────
function generateJuniorReportCard(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const assets = data.assets || {};
    const classNumeral = Number(activeClassVal) === 10 ? 'X' : 'IX';

    const issueDate = formatDateDisplay(assets.report_card_issue_date);
    const issuePlace = (assets.report_card_issue_place || "MUZAFFARPUR").toUpperCase();

    const teacherSig = assets.report_card_teacher_sig || "";
    const hmSig = assets.report_card_hm_sig || "";
    const schoolStamp = assets.report_card_school_stamp || "";

    const teacherSigHtml = teacherSig ? `<img src="${teacherSig}" style="height: 38px; width: 140px; object-fit: contain; display: block; margin: 0 auto;">` : `<div style="height: 32px;"></div>`;
    const hmSigHtml = hmSig ? `<img src="${hmSig}" style="position: absolute; bottom: 35px; left: 50%; transform: translateX(-50%); height: 44px; width: 150px; z-index: 2; object-fit: contain;">` : `<div style="height: 32px;"></div>`;
    const stampHtml = schoolStamp ? `<img src="${schoolStamp}" style="position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 75mm; height: 38mm; z-index: 1; opacity: 0.88; object-fit: contain;">` : ``;

    const getSubObj = (subId) => {
        if (!subId) return {};
        const found = (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId));
        return found ? { ...found } : {};
    };

    const l1 = getSubObj(res.language1);
    const l2 = getSubObj(res.language2);
    const mat = getSubObj(`${activeClassVal}_MAT`);
    const sci = getSubObj(`${activeClassVal}_SCI`);
    const ssc = getSubObj(`${activeClassVal}_SST`);
    const eng = getSubObj(`${activeClassVal}_ENG`);

    const getFullMarks = (subObj) => {
        if (!subObj || !subObj.totalMax) return 100;
        return subObj.totalMax;
    };

    const getPassMarks = (subObj) => {
        if (!subObj || !subObj.totalPassLimit) return 30;
        return subObj.totalPassLimit;
    };

    const renderJuniorRow = (subName, code, subObj, isSst = false, isSci = false) => {
        const fMarks = getFullMarks(subObj);
        const pMarks = getPassMarks(subObj);
        const th = subObj.theoryObt !== undefined && subObj.theoryObt !== null ? subObj.theoryObt : '';
        const pr = (isSci || isSst) ? (subObj.practicalObt !== undefined ? subObj.practicalObt : '') : '-';
        const tot = subObj.totalObt !== undefined ? subObj.totalObt : '';

        return `
            <tr>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 700;">${code}</td>
                <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 700; text-align: left;">${subName}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${fMarks}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${pMarks}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 600;">${th}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 600;">${pr}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 800;">${tot}</td>
            </tr>
        `;
    };

    return `
    <div style="position: relative; width: 100%; max-width: 200mm; margin: 0 auto; background-color: #ffffff; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'130\\' viewBox=\\'0 0 280 130\\'><text x=\\'50%\\' y=\\'50%\\' fill=\\'rgba(0,0,0,0.024)\\' font-size=\\'12\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' transform=\\'rotate(-22 140 65)\\'>उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर</text></svg>'); background-repeat: repeat; border: 2px solid #000; padding: 6mm 8mm; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.2pt; color: #000;">
        
        <!-- BSEB Watermark Emblem -->
        <img src="${BSEB_LOGO_B64}" style="position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%); width: 75mm; opacity: 0.08; pointer-events: none; z-index: 0;">

        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 6px; position: relative; z-index: 1;">
            <div style="font-size: 15pt; font-weight: 800; color: #1e3a8a; line-height: 1.2;">बिहार विद्यालय परीक्षा समिति, पटना</div>
            <div style="font-size: 9.5pt; font-weight: 700; color: #b45309; margin-top: 1px;">BIHAR SCHOOL EXAMINATION BOARD, PATNA</div>
            <div style="font-size: 11pt; font-weight: 800; margin-top: 2px;">उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर (विद्यालय कोड: 51375)</div>
            <div style="display: inline-block; background: #f1f5f9; border: 1.2px solid #000; border-radius: 16px; padding: 2px 14px; font-size: 8.5pt; font-weight: 800; margin-top: 4px;">
                अंक-पत्रक / MARKS SHEET — कक्षा ${classNumeral} (${examName})
            </div>
        </div>

        <!-- Student Details Grid -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt; position: relative; z-index: 1;">
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 20%; background: #f8fafc; font-weight: 700;">विद्यार्थी का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 800; color: #000;">${res.studentName}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 20%; background: #f8fafc; font-weight: 700;">क्रमांक (Roll No.):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 800; text-align: center;">${res.rollNo}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">माता का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 600;">${res.motherName || '-'}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">कक्षा (Class):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 700; text-align: center;">Class ${activeClassVal} (${classNumeral})</td>
            </tr>
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">पिता का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 600;">${res.fatherName || '-'}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">सत्र (Session):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 700; text-align: center;">${academicYear}</td>
            </tr>
        </table>

        <!-- Marks Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt; position: relative; z-index: 1;">
            <thead>
                <tr style="background: #1e3a8a; color: #fff;">
                    <th style="border: 1px solid #000; padding: 4px; width: 10%;">कोड</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 34%;">विषय (SUBJECTS)</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 11%;">पूर्णांक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 11%;">उत्तीर्णांक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 11%;">सैद्धांतिक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 11%;">प्रायोगिक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 12%;">कुल प्राप्तांक</th>
                </tr>
            </thead>
            <tbody>
                ${renderJuniorRow(l1.name || 'M.I.L. (Hindi/Urdu)', l1.code || '101', l1)}
                ${renderJuniorRow(l2.name || 'S.I.L. (Sanskrit/NLH)', l2.code || '102', l2)}
                ${renderJuniorRow(mat.name || 'Mathematics', '110', mat)}
                ${renderJuniorRow(sci.name || 'Science', '112', sci, false, true)}
                ${renderJuniorRow(ssc.name || 'Social Science', '111', ssc, true, false)}
                ${renderJuniorRow(eng.name || 'English', '113', eng)}
            </tbody>
        </table>

        <!-- Summary & Division Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8.2pt; position: relative; z-index: 1;">
            <tr style="background: #f8fafc;">
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">कुल पूर्णांक: <strong>500</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">प्राप्तांक: <strong style="font-size: 10pt; color: #1e3a8a;">${res.grandTotal || '-'}</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">प्रतिशत: <strong>${res.percentage ? res.percentage + '%' : '-'}</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 800; width: 25%; text-align: center; color: ${res.result === 'Pass' ? '#047857' : '#b91c1c'}; font-size: 10pt;">
                    ${res.division || res.result || 'PASS'}
                </td>
            </tr>
        </table>

        <!-- Issue Details & Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; font-size: 7.5pt; position: relative; z-index: 1;">
            <div style="text-align: center; width: 28%;">
                ${teacherSigHtml}
                <div style="border-top: 1px solid #000; padding-top: 2px; font-weight: 700;">वर्ग शिक्षक के हस्ताक्षर<br>(Class Teacher)</div>
            </div>
            
            <div style="text-align: center; width: 38%; position: relative;">
                ${stampHtml}
                ${hmSigHtml}
                <div style="border-top: 1px solid #000; padding-top: 2px; font-weight: 700;">प्रधानाध्यापक के हस्ताक्षर एवं मुहर<br>(Headmaster / Principal)</div>
            </div>

            <div style="text-align: right; width: 28%; font-size: 7.2pt; line-height: 1.4;">
                <div><strong>स्थान:</strong> ${issuePlace}</div>
                <div><strong>दिनांक:</strong> ${issueDate}</div>
            </div>
        </div>

    </div>
    `;
}

// ── Class 11 & 12 (Senior) Report Card Generator ────────────────────────────
function generateSeniorReportCard(data) {
    const res = data.studentResult;
    const examName = data.examName;
    const academicYear = data.academicYear;
    const activeClassVal = data.classVal;
    const stream = data.stream || res.stream || 'Science';
    const assets = data.assets || {};
    const classNumeral = Number(activeClassVal) === 12 ? 'XII' : 'XI';

    const issueDate = formatDateDisplay(assets.report_card_issue_date);
    const issuePlace = (assets.report_card_issue_place || "MUZAFFARPUR").toUpperCase();

    const teacherSig = assets.report_card_teacher_sig || "";
    const hmSig = assets.report_card_hm_sig || "";
    const schoolStamp = assets.report_card_school_stamp || "";

    const teacherSigHtml = teacherSig ? `<img src="${teacherSig}" style="height: 38px; width: 140px; object-fit: contain; display: block; margin: 0 auto;">` : `<div style="height: 32px;"></div>`;
    const hmSigHtml = hmSig ? `<img src="${hmSig}" style="position: absolute; bottom: 35px; left: 50%; transform: translateX(-50%); height: 44px; width: 150px; z-index: 2; object-fit: contain;">` : `<div style="height: 32px;"></div>`;
    const stampHtml = schoolStamp ? `<img src="${schoolStamp}" style="position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 75mm; height: 38mm; z-index: 1; opacity: 0.88; object-fit: contain;">` : ``;

    const getSubObj = (subId) => {
        if (!subId) return null;
        return (res.subjectDetails || []).find(s => String(s.subjectId) === String(subId)) || null;
    };

    const l1 = getSubObj(res.language1);
    const l2 = getSubObj(res.language2);
    const e1 = getSubObj(res.elective1);
    const e2 = getSubObj(res.elective2);
    const e3 = getSubObj(res.elective3);
    const add = getSubObj(res.additional);

    const renderSeniorRow = (groupName, subObj) => {
        if (!subObj) return '';
        const fMarks = subObj.totalMax || 100;
        const pMarks = subObj.totalPassLimit || 30;
        const th = subObj.theoryObt !== undefined && subObj.theoryObt !== null ? subObj.theoryObt : '';
        const pr = (subObj.pMax || 0) > 0 ? (subObj.practicalObt !== undefined ? subObj.practicalObt : '') : '-';
        const tot = subObj.totalObt !== undefined ? subObj.totalObt : '';

        return `
            <tr>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 7.5pt; font-weight: 700;">${groupName}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 700;">${subObj.code || '-'}</td>
                <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 700; text-align: left;">${subObj.name}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${fMarks}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${pMarks}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 600;">${th}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 600;">${pr}</td>
                <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 800;">${tot}</td>
            </tr>
        `;
    };

    return `
    <div style="position: relative; width: 100%; max-width: 200mm; margin: 0 auto; background-color: #ffffff; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'130\\' viewBox=\\'0 0 280 130\\'><text x=\\'50%\\' y=\\'50%\\' fill=\\'rgba(0,0,0,0.024)\\' font-size=\\'12\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' transform=\\'rotate(-22 140 65)\\'>उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर</text></svg>'); background-repeat: repeat; border: 2px solid #000; padding: 6mm 8mm; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.2pt; color: #000;">
        
        <!-- BSEB Watermark Emblem -->
        <img src="${BSEB_LOGO_B64}" style="position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%); width: 75mm; opacity: 0.08; pointer-events: none; z-index: 0;">

        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 6px; position: relative; z-index: 1;">
            <div style="font-size: 15pt; font-weight: 800; color: #1e3a8a; line-height: 1.2;">बिहार विद्यालय परीक्षा समिति, पटना</div>
            <div style="font-size: 9.5pt; font-weight: 700; color: #b45309; margin-top: 1px;">BIHAR SCHOOL EXAMINATION BOARD, PATNA</div>
            <div style="font-size: 11pt; font-weight: 800; margin-top: 2px;">उ.मा.वि. कपरपुरा, काँटी, मुजफ्फरपुर (+2 कोड: 31445)</div>
            <div style="display: inline-block; background: #f1f5f9; border: 1.2px solid #000; border-radius: 16px; padding: 2px 14px; font-size: 8.5pt; font-weight: 800; margin-top: 4px;">
                अंक-पत्रक / MARKS SHEET — कक्षा ${classNumeral} [${stream.toUpperCase()} STREAM] (${examName})
            </div>
        </div>

        <!-- Student Details Grid -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt; position: relative; z-index: 1;">
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 20%; background: #f8fafc; font-weight: 700;">विद्यार्थी का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 800;">${res.studentName}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 20%; background: #f8fafc; font-weight: 700;">क्रमांक (Roll No.):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 800; text-align: center;">${res.rollNo}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">माता का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 600;">${res.motherName || '-'}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">संकाय (Stream):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 700; text-align: center;">${stream}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">पिता का नाम:</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 600;">${res.fatherName || '-'}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; background: #f8fafc; font-weight: 700;">सत्र (Session):</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: 700; text-align: center;">${academicYear}</td>
            </tr>
        </table>

        <!-- Marks Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt; position: relative; z-index: 1;">
            <thead>
                <tr style="background: #1e3a8a; color: #fff;">
                    <th style="border: 1px solid #000; padding: 4px; width: 14%;">ग्रुप</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 8%;">कोड</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 30%;">विषय (SUBJECTS)</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 10%;">पूर्णांक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 10%;">उत्तीर्णांक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 9%;">सैद्धांतिक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 9%;">प्रायोगिक</th>
                    <th style="border: 1px solid #000; padding: 4px; width: 10%;">कुल प्राप्तांक</th>
                </tr>
            </thead>
            <tbody>
                ${renderSeniorRow('Compulsory 1', l1)}
                ${renderSeniorRow('Compulsory 2', l2)}
                ${renderSeniorRow('Elective 1', e1)}
                ${renderSeniorRow('Elective 2', e2)}
                ${renderSeniorRow('Elective 3', e3)}
                ${add ? renderSeniorRow('Additional', add) : ''}
            </tbody>
        </table>

        <!-- Summary & Division Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8.2pt; position: relative; z-index: 1;">
            <tr style="background: #f8fafc;">
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">कुल पूर्णांक: <strong>500</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">प्राप्तांक: <strong style="font-size: 10pt; color: #1e3a8a;">${res.grandTotal || '-'}</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 700; width: 25%;">प्रतिशत: <strong>${res.percentage ? res.percentage + '%' : '-'}</strong></td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: 800; width: 25%; text-align: center; color: ${res.result === 'Pass' ? '#047857' : '#b91c1c'}; font-size: 10pt;">
                    ${res.division || res.result || 'PASS'}
                </td>
            </tr>
        </table>

        <!-- Issue Details & Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; font-size: 7.5pt; position: relative; z-index: 1;">
            <div style="text-align: center; width: 28%;">
                ${teacherSigHtml}
                <div style="border-top: 1px solid #000; padding-top: 2px; font-weight: 700;">वर्ग शिक्षक के हस्ताक्षर<br>(Class Teacher)</div>
            </div>
            
            <div style="text-align: center; width: 38%; position: relative;">
                ${stampHtml}
                ${hmSigHtml}
                <div style="border-top: 1px solid #000; padding-top: 2px; font-weight: 700;">प्रधानाध्यापक के हस्ताक्षर एवं मुहर<br>(Headmaster / Principal)</div>
            </div>

            <div style="text-align: right; width: 28%; font-size: 7.2pt; line-height: 1.4;">
                <div><strong>स्थान:</strong> ${issuePlace}</div>
                <div><strong>दिनांक:</strong> ${issueDate}</div>
            </div>
        </div>

    </div>
    `;
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
