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
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:100000;">
            <div style="background:#fff;padding:28px;border-radius:14px;width:420px;max-width:92%;text-align:center;box-shadow:0 12px 35px rgba(0,0,0,.25);">
                <div style="font-size:52px;">✅</div>
                <h2 style="margin:8px 0;color:#15803d;">Application Submitted Successfully</h2>
                <div style="margin-top:12px;font-size:14px;color:#555;">Student Name</div>
                <div style="font-size:18px;font-weight:600;color:#111827;margin:4px 0;">${studentName}</div>

                <div style="margin-top:8px;font-size:14px;color:#555;">Class</div>
                <div style="font-size:18px;font-weight:600;color:#111827;margin:4px 0;">${admissionClass}</div>

                <div style="margin-top:10px;font-size:14px;color:#555;">Application ID</div>
                <div style="font-size:22px;font-weight:700;color:#1e3a8a;margin:8px 0;">${applicationId}</div>

                <div style="margin-top:14px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:14px;line-height:1.6;color:#166534;">
                    आवेदन सफलतापूर्वक जमा हो गया है।<br>
                    कृपया अपना <strong>Application ID</strong> सुरक्षित रखें।<br><br>
                    <strong>Class I:</strong> Application ID से आवेदन डाउनलोड करें।<br>
                    <strong>Class II–XII:</strong> PEN Number से आवेदन डाउनलोड करें।<br><br>
                    आवेदन डाउनलोड कर विद्यालय में जमा करें।
                </div>

                <div style="margin-top:15px;">
                    <button id="closeSuccessModalBtn" style="background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:600;">
                        OK
                    </button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    const closeBtn = document.getElementById('closeSuccessModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Photo Preview
const photoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');

if (photoInput) {
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const sizeKB = file.size / 1024;

        if (sizeKB < 50 || sizeKB > 100) {
            alert('फोटो का आकार 50KB से 100KB के बीच होना चाहिए।');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            photoBase64 = e.target.result.split(',')[1];
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo">`;
        };
        reader.readAsDataURL(file);
    });
}

// Signature Preview
const signInput = document.getElementById('studentSignature');
const signPreview = document.getElementById('signaturePreview');

if (signInput) {
    signInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const sizeKB = file.size / 1024;

        if (sizeKB < 5 || sizeKB > 20) {
            alert('हस्ताक्षर का आकार 5KB से 20KB के बीच होना चाहिए।');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            signatureBase64 = e.target.result.split(',')[1];
            signPreview.innerHTML = `<img src="${e.target.result}" alt="Signature">`;
        };
        reader.readAsDataURL(file);
    });
}

// Form Validation
const form = document.getElementById('admissionForm');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const pen = document.getElementById('penNumber').value.trim();
        const aadhaar = document.getElementById('studentAadhaar').value.trim();
        const mobile = document.getElementById('mobile').value.trim();

        const parentAadhaar = document.getElementById('parentAadhaar')?.value.trim() || '';
        const parentAadhaarType = document.getElementById('parentAadhaarType')?.value || '';
        const stream = document.getElementById('stream')?.value || '';

        const clsSelected = parseInt(document.getElementById('admissionClass')?.value || '0', 10);

        if (clsSelected !== 1 && !/^\d{11}$/.test(pen)) {
            alert('कृपया 11 अंकों का सही PEN नंबर दर्ज करें।');
            return;
        }

        if (clsSelected === 1 && pen && !/^\d{11}$/.test(pen)) {
            alert('यदि PEN संख्या दर्ज की गई है तो वह 11 अंकों की होनी चाहिए।');
            return;
        }

        // Student Aadhaar optional for Class I, mandatory for Class II-XII
        if (clsSelected !== 1 && !/^\d{12}$/.test(aadhaar)) {
            alert('कृपया 12 अंकों का सही आधार नंबर दर्ज करें।');
            return;
        }

        if (clsSelected === 1 && aadhaar && !/^\d{12}$/.test(aadhaar)) {
            alert('यदि आधार संख्या दर्ज की गई है तो वह 12 अंकों की होनी चाहिए।');
            return;
        }

        if (!/^\d{12}$/.test(parentAadhaar)) {
            alert('कृपया अभिभावक का 12 अंकों का सही आधार नंबर दर्ज करें।');
            return;
        }

        if (!parentAadhaarType) {
            alert('कृपया चुनें कि आधार संख्या पिता या माता में से किसकी है।');
            return;
        }


        if (!/^\d{10}$/.test(mobile)) {
            alert('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।');
            return;
        }

        // Mandatory Address Details
        const address = document.getElementById('address')?.value.trim();
        const pinCode = document.getElementById('pinCode')?.value.trim();

        if (!address || !pinCode) {
            alert('स्थायी पता एवं पिन कोड भरना अनिवार्य है।');
            return;
        }
        
        if (!/^\d{6}$/.test(pinCode)) {
            alert('कृपया 6 अंकों का सही PIN Code दर्ज करें।');
            return;
        }

        // Mandatory Social & Health Details
        const distance = document.getElementById('distance')?.value;
        const cwsn = document.getElementById('cwsn')?.value;
        const income = document.getElementById('income')?.value;
        const bloodGroup = document.getElementById('bloodGroup')?.value;
        const height = document.getElementById('height')?.value;
        const weight = document.getElementById('weight')?.value;

        if (!distance || !cwsn || !income || !bloodGroup || !height || !weight) {
            alert('सामाजिक एवं स्वास्थ्य विवरण के सभी फ़ील्ड भरना अनिवार्य है।');
            return;
        }

        // Previous School UDISE (Optional for Class I)
        const previousUdise = document.getElementById('previousUdise')?.value.trim();

        if (clsSelected !== 1 && !previousUdise) {
            alert('पूर्व विद्यालय का UDISE कोड भरना अनिवार्य है।');
            return;
        }

        // Mandatory Bank Details
        const accountNumber = document.getElementById('accountNumber')?.value.trim();
        const ifsc = document.getElementById('ifsc')?.value.trim();
        const bankName = document.getElementById('bankName')?.value.trim();
        const accountHolder = document.getElementById('accountHolder')?.value.trim();
        const cls = parseInt(document.getElementById('admissionClass')?.value || '0', 10);

        if ((cls === 11 || cls === 12) && !stream) {
            alert('कृपया कक्षा XI/XII के लिए संकाय (Arts/Science) चुनें।');
            return;
        }

        const relation = document.getElementById('accountHolderRelation')?.value || '';

        if (!accountNumber || !ifsc || !bankName || !accountHolder) {
            alert('बैंक खाता विवरण के सभी फ़ील्ड भरना अनिवार्य है।');
            return;
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
            alert('कृपया सही IFSC कोड दर्ज करें। (उदाहरण: SBIN0001234)');
            return;
        }

        if (cls < 9 && !relation) {
            alert('खाताधारक का विद्यार्थी से संबंध चुनना अनिवार्य है।');
            return;
        }

        if (!document.getElementById('declaration').checked) {
            alert('कृपया घोषणा पत्र स्वीकार करें।');
            return;
        }

        // Photo & Signature required only for Class IX-XII
        if (cls >= 9) {
            if (!photoBase64) {
                alert('कृपया छात्र का फोटो अपलोड करें।');
                return;
            }

            if (!signatureBase64) {
                alert('कृपया छात्र का हस्ताक्षर अपलोड करें।');
                return;
            }
        }

        const payload = {
            _token: 'UHS_KAPARPURA_2026',
            admissionClass: document.getElementById('admissionClass')?.value || '',
            stream: document.getElementById('stream')?.value || '',
            penNumber: pen,
            apaarId: document.getElementById('apaarId')?.value || '',
            studentAadhaar: aadhaar,
            eshikshakoshId: document.getElementById('eshikshakoshId')?.value || '',
            studentNameEnglish: document.getElementById('studentNameEnglish')?.value || '',
            dob: document.getElementById('dob')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            fatherName: document.getElementById('fatherName')?.value || '',
            motherName: document.getElementById('motherName')?.value || '',
            parentAadhaarType: document.getElementById('parentAadhaarType')?.value || '',
            parentAadhaar: document.getElementById('parentAadhaar')?.value || '',
            mobile: mobile,
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
            previousUdise:
                document.getElementById('previousUdise')?.value ||
                (clsSelected === 1 ? 'Not Applicable' : ''),
            accountNumber: document.getElementById('accountNumber')?.value || '',
            ifsc: document.getElementById('ifsc')?.value || '',
            bankName: document.getElementById('bankName')?.value || '',
            accountHolder: document.getElementById('accountHolder')?.value || '',
            accountHolderRelation: document.getElementById('accountHolderRelation')?.value || '',
            photo: cls >= 9 ? photoBase64 : '',
            signature: cls >= 9 ? signatureBase64 : ''
        };

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = true;

        showProgressModal('Validating form...');
        updateProgress(20, 'Validating form...');

        updateProgress(
            cls >= 9 ? 60 : 40,
            cls >= 9
                ? 'Uploading photo, signature and saving application...'
                : 'Saving application...'
        );

        fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateProgress(100, 'Application submitted successfully. Preparing admission receipt...');
                const applicationId = data.applicationId;
                //console.log('Generated Application ID:', applicationId);

                // alert removed and replaced with showSuccessModal

                payload.photo = '[Saved in Google Drive]';
                payload.signature = '[Saved in Google Drive]';
                payload.photoPreview = cls >= 9 ? (photoPreview.querySelector('img')?.src || '') : '';
                payload.signaturePreview = cls >= 9 ? (signPreview.querySelector('img')?.src || '') : '';

                // Save latest application information for PDF generation
                saveAdmissionDataLocally({
                    ...payload,
                    applicationId,
                    submittedAt: new Date().toLocaleString('en-IN')
                });

                // No longer open receipt page automatically; show only the modal
                hideProgressModal();
                showSuccessModal(
                    applicationId,
                    payload.studentNameEnglish || '',
                    payload.admissionClass || ''
                );

                form.reset();
                photoPreview.innerHTML = 'फोटो यहाँ दिखाई देगा';
                signPreview.innerHTML = 'हस्ताक्षर यहाँ दिखाई देगा';
                photoBase64 = '';
                signatureBase64 = '';
                if (photoInput) photoInput.value = '';
                if (signInput) signInput.value = '';

                updateAccountHolderRules();
            } else {
                hideProgressModal();

                if (data.duplicate) {
                    let msg = data.message || 'Admission already exists.';
                    if (data.applicationId) {
                        msg += `\n\nExisting Application ID: ${data.applicationId}`;
                    }
                    msg += '\n\nPlease use Download Existing Application.';
                    alert(msg);
                } else {
                    alert(
                        data.message ||
                        'डेटा जमा नहीं हुआ।'
                    );
                }
            }
        })
        .catch(err => {
            console.error(err);
            hideProgressModal();
            alert('Server Error. कृपया पुनः प्रयास करें।');
        })
        .finally(() => {
            if (submitBtn) submitBtn.disabled = false;
        });
    });
}

function saveAdmissionDataLocally(data) {
    localStorage.setItem(
        'lastAdmissionData',
        JSON.stringify(data)
    );
}

function openAdmissionReceipt(applicationId = '') {
    const url = applicationId
        ? `admission-receipt.html?id=${encodeURIComponent(applicationId)}`
        : 'admission-receipt.html';

    const win = window.open(url, '_blank');

    if (!win) {
        alert('Please allow pop-ups to open the admission receipt.');
    }

    return win;
}

const previewBtn = document.getElementById('previewBtn');

if (previewBtn) {
    previewBtn.addEventListener('click', function () {

        const pen = document.getElementById('penNumber')?.value || '';

        const clsSelected = parseInt(document.getElementById('admissionClass')?.value || '0', 10);

        if (clsSelected !== 1 && !pen) {
            alert('कृपया PEN Number दर्ज करें।');
            return;
        }

        const previewData = {
            admissionClass: document.getElementById('admissionClass')?.value || '',
            stream: document.getElementById('stream')?.value || '',
            penNumber: pen || 'Yet to be Generated',
            apaarId: document.getElementById('apaarId')?.value || '',
            studentAadhaar:
                document.getElementById('studentAadhaar')?.value ||
                (clsSelected === 1 ? 'Not Available' : ''),
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
            previousUdise:
                document.getElementById('previousUdise')?.value ||
                (clsSelected === 1 ? 'Not Applicable' : ''),
            accountNumber: document.getElementById('accountNumber')?.value || '',
            ifsc: document.getElementById('ifsc')?.value || '',
            bankName: document.getElementById('bankName')?.value || '',
            accountHolder: document.getElementById('accountHolder')?.value || '',
            accountHolderRelation: document.getElementById('accountHolderRelation')?.value || '',
            photoPreview: clsSelected >= 9 ? (photoPreview.querySelector('img')?.src || '') : '',
            signaturePreview: clsSelected >= 9 ? (signPreview.querySelector('img')?.src || '') : '',
            applicationId: 'PREVIEW'
        };

        localStorage.setItem('lastAdmissionData', JSON.stringify(previewData));

        openAdmissionReceipt('PREVIEW');
    });
}

// Bank Account Logic
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

    // Show/hide upload section and set required for photo/signature for class IX and above
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
        if (streamField) {
            streamField.required = false;
            streamField.value = '';
        }
    }

    if (cls >= 9) {

        if (studentNameField && accountHolderField) {
            accountHolderField.value = studentNameField.value || '';
        }

        if (accountHolderField) {
            accountHolderField.readOnly = true;
        }

        if (relationFieldBlock) {
            relationFieldBlock.style.display = 'none';
        }

    } else if (cls >= 1) {

        if (accountHolderField) {
            accountHolderField.readOnly = false;
        }

        if (relationFieldBlock) {
            relationFieldBlock.style.display = 'block';
        }
    }
}

if (admissionClassField) {
    admissionClassField.addEventListener('change', updateAccountHolderRules);
}

if (studentNameField) {
    studentNameField.addEventListener('input', () => {
        const cls = parseInt(admissionClassField?.value || '0', 10);

        if (cls >= 9 && accountHolderField) {
            accountHolderField.value = studentNameField.value || '';
        }
    });
}

updateAccountHolderRules();

// Numeric Only Fields
['penNumber', 'studentAadhaar', 'parentAadhaar', 'mobile', 'pinCode'].forEach(id => {
    const field = document.getElementById(id);

    if (field) {
        field.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    }
});

const downloadExistingBtn = document.getElementById('downloadExistingBtn');

if (downloadExistingBtn) {
    downloadExistingBtn.addEventListener('click', async () => {

        const searchClass = parseInt(
            document.getElementById('searchClass')?.value || '0',
            10
        );

        const enteredPen =
            document.getElementById('searchPen')?.value?.trim() || '';

        const applicationId =
            document.getElementById('searchApplicationId')?.value?.trim() || '';

        if (!searchClass) {
            alert('कृपया कक्षा चुनें।');
            return;
        }

        let requestUrl = '';

        if (searchClass === 1) {

            if (!applicationId) {
                alert('कृपया Application ID दर्ज करें।');
                return;
            }

            requestUrl =
                `${WEB_APP_URL}?applicationId=${encodeURIComponent(applicationId)}`;

        } else {

            if (!enteredPen) {
                alert('कृपया PEN Number दर्ज करें।');
                return;
            }

            requestUrl =
                `${WEB_APP_URL}?pen=${encodeURIComponent(enteredPen)}`;
        }

        try {

            const response = await fetch(requestUrl);
            const data = await response.json();

            if (!data.success) {
                alert(data.message || 'रिकॉर्ड नहीं मिला।');
                return;
            }

            localStorage.setItem(
                'lastAdmissionData',
                JSON.stringify(data.record)
            );

            openAdmissionReceipt(data.record.applicationId || '');

        } catch (error) {
            console.error(error);
            alert('Server Error. कृपया पुनः प्रयास करें।');
        }
    });
}