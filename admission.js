// MAKE SURE THIS MATCHES YOUR LIVE DEPLOYMENT URL!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyWfDYM6KB0YErFOKgJ8p8nkgjx5FuChsx4EFD-yaxi4UuFRUb-Xe2AvTFY4rYDEknpRA/exec';
let photoBase64 = '';
let signatureBase64 = '';

function showProgressModal(message = 'Processing Application...') {
    let modal = document.getElementById('progressModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'progressModal';
        modal.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99999;">
                <div style="background:#fff;padding:24px;border-radius:12px;width:360px;max-width:90%;box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:center;">
                    <h3 style="margin:0 0 12px;color:#1e3a8a;">Online Admission Portal</h3>
                    <div style="height:10px;background:#e5e7eb;border-radius:10px;overflow:hidden;">
                        <div id="progressBarInner" style="height:100%;width:15%;background:#2563eb;transition:width .4s ease;"></div>
                    </div>
                    <p id="progressText" style="margin-top:14px;font-size:14px;">${message}</p>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
}

function updateProgress(percent, message) {
    const bar = document.getElementById('progressBarInner');
    const text = document.getElementById('progressText');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = message;
}

function hideProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) modal.remove();
}

function showSuccessModal(applicationId, studentName = '', admissionClass = '') {
    let modal = document.getElementById('successModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'successModal';
    modal.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:100000;padding:15px;backdrop-filter:blur(4px);">
            <div style="background:#fff;padding:32px 25px;border-radius:18px;width:480px;max-width:95%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.3);border-top:5px solid #10b981;">
                <div style="font-size:52px;line-height:1;margin-bottom:10px;">🎉</div>
                <h2 style="margin:0 0 6px 0;color:#059669;font-size:1.5rem;">ऑनलाइन नामांकन फॉर्म जमा हुआ!</h2>
                <p style="color:#64748b;font-size:0.9rem;margin:0 0 20px 0;">Application Submitted Successfully</p>

                <div style="background:#f0fdf4;border:2px dashed #34d399;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <div style="font-size:0.8rem;color:#047857;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Application ID</div>
                    <div style="font-size:1.8rem;font-weight:800;color:#065f46;margin-top:4px;letter-spacing:1px;">${applicationId}</div>
                    <div style="font-size:0.95rem;color:#1e293b;font-weight:600;margin-top:8px;">${studentName} (Class ${admissionClass})</div>
                </div>

                <div style="padding:14px;background:#fef3c7;border:1px solid #fde047;border-radius:10px;font-size:0.9rem;line-height:1.6;color:#92400e;text-align:left;margin-bottom:22px;">
                    <strong>📢 महत्वपूर्ण निर्देश:</strong><br>
                    1. कृपया अपनी <strong>Application ID (${applicationId})</strong> नोट करके रखें।<br>
                    2. नीचे दिए गए बटन पर क्लिक करके अपना <strong>नामांकन रसीद (PDF)</strong> डाउनलोड / प्रिंट करें।<br>
                    3. प्रिंट की गई रसीद पर हस्ताक्षर करके अपने विद्यालय में <strong>नामांकन प्रभारी (शिक्षक)</strong> को जमा करें।
                </div>

                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <button id="printReceiptBtn" style="background:#059669;color:#fff;border:none;padding:12px 22px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.95rem;box-shadow:0 4px 12px rgba(5,150,105,0.3);">
                        🖨️ नामांकन रसीद डाउनलोड / प्रिंट करें
                    </button>
                    <button id="closeSuccessModalBtn" style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:12px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.9rem;">
                        समाप्त करें (Done)
                    </button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            openAdmissionReceipt(applicationId);
        });
    }

    const closeBtn = document.getElementById('closeSuccessModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.remove(); });
    }
}

// Photo Preview & Strict Image Validation
const photoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');
if (photoInput) {
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        // 1. Strict MIME Type Check
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

        // 2. Render Check (Blocks fake/renamed files)
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() { // It's a real, renderable image!
                photoBase64 = e.target.result.split(',')[1];
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo">`;
            };
            img.onerror = function() { // It failed to render (corrupt or fake file)
                alert('यह फाइल करप्ट है या फोटो नहीं है। कृपया सही इमेज अपलोड करें।');
                photoInput.value = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Signature Preview & Strict Image Validation
const signInput = document.getElementById('studentSignature');
const signPreview = document.getElementById('signaturePreview');
if (signInput) {
    signInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        // 1. Strict MIME Type Check
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

        // 2. Render Check (Blocks fake/renamed files)
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() { // It's a real, renderable image!
                signatureBase64 = e.target.result.split(',')[1];
                signPreview.innerHTML = `<img src="${e.target.result}" alt="Signature">`;
            };
            img.onerror = function() { // It failed to render (corrupt or fake file)
                alert('यह फाइल करप्ट है या हस्ताक्षर नहीं है। कृपया सही इमेज अपलोड करें।');
                signInput.value = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Form Validation
const form = document.getElementById('admissionForm');
if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const clsSelected = parseInt(document.getElementById('admissionClass')?.value || '0', 10);
        const pen = document.getElementById('penNumber').value.trim();
        const aadhaar = document.getElementById('studentAadhaar').value.trim();
        const mobile = document.getElementById('mobile').value.trim();
        const parentAadhaar = document.getElementById('parentAadhaar')?.value.trim() || '';
        const parentAadhaarType = document.getElementById('parentAadhaarType')?.value || '';
        const stream = document.getElementById('stream')?.value || '';

        const apaarId = document.getElementById('apaarId')?.value.trim();
        if (apaarId && !/^\d{12}$/.test(apaarId)) {
            alert('यदि APAAR ID दर्ज की गई है तो वह 12 अंकों की होनी चाहिए।'); return;
        }

        const eshikshakoshId = document.getElementById('eshikshakoshId')?.value.trim();
        if (eshikshakoshId && !/^\d{15}$/.test(eshikshakoshId)) {
            alert('यदि ई-शिक्षाकोष ID दर्ज की गई है तो वह 15 अंकों की होनी चाहिए।'); return;
        }

        if (clsSelected !== 1 && !/^\d{11}$/.test(pen)) {
            alert('कृपया 11 अंकों का सही PEN नंबर दर्ज करें।'); return;
        }
        if (clsSelected === 1 && pen && !/^\d{11}$/.test(pen)) {
            alert('यदि PEN संख्या दर्ज की गई है तो वह 11 अंकों की होनी चाहिए।'); return;
        }

        if (clsSelected !== 1 && !/^\d{12}$/.test(aadhaar)) {
            alert('कृपया 12 अंकों का सही आधार नंबर दर्ज करें।'); return;
        }
        if (clsSelected === 1 && aadhaar && !/^\d{12}$/.test(aadhaar)) {
            alert('यदि आधार संख्या दर्ज की गई है तो वह 12 अंकों की होनी चाहिए।'); return;
        }

        if (!/^\d{12}$/.test(parentAadhaar)) {
            alert('कृपया अभिभावक का 12 अंकों का सही आधार नंबर दर्ज करें।'); return;
        }

        if (!parentAadhaarType) {
            alert('कृपया चुनें कि आधार संख्या पिता या माता में से किसकी है।'); return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            alert('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।'); return;
        }

        const address = document.getElementById('address')?.value.trim();
        const pinCode = document.getElementById('pinCode')?.value.trim();
        if (!address || !pinCode) { alert('स्थायी पता एवं पिन कोड भरना अनिवार्य है।'); return; }
        if (!/^\d{6}$/.test(pinCode)) { alert('कृपया 6 अंकों का सही PIN Code दर्ज करें।'); return; }

        const distance = document.getElementById('distance')?.value;
        const cwsn = document.getElementById('cwsn')?.value;
        const income = document.getElementById('income')?.value;
        const bloodGroup = document.getElementById('bloodGroup')?.value;
        const heightVal = document.getElementById('height')?.value;
        const weightVal = document.getElementById('weight')?.value;

        if (!distance || !cwsn || !income || !bloodGroup || !heightVal || !weightVal) {
            alert('सामाजिक एवं स्वास्थ्य विवरण के सभी फ़ील्ड भरना अनिवार्य है।'); return;
        }

        const height = parseInt(heightVal, 10);
        const weight = parseInt(weightVal, 10);
        if (isNaN(height) || height < 50 || height > 220) { alert('लंबाई 50 से 220 CM के बीच होनी चाहिए।'); return; }
        if (isNaN(weight) || weight < 5 || weight > 150) { alert('वजन 5 से 150 KG के बीच होना चाहिए।'); return; }

        const previousUdise = document.getElementById('previousUdise')?.value.trim();
        if (clsSelected !== 1 && !/^\d{11}$/.test(previousUdise)) {
            alert('पूर्व विद्यालय का UDISE कोड 11 अंकों का होना अनिवार्य है।'); return;
        }
        if (clsSelected === 1 && previousUdise && !/^\d{11}$/.test(previousUdise)) {
            alert('यदि UDISE कोड दर्ज किया गया है तो वह 11 अंकों का होना चाहिए।'); return;
        }

        const accountNumber = document.getElementById('accountNumber')?.value.trim();
        const ifsc = document.getElementById('ifsc')?.value.trim();
        const bankName = document.getElementById('bankName')?.value.trim();
        const accountHolder = document.getElementById('accountHolder')?.value.trim();

        if ((clsSelected === 11 || clsSelected === 12) && !stream) {
            alert('कृपया कक्षा XI/XII के लिए संकाय (Arts/Science) चुनें।'); return;
        }

        const relation = document.getElementById('accountHolderRelation')?.value || '';
        if (!accountNumber || !ifsc || !bankName || !accountHolder) {
            alert('बैंक खाता विवरण के सभी फ़ील्ड भरना अनिवार्य है।'); return;
        }

        if (!/^\d{9,18}$/.test(accountNumber)) {
            alert('कृपया 9 से 18 अंकों का सही बैंक खाता संख्या दर्ज करें।'); return;
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
            alert('कृपया सही IFSC कोड दर्ज करें। (उदाहरण: SBIN0001234)'); return;
        }

        if (clsSelected < 9 && !relation) {
            alert('खाताधारक का विद्यार्थी से संबंध चुनना अनिवार्य है।'); return;
        }

        if (!document.getElementById('declaration').checked) {
            alert('कृपया घोषणा पत्र स्वीकार करें।'); return;
        }

        if (clsSelected >= 9) {
            if (!photoBase64) { alert('कृपया छात्र का फोटो अपलोड करें।'); return; }
            if (!signatureBase64) { alert('कृपया छात्र का हस्ताक्षर अपलोड करें।'); return; }
        }

        const payload = {
            _token: 'UHS_KAPARPURA_2026',
            admissionClass: clsSelected,
            stream: stream,
            penNumber: pen,
            apaarId: apaarId,
            studentAadhaar: aadhaar,
            eshikshakoshId: eshikshakoshId,
            studentNameEnglish: document.getElementById('studentNameEnglish')?.value || '',
            dob: document.getElementById('dob')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            fatherName: document.getElementById('fatherName')?.value || '',
            motherName: document.getElementById('motherName')?.value || '',
            parentAadhaarType: parentAadhaarType,
            parentAadhaar: parentAadhaar,
            mobile: mobile,
            category: document.getElementById('category')?.value || '',
            religion: document.getElementById('religion')?.value || '',
            address: address,
            pinCode: pinCode,
            distance: distance,
            cwsn: cwsn,
            income: income,
            bloodGroup: bloodGroup,
            height: height,
            weight: weight,
            previousUdise: previousUdise || (clsSelected === 1 ? 'Not Applicable' : ''),
            accountNumber: accountNumber,
            ifsc: ifsc,
            bankName: bankName,
            accountHolder: accountHolder,
            accountHolderRelation: relation,
            photo: clsSelected >= 9 ? photoBase64 : '',
            signature: clsSelected >= 9 ? signatureBase64 : ''
        };

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = true;
        showProgressModal('Validating form...');
        updateProgress(20, 'Validating form...');
        updateProgress(clsSelected >= 9 ? 60 : 40, clsSelected >= 9 ? 'Uploading photo, signature and saving application...' : 'Saving application...');

        fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateProgress(100, 'Application submitted successfully. Preparing admission receipt...');
                hideProgressModal();
                showSuccessModal(data.applicationId, payload.studentNameEnglish, payload.admissionClass);

                form.reset();
                photoPreview.innerHTML = 'फोटो यहाँ दिखाई देगा';
                signPreview.innerHTML = 'हस्ताक्षर यहाँ दिखाई देगा';
                photoBase64 = ''; signatureBase64 = '';
                if (photoInput) photoInput.value = '';
                if (signInput) signInput.value = '';
                updateAccountHolderRules();
            } else {
                hideProgressModal();
                if (data.duplicate) {
                    let msg = data.message || 'Admission already exists.';
                    if (data.applicationId) msg += `\n\nExisting Application ID: ${data.applicationId}`;
                    msg += '\n\nPlease use Download Existing Application.';
                    alert(msg);
                } else {
                    alert(data.message || 'डेटा जमा नहीं हुआ।');
                }
            }
        })
        .catch(err => {
            console.error(err);
            hideProgressModal();
            alert('Server Error. कृपया पुनः प्रयास करें।');
        })
        .finally(() => { if (submitBtn) submitBtn.disabled = false; });
    });
}

function openAdmissionReceipt(applicationId = '') {
    const url = applicationId ? `admission-receipt.html?id=${encodeURIComponent(applicationId)}` : 'admission-receipt.html';
    const win = window.open(url, '_blank');
    if (!win) alert('Please allow pop-ups to open the admission receipt.');
    return win;
}

const previewBtn = document.getElementById('previewBtn');
if (previewBtn) {
    previewBtn.addEventListener('click', function () {
        const pen = document.getElementById('penNumber')?.value || '';
        const clsSelected = parseInt(document.getElementById('admissionClass')?.value || '0', 10);

        if (clsSelected !== 1 && !pen) {
            alert('कृपया PEN Number दर्ज करें।'); return;
        }

        const previewData = {
            admissionClass: document.getElementById('admissionClass')?.value || '',
            stream: document.getElementById('stream')?.value || '',
            penNumber: pen || 'Yet to be Generated',
            apaarId: document.getElementById('apaarId')?.value || '',
            studentAadhaar: document.getElementById('studentAadhaar')?.value || (clsSelected === 1 ? 'Not Available' : ''),
            studentNameEnglish: document.getElementById('studentNameEnglish')?.value || '',
            dob: document.getElementById('dob')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            fatherName: document.getElementById('fatherName')?.value || '',
            motherName: document.getElementById('motherName')?.value || '',
            parentAadhaarType: document.getElementById('parentAadhaarType')?.value || '',
            parentAadhaar: document.getElementById('parentAadhaar')?.value || '',
            mobile: document.getElementById('mobile')?.value || '',
            category: document.getElementById('category')?.value || '',
            religion: document.getElementById('religion')?.value || '',
            address: document.getElementById('address')?.value || '',
            pinCode: document.getElementById('pinCode')?.value || '',
            distance: document.getElementById('distance')?.value || '',
            cwsn: document.getElementById('cwsn')?.value || '',
            income: document.getElementById('income')?.value || '',
            bloodGroup: document.getElementById('bloodGroup')?.value || '',
            height: document.getElementById('height')?.value || '',
            weight: document.getElementById('weight')?.value || '',
            previousUdise: document.getElementById('previousUdise')?.value || (clsSelected === 1 ? 'Not Applicable' : ''),
            accountNumber: document.getElementById('accountNumber')?.value || '',
            ifsc: document.getElementById('ifsc')?.value || '',
            bankName: document.getElementById('bankName')?.value || '',
            accountHolder: document.getElementById('accountHolder')?.value || '',
            accountHolderRelation: document.getElementById('accountHolderRelation')?.value || '',
            photoPreview: clsSelected >= 9 ? (photoPreview.querySelector('img')?.src || '') : '',
            signaturePreview: clsSelected >= 9 ? (signPreview.querySelector('img')?.src || '') : '',
            applicationId: 'PREVIEW'
        };

        sessionStorage.setItem('previewAdmissionData', JSON.stringify(previewData));
        openAdmissionReceipt('PREVIEW');
    });
}

const admissionClassField = document.getElementById('admissionClass');
const accountHolderField = document.getElementById('accountHolder');
const relationFieldBlock = document.getElementById('relationBlock');
const studentNameField = document.getElementById('studentNameEnglish');
const streamBlock = document.getElementById('streamBlock');
const streamField = document.getElementById('stream');
const uploadSection = document.getElementById('uploadSection');
const photoField = document.getElementById('studentPhoto');
const signatureField = document.getElementById('studentSignature');

function updateAccountHolderRules() {
    const cls = parseInt(admissionClassField?.value || '0', 10);
    if (cls >= 9) {
        if (uploadSection) uploadSection.style.display = 'block';
        if (photoField) photoField.required = true;
        if (signatureField) signatureField.required = true;
    } else {
        if (uploadSection) uploadSection.style.display = 'none';
        if (photoField) photoField.required = false;
        if (signatureField) signatureField.required = false;
    }
    if (cls === 11 || cls === 12) {
        if (streamBlock) streamBlock.style.display = 'block';
        if (streamField) streamField.required = true;
    } else {
        if (streamBlock) streamBlock.style.display = 'none';
        if (streamField) { streamField.required = false; streamField.value = ''; }
    }
    if (cls >= 9) {
        if (studentNameField && accountHolderField) accountHolderField.value = studentNameField.value || '';
        if (accountHolderField) accountHolderField.readOnly = true;
        if (relationFieldBlock) relationFieldBlock.style.display = 'none';
    } else if (cls >= 1) {
        if (accountHolderField) accountHolderField.readOnly = false;
        if (relationFieldBlock) relationFieldBlock.style.display = 'block';
    }
}

if (admissionClassField) admissionClassField.addEventListener('change', updateAccountHolderRules);
if (studentNameField) {
    studentNameField.addEventListener('input', () => {
        const cls = parseInt(admissionClassField?.value || '0', 10);
        if (cls >= 9 && accountHolderField) accountHolderField.value = studentNameField.value || '';
    });
}
updateAccountHolderRules();

// Forces inputs to be NUMBERS only
['penNumber', 'studentAadhaar', 'parentAadhaar', 'mobile', 'pinCode', 'apaarId', 'eshikshakoshId', 'previousUdise', 'accountNumber'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    }
});

// Forces Height and Weight to be NUMBERS only and restricts to maximum 3 digits
['height', 'weight'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            // Remove any non-numeric characters
            let val = this.value.replace(/\D/g, '');
            
            // Strictly prevent typing more than 3 digits
            if (val.length > 3) {
                val = val.substring(0, 3);
            }
            
            this.value = val;
        });
    }
});

// Forces inputs to be ALPHABET ONLY and UPPERCASE (Fixed to include Bank Name and Account Holder)
['studentNameEnglish', 'fatherName', 'motherName', 'bankName', 'accountHolder'].forEach(id => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.replace(/[^A-Za-z\s]/g, '').toUpperCase();
        });
    }
});

// IFSC Code: uppercase alphanumeric only, max 11 chars
const ifscField = document.getElementById('ifsc');

if (ifscField) {
    ifscField.addEventListener('input', function () {
        this.value = this.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 11);
    });
}

const downloadExistingBtn = document.getElementById('downloadExistingBtn');
if (downloadExistingBtn) {
    downloadExistingBtn.addEventListener('click', async () => {
        const searchClass = parseInt(document.getElementById('searchClass')?.value || '0', 10);
        const searchType = document.getElementById('searchType')?.value;
        const enteredPen = document.getElementById('searchPen')?.value?.trim() || '';
        const applicationId = document.getElementById('searchApplicationId')?.value?.trim() || '';

        if (!searchClass) {
            alert('कृपया कक्षा चुनें।'); return;
        }

        let requestUrl = '';
        if (searchClass === 1 || searchType === 'appId') {
            if (!applicationId) { alert('कृपया Application ID दर्ज करें।'); return; }
            requestUrl = `${WEB_APP_URL}?applicationId=${encodeURIComponent(applicationId)}`;
        } else {
            if (!enteredPen) { alert('कृपया PEN Number दर्ज करें।'); return; }
            requestUrl = `${WEB_APP_URL}?pen=${encodeURIComponent(enteredPen)}`;
        }

        showProgressModal('Searching for application record...');

        try {
            const response = await fetch(requestUrl);
            const data = await response.json();
            hideProgressModal();

            if (!data.success) {
                alert(data.message || 'रिकॉर्ड नहीं मिला।'); return;
            }

            openAdmissionReceipt(data.record.applicationId || '');

        } catch (error) {
            console.error(error);
            hideProgressModal();
            alert('Server Error. कृपया पुनः प्रयास करें।');
        }
    });
}