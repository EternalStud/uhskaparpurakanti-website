const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec';

let photoBase64 = '';
let signatureBase64 = '';
let fetchedStudentData = null;
let currentSubjectsConfig = [];

/**
 * Verhoeff Checksum Algorithm for Indian Aadhaar Number Validation
 * Rejects invalid prefixes (0, 1), repeated numbers (999999999999), and checksum mismatches.
 */
const Verhoeff = {
    d: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ],
    p: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ],
    validate: function (aadhaarNumber) {
        if (!aadhaarNumber || typeof aadhaarNumber !== 'string') return false;
        const clean = aadhaarNumber.replace(/\s+/g, '');
        if (!/^\d{12}$/.test(clean)) return false;
        if (clean[0] === '0' || clean[0] === '1') return false;
        if (/^(\d)\1{11}$/.test(clean)) return false;

        let c = 0;
        const invertedArray = clean.split('').map(Number).reverse();
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[i % 8][invertedArray[i]]];
        }
        return c === 0;
    }
};

function showLoader(message = 'कृपया प्रतीक्षा करें...') {
    const loader = document.getElementById('loader');
    if (loader) {
        const p = loader.querySelector('p');
        if(p) p.textContent = message;
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function updateProgressStep(step) {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) el.classList.add('completed');
        else if (index + 1 === step) el.classList.add('active');
    });
    
    document.querySelectorAll('.progress-divider').forEach((el, index) => {
        el.classList.remove('active');
        if (index + 1 < step) el.classList.add('active');
    });
}

// Photo & Signature Logic (Strict JPEG/JPG Only)
const photoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');
if (photoInput) {
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        // 1. Strict JPEG/JPG Check (Reject PNG and others)
        const validTypes = ['image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type) || !/\.(jpe?g)$/i.test(file.name)) {
            alert('कृपया केवल वैध JPEG / JPG इमेज फाइल अपलोड करें। (PNG या अन्य फॉर्मेट मान्य नहीं है)');
            this.value = ''; photoBase64 = ''; return;
        }

        // 2. Strict File Size Check: 40KB to 100KB
        const sizeKB = file.size / 1024;
        if (sizeKB < 40 || sizeKB > 100) {
            alert(`फोटो का आकार 40KB से 100KB के बीच होना चाहिए।\n(वर्तमान आकार: ${sizeKB.toFixed(1)} KB)`);
            this.value = ''; photoBase64 = ''; return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                photoBase64 = e.target.result.split(',')[1];
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            img.onerror = function() {
                alert('यह फाइल करप्ट है या फोटो नहीं है।');
                photoInput.value = ''; photoBase64 = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const signInput = document.getElementById('studentSignature');
const signPreview = document.getElementById('signaturePreview');
if (signInput) {
    signInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        // 1. Strict JPEG/JPG Check (Reject PNG and others)
        const validTypes = ['image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type) || !/\.(jpe?g)$/i.test(file.name)) {
            alert('कृपया केवल वैध JPEG / JPG हस्ताक्षर फाइल अपलोड करें। (PNG या अन्य फॉर्मेट मान्य नहीं है)');
            this.value = ''; signatureBase64 = ''; return;
        }

        // 2. Strict File Size Check: 5KB to 20KB
        const sizeKB = file.size / 1024;
        if (sizeKB < 5 || sizeKB > 20) {
            alert(`हस्ताक्षर का आकार 5KB से 20KB के बीच होना चाहिए।\n(वर्तमान आकार: ${sizeKB.toFixed(1)} KB)`);
            this.value = ''; signatureBase64 = ''; return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                signatureBase64 = e.target.result.split(',')[1];
                signPreview.innerHTML = `<img src="${e.target.result}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
            };
            img.onerror = function() {
                alert('यह फाइल करप्ट है या हस्ताक्षर नहीं है।');
                signInput.value = ''; signatureBase64 = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Validation inputs
['mobile', 'pinCode', 'aadhaar', 'apaarId', 'bankAccount', 'regStudentCode', 'downloadAadhaar'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    }
});

// Live visual feedback for Aadhaar validation
const aadhaarInput = document.getElementById('aadhaar');
if (aadhaarInput) {
    aadhaarInput.addEventListener('blur', function () {
        const val = this.value.trim();
        if (val.length === 12) {
            if (Verhoeff.validate(val)) {
                this.style.borderColor = '#10b981';
            } else {
                this.style.borderColor = '#ef4444';
            }
        } else if (val.length > 0) {
            this.style.borderColor = '#ef4444';
        } else {
            this.style.borderColor = '';
        }
    });
}

const bankIFSC = document.getElementById('bankIFSC');
if (bankIFSC) {
    bankIFSC.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 11);
    });
}

['studentName', 'fatherName', 'motherName'].forEach(id => {
    const field = document.getElementById(id);
    if(field) {
        field.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-Z\u0900-\u097F .]/g, '');
        });
    }
});

const bankName = document.getElementById('bankName');
if(bankName) {
    bankName.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z ]/g, '');
    });
}

// Basic text for marks and addresses (no punctuation allowed)
['mark1', 'mark2', 'address', 'townCity', 'district'].forEach(id => {
    const field = document.getElementById(id);
    if(field) {
        field.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, '');
        });
    }
});

// Email strict input and blur validation
const emailF = document.getElementById('email');
if(emailF) {
    emailF.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z0-9.@_-]/g, '');
    });
    emailF.addEventListener('blur', function() {
        if(this.value && !this.value.includes('@')) {
            alert('Please enter a valid email.');
        }
    });
}

// Search Mode Tab Buttons
let isCodeSearchMode = true;
const tabSearchByCode = document.getElementById('tabSearchByCode');
const tabSearchByRoll = document.getElementById('tabSearchByRoll');

function setSearchMode(mode) {
    isCodeSearchMode = (mode === 'code');
    if (tabSearchByCode) tabSearchByCode.classList.toggle('active', isCodeSearchMode);
    if (tabSearchByRoll) tabSearchByRoll.classList.toggle('active', !isCodeSearchMode);

    const codeGroup = document.getElementById('searchCodeGroup');
    const rollGroup = document.getElementById('searchRollGroup');
    const dobGroup = document.getElementById('searchDobGroup');

    if (codeGroup) codeGroup.style.display = isCodeSearchMode ? 'block' : 'none';
    if (rollGroup) rollGroup.style.display = isCodeSearchMode ? 'none' : 'block';
    if (dobGroup) dobGroup.style.display = isCodeSearchMode ? 'none' : 'block';

    if (isCodeSearchMode) {
        const rollInput = document.getElementById('searchRollNo');
        const dobInput = document.getElementById('searchDob');
        if (rollInput) rollInput.value = '';
        if (dobInput) dobInput.value = '';
    } else {
        const codeInput = document.getElementById('regStudentCode');
        if (codeInput) codeInput.value = '';
    }
}

if (tabSearchByCode) tabSearchByCode.addEventListener('click', () => setSearchMode('code'));
if (tabSearchByRoll) tabSearchByRoll.addEventListener('click', () => setSearchMode('roll_dob'));

// Check portal settings on page load
async function checkPortalSettings() {
    try {
        const res = await fetch(`${ADMIN_API_URL}?action=public.settings.get`);
        const data = await res.json();
        if (data && data.success && data.settings) {
            const isRegOpen = data.settings.registration_open;
            const closedNotice = document.getElementById('portalClosedNotice');
            const searchSec = document.getElementById('searchSection');
            const progCont = document.getElementById('progressContainer');

            if (!isRegOpen) {
                if (closedNotice) closedNotice.style.display = 'block';
                if (searchSec) searchSec.style.display = 'none';
                if (progCont) progCont.style.display = 'none';

                const btnShowReceipt = document.getElementById('btnShowReceiptFinderOnly');
                if (btnShowReceipt) {
                    btnShowReceipt.onclick = () => {
                        if (searchSec) searchSec.style.display = 'block';
                        const existingBox = document.getElementById('existingReceiptBox');
                        if (existingBox) existingBox.style.display = 'block';
                        closedNotice.style.display = 'none';
                    };
                }
            }
        }
    } catch (e) {
        console.warn("Settings check failed, defaulting to active:", e);
    }
}
window.addEventListener('DOMContentLoaded', checkPortalSettings);

// Class change listener
const regClass = document.getElementById('regClass');
if(regClass) {
    regClass.addEventListener('change', function() {
        const streamBlock = document.getElementById('searchStreamBlock');
        if (this.value === '11') {
            streamBlock.style.display = 'block';
        } else {
            streamBlock.style.display = 'none';
            document.getElementById('searchStream').value = '';
        }
    });
}

// Fetch Student
document.getElementById('btnFetchStudent').addEventListener('click', async () => {
    const classNum = document.getElementById('regClass').value;
    const streamVal = document.getElementById('searchStream') ? document.getElementById('searchStream').value : "";
    const isCodeSearch = isCodeSearchMode;
    
    const studentCode = document.getElementById('regStudentCode') ? document.getElementById('regStudentCode').value.trim() : "";
    const rollNo = document.getElementById('searchRollNo') ? document.getElementById('searchRollNo').value.trim() : "";
    const searchDob = document.getElementById('searchDob') ? document.getElementById('searchDob').value.trim() : "";
    const fetchMsg = document.getElementById('fetchMessage');

    if (!classNum) {
        alert("कृपया कक्षा का चयन करें।");
        return;
    }

    if (classNum === '11' && !streamVal) {
        alert("कृपया संकाय (Stream) चुनें।");
        return;
    }

    if (isCodeSearch && !studentCode) {
        alert("कृपया छात्र कोड दर्ज करें।");
        return;
    }

    if (!isCodeSearch && (!rollNo || !searchDob)) {
        alert("कृपया क्रमांक (Roll No.) एवं जन्म तिथि (Date of Birth) दोनों दर्ज करें।");
        return;
    }

    showLoader("छात्र विवरण खोजा जा रहा है...");
    fetchMsg.textContent = "";

    try {
        let url = `${ADMIN_API_URL}?action=public.registration.getStudent&className=${classNum}`;
        if (isCodeSearch) {
            url += `&studentCode=${encodeURIComponent(studentCode)}`;
        } else {
            url += `&rollNo=${encodeURIComponent(rollNo)}&dob=${encodeURIComponent(searchDob)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const arCard = document.getElementById('alreadyRegisteredCard');
        if (arCard) arCard.style.display = 'none';

        const isAlready = data.alreadyRegistered || (data.student && data.student.alreadyRegistered);

        if (isAlready) {
            document.getElementById('registrationDetails').style.display = 'none';
            fetchMsg.textContent = "";
            if (arCard) {
                arCard.style.display = 'block';
                const stObj = data.student?.student || data.student || {};
                const regId = data.regId || data.student?.regId || stObj.regId || '-';
                const stName = stObj.studentName || data.student?.studentName || '-';
                const roll = stObj.rollNo || data.student?.rollNo || '-';
                const stStatus = data.status || data.student?.status || 'Pending';

                document.getElementById('arStudentName').textContent = stName;
                document.getElementById('arRegId').textContent = regId;
                document.getElementById('arClassRoll').textContent = `Class ${classNum}, Roll: ${roll}`;
                document.getElementById('arStatus').textContent = (stStatus.toLowerCase() === 'verified') ? '✓ Verified (सत्यापित)' : '⏳ Pending (सत्यापन लंबित)';
                
                const btnAr = document.getElementById('btnArDownloadReceipt');
                if (btnAr) {
                    btnAr.onclick = () => {
                        if (regId && regId !== '-') {
                            window.open(`registration-receipt.html?id=${encodeURIComponent(regId)}`, '_blank');
                        }
                    };
                }
            }
            updateProgressStep(1);
            return;
        }

        if (data.success && data.student) {
            fetchedStudentData = data.student;
            if (classNum === '11') {
                fetchedStudentData.stream = streamVal;
            }
            populateForm(data.student);
            document.getElementById('registrationDetails').style.display = 'block';
            fetchMsg.textContent = "विद्यार्थी मिल गया! कृपया शेष विवरण भरें।";
            fetchMsg.style.color = "#10b981";
            updateProgressStep(2);
        } else {
            document.getElementById('registrationDetails').style.display = 'none';
            fetchMsg.textContent = data.message || "आप फॉर्म भरने के योग्य नहीं हैं या विवरण सुलभ नहीं है। (You are not eligible or details not found.)";
            fetchMsg.style.color = "#ef4444";
        }
    } catch (err) {
        document.getElementById('registrationDetails').style.display = 'none';
        fetchMsg.textContent = "सर्वर त्रुटि। (Server error.)";
        fetchMsg.style.color = "#ef4444";
    } finally {
        hideLoader();
    }
});

function populateForm(student) {
    document.getElementById('studentName').value = student.studentName || '';
    document.getElementById('fatherName').value = student.fatherName || '';
    document.getElementById('motherName').value = student.motherName || '';
    
    let dobVal = student.dob || '';
    if (dobVal) {
        try {
            const d = new Date(dobVal);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dobVal = `${year}-${month}-${day}`;
            } else {
                const dateRegex = /([a-zA-Z]{3}) (\d{1,2}) (\d{4})/;
                const match = String(student.dob).match(dateRegex);
                if(match) {
                    const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
                    dobVal = `${match[3]}-${months[match[1]]}-${match[2].padStart(2, '0')}`;
                }
            }
        } catch(e) {
            console.log("Date parsing error", e);
        }
    }
    document.getElementById('dob').value = dobVal;

    document.getElementById('aadhaar').value = student.aadhaar || '';
    document.getElementById('mobile').value = student.mobile || '';
    document.getElementById('bankAccount').value = student.bankAccount || '';
    document.getElementById('bankIFSC').value = student.bankIFSC || '';
    if (document.getElementById('religion')) {
        document.getElementById('religion').value = student.religion || '';
    }
    
    // Always false as we collect via dropdowns even if they have old tags
    document.getElementById('hasExistingSubjects').value = "false";
    const existingMsg = document.getElementById('existingSubjectsMsg');
    
    if (student.subjects && student.subjects.length > 0) {
        existingMsg.style.display = 'block';
    } else {
        existingMsg.style.display = 'none';
    }

    const classNum = parseInt(student.className, 10);
    if (classNum === 11) {
        loadSubjectDropdowns(11, fetchedStudentData.stream);
    } else {
        loadSubjectDropdowns(9, "");
    }
}

async function loadSubjectDropdowns(classNum, stream) {
    if (classNum === 11 && !stream) {
        document.getElementById('subjectGrid').innerHTML = '';
        return;
    }
    
    showLoader("विषय लोड हो रहे हैं...");
    try {
        const url = `${ADMIN_API_URL}?action=public.subject.tag.getDropdowns&classNum=${classNum}&stream=${stream}&academicYear=${fetchedStudentData.academicYear}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.subjects) {
            currentSubjectsConfig = data.subjects;
            renderSubjectDropdowns(classNum);
            
            // Pre-select if they have existing tags
            if (fetchedStudentData.subjects && fetchedStudentData.subjects.length > 0) {
                const selects = Array.from(document.querySelectorAll('.subject-select'));
                for (let i = 0; i < selects.length; i++) {
                    if (fetchedStudentData.subjects[i]) {
                        const sel = selects[i];
                        const availableOpts = Array.from(sel.options).map(o => o.value);
                        if (availableOpts.includes(fetchedStudentData.subjects[i])) {
                            sel.value = fetchedStudentData.subjects[i];
                            updateSubjectDropdowns(); // Apply exclusions immediately for the next dropdowns
                        }
                    }
                }
            }
        }
    } catch(err) {
        console.error(err);
        alert("Failed to load subjects.");
    } finally {
        hideLoader();
    }
}

function renderSubjectDropdowns(classNum) {
    const grid = document.getElementById('subjectGrid');
    let html = '';
    
    if (classNum === 9) {
        html += `<div style="grid-column: 1 / -1; margin-bottom: 15px;">
            <p style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">अनिवार्य विषय (Compulsory Subjects):</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: #e2e8f0; padding: 6px 15px; border-radius: 6px; font-weight: 500;">Mathematics</span>
                <span style="background: #e2e8f0; padding: 6px 15px; border-radius: 6px; font-weight: 500;">Science</span>
                <span style="background: #e2e8f0; padding: 6px 15px; border-radius: 6px; font-weight: 500;">Social Science</span>
                <span style="background: #e2e8f0; padding: 6px 15px; border-radius: 6px; font-weight: 500;">English</span>
            </div>
        </div>`;
    }

    const l1Opts = currentSubjectsConfig.filter(s => s.group === "Language 1");
    const l2Opts = currentSubjectsConfig.filter(s => s.group === "Language 2");
    
    html += buildSelect("Language 1 (MIL)", "sub_l1", l1Opts, true);
    html += buildSelect("Language 2 (SIL)", "sub_l2", l2Opts, true);
    
    if (classNum === 11) {
        const elecOpts = currentSubjectsConfig.filter(s => s.group === "Elective");
        const addOpts = currentSubjectsConfig.filter(s => s.group === "Additional");
        
        html += buildSelect("Elective 1", "sub_e1", elecOpts, true);
        html += buildSelect("Elective 2", "sub_e2", elecOpts, true);
        html += buildSelect("Elective 3", "sub_e3", elecOpts, true);
        html += buildSelect("Additional Subject", "sub_add", addOpts, false, true);
    }
    
    grid.innerHTML = html;

    // Attach listeners for dynamic filtering
    document.querySelectorAll('.subject-select').forEach(sel => {
        sel.addEventListener('change', updateSubjectDropdowns);
    });
}

function buildSelect(label, id, options, required, isOptional = false) {
    let html = `<div class="input-group"><label>${label} ${required ? '<span style="color:red">*</span>' : ''}</label>`;
    html += `<select id="${id}" class="subject-select" data-group="${options[0]?.group || ''}" ${required ? 'required' : ''}>`;
    html += `<option value="">-- चुनें (Select) --</option>`;
    if (isOptional) {
        html += `<option value="NONE">None</option>`;
    }
    options.forEach(opt => {
        html += `<option value="${opt.name}">${opt.name}</option>`;
    });
    html += `</select></div>`;
    return html;
}

function updateSubjectDropdowns() {
    const classNum = parseInt(fetchedStudentData.className, 10);
    const selL1 = document.getElementById('sub_l1');
    const selL2 = document.getElementById('sub_l2');
    const selE1 = document.getElementById('sub_e1');
    const selE2 = document.getElementById('sub_e2');
    const selE3 = document.getElementById('sub_e3');
    const selAdd = document.getElementById('sub_add');
    
    const valL1 = selL1 ? selL1.value : '';
    const valL2 = selL2 ? selL2.value : '';
    const valE1 = selE1 ? selE1.value : '';
    const valE2 = selE2 ? selE2.value : '';
    const valE3 = selE3 ? selE3.value : '';
    const valAdd = selAdd ? selAdd.value : '';

    const selects = document.querySelectorAll('.subject-select');
    
    selects.forEach(sel => {
        const currentVal = sel.value;
        const group = sel.getAttribute('data-group');
        const isOptional = sel.querySelector('option[value="NONE"]') !== null || sel.id === 'sub_add';
        
        let filteredOptions = currentSubjectsConfig.filter(s => s.group === group);

        if (sel.id === 'sub_l1') {
            // No filtering
        } else if (sel.id === 'sub_l2') {
            filteredOptions = filteredOptions.filter(opt => {
                if (!valL1 || valL1 === "NONE") return true;
                if (opt.name === valL1) return false;
                if (classNum === 9 || classNum === 10) {
                    if (valL1.toLowerCase().includes("hindi") && (opt.name.toLowerCase().includes("hindi") || opt.name.toLowerCase().includes("nlh"))) {
                        return false;
                    }
                }
                return true;
            });
        } else if (sel.id === 'sub_e1') {
            filteredOptions = filteredOptions.filter(opt => opt.name !== valE2 && opt.name !== valE3);
        } else if (sel.id === 'sub_e2') {
            filteredOptions = filteredOptions.filter(opt => opt.name !== valE1 && opt.name !== valE3);
        } else if (sel.id === 'sub_e3') {
            filteredOptions = filteredOptions.filter(opt => opt.name !== valE1 && opt.name !== valE2);
        } else if (sel.id === 'sub_add') {
            const chosen = [valL1, valL2, valE1, valE2, valE3].filter(v => v && v !== "NONE");
            filteredOptions = filteredOptions.filter(opt => !chosen.includes(opt.name));
        }

        let newHtml = `<option value="">-- चुनें (Select) --</option>`;
        if(isOptional) newHtml += `<option value="NONE">None</option>`;
        
        let foundCurrent = false;
        if (currentVal === "NONE") foundCurrent = true;

        filteredOptions.forEach(opt => {
            const isSelected = (currentVal === opt.name);
            if (isSelected) foundCurrent = true;
            newHtml += `<option value="${opt.name}" ${isSelected ? 'selected' : ''}>${opt.name}</option>`;
        });
        
        sel.innerHTML = newHtml;
        if (!foundCurrent && currentVal && currentVal !== "NONE") {
            sel.value = "";
        } else {
            sel.value = currentVal;
        }
    });
}

function getSelectedSubjects() {
    const selects = document.querySelectorAll('.subject-select');
    const subs = [];
    selects.forEach(sel => {
        if (sel.value && sel.value !== "NONE") {
            subs.push(sel.value);
        }
    });
    
    if(fetchedStudentData) {
        const classNum = parseInt(fetchedStudentData.className, 10);
        if (classNum === 9) {
            subs.push("Mathematics", "Science", "Social Science", "English");
        }
    }
    
    return subs;
}

// Form submit -> Show Preview Modal
document.getElementById('registrationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!fetchedStudentData) return;

    const aadhaarVal = document.getElementById('aadhaar')?.value?.trim();
    if (!aadhaarVal || !Verhoeff.validate(aadhaarVal)) {
        alert("कृपया 12 अंकों का वैध आधार नंबर दर्ज करें (Invalid Aadhaar - Checksum Failed)।\n\nकृपया आधार कार्ड देखकर सही नंबर भरें।");
        document.getElementById('aadhaar')?.focus();
        return;
    }
    
    if (!photoBase64 || !signatureBase64) {
        alert("कृपया फोटो और हस्ताक्षर अपलोड करें।");
        return;
    }
    
    const subs = getSelectedSubjects();
    const reqCount = document.querySelectorAll('.subject-select[required]').length;
    let actualSelected = document.querySelectorAll('.subject-select');
    let selectedCount = Array.from(actualSelected).filter(s => s.hasAttribute('required') && s.value && s.value !== "NONE").length;
    
    if (selectedCount < reqCount) {
        alert("कृपया सभी अनिवार्य विषय चुनें।");
        return;
    }

    const uniqueSubs = new Set(subs);
    if (uniqueSubs.size !== subs.length) {
        alert("विषय दोहराए नहीं जा सकते।");
        return;
    }

    buildPreviewModal(subs);
});

function buildPreviewModal(subs) {
    updateProgressStep(3);
    const body = document.getElementById('previewModalBody');
    
    const fields = {
        'Student Name': document.getElementById('studentName').value,
        'Father Name': document.getElementById('fatherName').value,
        'Mother Name': document.getElementById('motherName').value,
        'DOB': document.getElementById('dob').value,
        'Mobile': document.getElementById('mobile').value,
        'Aadhaar': document.getElementById('aadhaar').value,
        'Email': document.getElementById('email').value,
        'APAAR ID': document.getElementById('apaarId').value,
        'Bank Name': document.getElementById('bankName').value,
        'Bank A/C': document.getElementById('bankAccount').value,
        'IFSC': document.getElementById('bankIFSC').value,
        'Caste': document.getElementById('caste').value,
        'Religion': document.getElementById('religion')?.value || '-',
        'Marital Status': document.getElementById('maritalStatus').value,
        'Differently Abled': document.getElementById('differentlyAbled').value,
        'Visually Impaired': document.getElementById('visuallyImpaired').value,
        'Mark 1': document.getElementById('mark1').value,
        'Mark 2': document.getElementById('mark2').value,
        'Address': `${document.getElementById('address').value}, ${document.getElementById('townCity').value}, ${document.getElementById('district').value} - ${document.getElementById('pinCode').value}`,
        'Class': fetchedStudentData.className,
        'Stream': fetchedStudentData.stream || 'N/A'
    };

    let html = `<div class="preview-grid">`;
    for(const [key, val] of Object.entries(fields)) {
        html += `<div class="preview-item">
            <div class="preview-label">${key}</div>
            <div class="preview-value">${val || '-'}</div>
        </div>`;
    }
    
    html += `<div class="preview-item" style="grid-column: 1 / -1;">
        <div class="preview-label">Subjects</div>
        <div class="preview-value" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top:5px;">`;
    subs.forEach(s => {
        html += `<span style="background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem;">${s}</span>`;
    });
    html += `</div></div>`;

    html += `</div>`;
    
    html += `<div style="display:flex; gap: 20px; justify-content: center; margin-top: 20px;">
        <div style="text-align:center;">
            <div style="margin-bottom:5px; font-weight:600; color:#64748b;">Photo</div>
            <img src="data:image/jpeg;base64,${photoBase64}" style="max-height: 120px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </div>
        <div style="text-align:center;">
            <div style="margin-bottom:5px; font-weight:600; color:#64748b;">Signature</div>
            <img src="data:image/jpeg;base64,${signatureBase64}" style="max-height: 60px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </div>
    </div>`;

    body.innerHTML = html;
    document.getElementById('previewModal').style.display = 'block';
}

document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('previewModal').style.display = 'none';
    updateProgressStep(2);
});

document.getElementById('confirmSubmitBtn').addEventListener('click', async () => {
    document.getElementById('previewModal').style.display = 'none';
    showLoader("पंजीयन सबमिट किया जा रहा है... (Submitting...)");

    const subs = getSelectedSubjects();

    const payload = {
        studentCode: fetchedStudentData.studentCode || "",
        rollNo: fetchedStudentData.rollNo || "",
        className: fetchedStudentData.className || "",
        academicSession: document.getElementById('academicSession') ? document.getElementById('academicSession').textContent : fetchedStudentData.academicYear,
        stream: fetchedStudentData.stream || (document.getElementById('regStream') ? document.getElementById('regStream').value : ""),
        studentName: document.getElementById('studentName').value,
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        dob: document.getElementById('dob').value,
        aadhaar: document.getElementById('aadhaar').value,
        mobile: document.getElementById('mobile').value,
        bankName: document.getElementById('bankName').value,
        bankAccount: document.getElementById('bankAccount').value,
        bankIFSC: document.getElementById('bankIFSC').value,
        apaarId: document.getElementById('apaarId').value,
        email: document.getElementById('email').value,
        caste: document.getElementById('caste').value,
        religion: document.getElementById('religion') ? document.getElementById('religion').value : "",
        maritalStatus: document.getElementById('maritalStatus').value,
        differentlyAbled: document.getElementById('differentlyAbled').value,
        visuallyImpaired: document.getElementById('visuallyImpaired').value,
        mark1: document.getElementById('mark1').value,
        mark2: document.getElementById('mark2').value,
        address: document.getElementById('address').value,
        townCity: document.getElementById('townCity').value,
        district: document.getElementById('district').value,
        pinCode: document.getElementById('pinCode').value,
        subjects: subs,
        photoUrl: photoBase64,
        signatureUrl: signatureBase64
    };

    try {
        const response = await fetch(`${ADMIN_API_URL}?action=public.registration.submit`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.success) {
            const regId = data.regId || (payload.studentName.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase() + payload.rollNo);
            document.getElementById('successRegId').textContent = regId;
            document.getElementById('successModal').style.display = 'block';
            updateProgressStep(3);

            // Cache data in sessionStorage for instant receipt rendering
            const receiptData = {
                ...payload,
                regId: regId,
                photoPreview: photoPreview.querySelector('img')?.src || '',
                signaturePreview: signPreview.querySelector('img')?.src || ''
            };
            sessionStorage.setItem('lastRegistrationData', JSON.stringify(receiptData));
        } else {
            alert("त्रुटि: " + (data.error || "Failed to submit."));
        }
    } catch(err) {
        alert("Server error. कृपया पुनः प्रयास करें।");
    } finally {
        hideLoader();
    }
});

function openRegistrationReceipt(regId = '') {
    const url = regId ? `registration-receipt.html?id=${encodeURIComponent(regId)}` : 'registration-receipt.html';
    const win = window.open(url, '_blank');
    if (!win) alert('कृपया पॉप-अप की अनुमति दें ताकि पंजीयन रसीद खुल सके।');
    return win;
}

// Success Modal Buttons
const btnPrintApp = document.getElementById('btnPrintApplication');
if (btnPrintApp) {
    btnPrintApp.addEventListener('click', () => {
        const regId = document.getElementById('successRegId')?.textContent?.trim() || '';
        openRegistrationReceipt(regId);
    });
}

const btnDoneReg = document.getElementById('btnDoneRegistration');
if (btnDoneReg) {
    btnDoneReg.addEventListener('click', () => {
        window.location.reload();
    });
}

// Toggle Existing Receipt Download Box
const btnToggleDownloadReceipt = document.getElementById('btnToggleDownloadReceipt');
const existingReceiptBox = document.getElementById('existingReceiptBox');
if (btnToggleDownloadReceipt && existingReceiptBox) {
    btnToggleDownloadReceipt.addEventListener('click', () => {
        const isHidden = existingReceiptBox.style.display === 'none' || !existingReceiptBox.style.display;
        existingReceiptBox.style.display = isHidden ? 'block' : 'none';
        btnToggleDownloadReceipt.textContent = isHidden ? '❌ रसीद खोज बंद करें' : '📄 पूर्व में भरा पंजीयन फॉर्म डाउनलोड करें';
    });
}

// Search & Download Existing Registration Receipt
const btnDownloadExistingReceipt = document.getElementById('btnDownloadExistingReceipt');
if (btnDownloadExistingReceipt) {
    btnDownloadExistingReceipt.addEventListener('click', async () => {
        const downloadRegId = document.getElementById('downloadRegId')?.value?.trim().toUpperCase();
        const downloadAadhaar = document.getElementById('downloadAadhaar')?.value?.trim();

        if (!downloadRegId && !downloadAadhaar) {
            alert('कृपया रजिस्ट्रेशन आईडी (जैसे RAJE54) या 12 अंकों का आधार नंबर दर्ज करें।');
            return;
        }

        if (downloadAadhaar && !Verhoeff.validate(downloadAadhaar)) {
            alert('कृपया 12 अंकों का वैध आधार नंबर दर्ज करें (Invalid Aadhaar - Checksum Failed)।');
            return;
        }

        showLoader("पंजीयन रसीद खोजी जा रही है...");

        try {
            let query = '';
            if (downloadRegId) query = `regId=${encodeURIComponent(downloadRegId)}`;
            else if (downloadAadhaar) query = `aadhaar=${encodeURIComponent(downloadAadhaar)}`;

            const response = await fetch(`${ADMIN_API_URL}?action=public.registration.get&${query}`);
            const data = await response.json();
            hideLoader();

            if (data.success && data.record) {
                sessionStorage.setItem('lastRegistrationData', JSON.stringify(data.record));
                openRegistrationReceipt(data.record.regId || downloadRegId);
            } else {
                alert(data.message || 'पंजीयन रिकॉर्ड नहीं मिला। कृपया रजिस्ट्रेशन आईडी या आधार नंबर की जाँच करें।');
            }
        } catch(err) {
            hideLoader();
            console.error(err);
            alert('Server Error. कृपया पुनः प्रयास करें।');
        }
    });
}
