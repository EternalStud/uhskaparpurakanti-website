// Use the actual deployed ADMIN_API_URL
const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec';
let photoBase64 = '';
let signatureBase64 = '';
let fetchedStudentData = null;
let currentSubjectsConfig = [];

function showLoader(message = 'कृपया प्रतीक्षा करें...') {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.querySelector('p').textContent = message;
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Photo & Signature Logic (copied from admission.js for strict checks)
const photoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');
if (photoInput) {
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('कृपया केवल वैध इमेज फाइल (JPG या PNG) अपलोड करें।');
            this.value = ''; return;
        }
        const sizeKB = file.size / 1024;
        if (sizeKB < 50 || sizeKB > 100) {
            alert('फोटो का आकार 50KB से 100KB के बीच होना चाहिए।');
            this.value = ''; return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                photoBase64 = e.target.result.split(',')[1];
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo" style="max-width: 100%; max-height: 150px;">`;
            };
            img.onerror = function() {
                alert('यह फाइल करप्ट है या फोटो नहीं है।');
                photoInput.value = '';
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
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('कृपया केवल वैध इमेज फाइल (JPG या PNG) अपलोड करें।');
            this.value = ''; return;
        }
        const sizeKB = file.size / 1024;
        if (sizeKB < 5 || sizeKB > 20) {
            alert('हस्ताक्षर का आकार 5KB से 20KB के बीच होना चाहिए।');
            this.value = ''; return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                signatureBase64 = e.target.result.split(',')[1];
                signPreview.innerHTML = `<img src="${e.target.result}" alt="Signature" style="max-width: 100%; max-height: 80px;">`;
            };
            img.onerror = function() {
                alert('यह फाइल करप्ट है या हस्ताक्षर नहीं है।');
                signInput.value = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Validation inputs
['mobile', 'pinCode', 'aadhaar', 'apaarId', 'bankAccount'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    }
});
['bankIFSC'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 11);
        });
    }
});

// Class change listener
document.getElementById('regClass').addEventListener('change', function() {
    const streamBlock = document.getElementById('searchStreamBlock');
    if (this.value === '11') {
        streamBlock.style.display = 'block';
    } else {
        streamBlock.style.display = 'none';
        document.getElementById('searchStream').value = '';
    }
});

// Fetch Student
document.getElementById('btnFetchStudent').addEventListener('click', async () => {
    const classNum = document.getElementById('regClass').value;
    const streamVal = document.getElementById('searchStream') ? document.getElementById('searchStream').value : "";
    const studentCode = document.getElementById('regStudentCode').value.trim();
    const fetchMsg = document.getElementById('fetchMessage');

    if (!classNum || !studentCode) {
        alert("कृपया कक्षा और छात्र कोड दर्ज करें। (Please enter Class and Student Code)");
        return;
    }
    
    if (classNum === '11' && !streamVal) {
        alert("कृपया संकाय (Stream) चुनें। (Please select Stream)");
        return;
    }

    showLoader("छात्र विवरण खोजा जा रहा है... (Fetching student details...)");
    fetchMsg.textContent = "";

    try {
        const url = `${ADMIN_API_URL}?action=public.registration.getStudent&className=${classNum}&studentCode=${studentCode}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.student) {
            fetchedStudentData = data.student;
            // Overwrite stream with chosen one for class 11
            if (classNum === '11') {
                fetchedStudentData.stream = streamVal;
            }
            populateForm(data.student);
            document.getElementById('registrationDetails').style.display = 'block';
            fetchMsg.textContent = "विद्यार्थी मिल गया! कृपया शेष विवरण भरें। (Student found! Please fill remaining details.)";
            fetchMsg.style.color = "#16a34a";
        } else {
            document.getElementById('registrationDetails').style.display = 'none';
            fetchMsg.textContent = "आप फॉर्म भरने के योग्य नहीं हैं। (You are not eligible to fill the form.)";
            fetchMsg.style.color = "#dc2626";
        }
    } catch (err) {
        document.getElementById('registrationDetails').style.display = 'none';
        fetchMsg.textContent = "सर्वर त्रुटि। (Server error.)";
        fetchMsg.style.color = "#dc2626";
    } finally {
        hideLoader();
    }
});

function populateForm(student) {
    document.getElementById('studentName').value = student.studentName || '';
    document.getElementById('fatherName').value = student.fatherName || '';
    document.getElementById('motherName').value = student.motherName || '';
    
    // Fix DOB format if it exists
    let dobVal = student.dob || '';
    if (dobVal && dobVal.includes("T")) {
        dobVal = dobVal.split("T")[0];
    } else if (dobVal && dobVal.includes("/")) {
        const parts = dobVal.split("/");
        if (parts.length === 3) {
            // Assuming dd/mm/yyyy from sheets
            dobVal = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
    }
    document.getElementById('dob').value = dobVal;

    document.getElementById('aadhaar').value = student.aadhaar || '';
    document.getElementById('mobile').value = student.mobile || '';
    document.getElementById('bankAccount').value = student.bankAccount || '';
    document.getElementById('bankIFSC').value = student.bankIFSC || '';

    // Handle Subjects
    const existingMsg = document.getElementById('existingSubjectsMsg');
    const subjGrid = document.getElementById('subjectGrid');
    
    const classNum = parseInt(student.className, 10);
    
    if (student.subjects && student.subjects.length > 0) {
        // They already have tags
        document.getElementById('hasExistingSubjects').value = "true";
        existingMsg.style.display = 'block';
        
        let tagsHtml = `<div style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 10px;">`;
        student.subjects.forEach(sub => {
            tagsHtml += `<span style="background: #e0f2fe; color: #0284c7; padding: 6px 12px; border-radius: 4px; font-weight: bold; border: 1px solid #7dd3fc;">${sub}</span>`;
        });
        tagsHtml += `</div>`;
        subjGrid.innerHTML = tagsHtml;
    } else {
        // Needs tagging
        document.getElementById('hasExistingSubjects').value = "false";
        existingMsg.style.display = 'none';
        subjGrid.innerHTML = '';
        
        if (classNum === 11) {
            loadSubjectDropdowns(11, fetchedStudentData.stream);
        } else {
            loadSubjectDropdowns(9, "");
        }
    }
}

async function loadSubjectDropdowns(classNum, stream) {
    if (classNum === 11 && !stream) {
        document.getElementById('subjectGrid').innerHTML = '';
        return;
    }
    
    showLoader("विषय सूची लोड की जा रही है... (Loading subjects...)");
    try {
        const url = `${ADMIN_API_URL}?action=public.subject.tag.getDropdowns&classNum=${classNum}&stream=${stream}&academicYear=${fetchedStudentData.academicYear}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.subjects) {
            currentSubjectsConfig = data.subjects;
            renderSubjectDropdowns(classNum);
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
            <p style="font-weight: bold; margin-bottom: 5px;">अनिवार्य विषय (Compulsory Subjects):</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: #f1f5f9; padding: 6px 12px; border-radius: 4px; border: 1px solid #cbd5e1;">Mathematics</span>
                <span style="background: #f1f5f9; padding: 6px 12px; border-radius: 4px; border: 1px solid #cbd5e1;">Science</span>
                <span style="background: #f1f5f9; padding: 6px 12px; border-radius: 4px; border: 1px solid #cbd5e1;">Social Science</span>
                <span style="background: #f1f5f9; padding: 6px 12px; border-radius: 4px; border: 1px solid #cbd5e1;">English</span>
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
}

function buildSelect(label, id, options, required, isOptional = false) {
    let html = `<div><label>${label} ${required ? '<span style="color:red">*</span>' : ''}</label>`;
    html += `<select id="${id}" class="subject-select" ${required ? 'required' : ''}>`;
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

function getSelectedSubjects() {
    if (document.getElementById('hasExistingSubjects').value === "true") {
        return fetchedStudentData.subjects;
    }
    const selects = document.querySelectorAll('.subject-select');
    const subs = [];
    selects.forEach(sel => {
        if (sel.value && sel.value !== "NONE") {
            subs.push(sel.value);
        }
    });
    
    // Auto append compulsory subjects for Class 9
    const classNum = parseInt(fetchedStudentData.className, 10);
    if (classNum === 9) {
        subs.push("Mathematics");
        subs.push("Science");
        subs.push("Social Science");
        subs.push("English");
    }
    
    return subs;
}

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fetchedStudentData) return;
    
    // Check photo and signature
    if (!photoBase64 || !signatureBase64) {
        alert("कृपया फोटो और हस्ताक्षर अपलोड करें। (Please upload photo and signature.)");
        return;
    }
    
    const subs = getSelectedSubjects();
    if (document.getElementById('hasExistingSubjects').value === "false") {
        const reqCount = document.querySelectorAll('.subject-select[required]').length;
        if (subs.length < reqCount) {
            alert("कृपया सभी अनिवार्य विषय चुनें। (Please select all mandatory subjects.)");
            return;
        }
        // Basic duplicate check
        const uniqueSubs = new Set(subs);
        if (uniqueSubs.size !== subs.length) {
            alert("विषय दोहराए नहीं जा सकते। (Subjects cannot be duplicated.)");
            return;
        }
    }

    const payload = {
        studentCode: fetchedStudentData.studentCode,
        rollNo: fetchedStudentData.rollNo,
        className: fetchedStudentData.className,
        academicSession: document.getElementById('academicSession') ? document.getElementById('academicSession').textContent : fetchedStudentData.academicYear,
        stream: fetchedStudentData.stream || (document.getElementById('regStream') ? document.getElementById('regStream').value : ""),
        studentName: document.getElementById('studentName').value,
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        dob: document.getElementById('dob').value,
        aadhaar: document.getElementById('aadhaar').value,
        mobile: document.getElementById('mobile').value,
        bankAccount: document.getElementById('bankAccount').value,
        bankIFSC: document.getElementById('bankIFSC').value,
        apaarId: document.getElementById('apaarId').value,
        email: document.getElementById('email').value,
        caste: document.getElementById('caste').value,
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

    showLoader("पंजीयन सबमिट किया जा रहा है... (Submitting Registration...)");
    
    try {
        const response = await fetch(`${ADMIN_API_URL}?action=public.registration.submit`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.success) {
            alert("पंजीयन सफलतापूर्वक जमा हो गया! (Registration submitted successfully!)");
            window.location.reload();
        } else {
            alert("त्रुटि: " + (data.error || "Failed to submit."));
        }
    } catch(err) {
        alert("Server error.");
    } finally {
        hideLoader();
    }
});

// Simple preview just showing alert or printing logic
document.getElementById('previewBtn').addEventListener('click', () => {
    alert("आवेदन पूर्वावलोकन कार्यक्षमता जल्द ही उपलब्ध होगी। (Preview functionality will be available soon.)\nकृपया जमा करें पर क्लिक करें।");
});
