const hospital = localStorage.getItem("userHosp") || "General";

let approvalTimer;
let pollingInterval;
let timeLeft = 300;
let documentId = null;

// ========================
// Preview Logic
// ========================

function openPreview() {
    const editorContent = document.getElementById('clinical-editor').value;
    if (!editorContent.trim()) {
        alert("The workspace is empty.");
        return;
    }

    document.getElementById('hospital-name-display').innerText =
        hospital + " HOSPITAL";

    document.getElementById('pdf-text-content').innerText = editorContent;
    document.getElementById('preview-modal').style.display = 'flex';
}

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
}

// ========================
// Approval Flow
// ========================

async function startApproval() {
    const element = document.getElementById("pdf-export-area");

    closePreview();
    document.getElementById('approval-modal').style.display = 'flex';

    try {
        // Generate PDF as blob (do NOT download here)
        const pdfBlob = await html2pdf()
            .from(element)
            .outputPdf("blob");

        // Build a unique filename: HOSPITAL_YYYYMMDD_HHMMSS_<random4>.pdf
        const now = new Date();
        const datePart = now.getFullYear().toString()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0');
        const timePart = String(now.getHours()).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0');
        const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const uniqueFileName = `${hospital}_${datePart}_${timePart}_${randPart}.pdf`;

        const formData = new FormData();
        formData.append("pdf", pdfBlob, uniqueFileName);
        formData.append("userId", hospital);

        const response = await fetch("https://api.doxyncure.com/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        documentId = data.id;

        // Start timer
        timeLeft = 300;
        approvalTimer = setInterval(updateTimer, 1000);

        // Poll server every 5 seconds
        pollingInterval = setInterval(checkStatus, 5000);

    } catch (err) {
        alert("Failed to upload PDF.");
        console.error(err);
    }
}

// ========================
// Poll Status
// ========================

async function checkStatus() {
    if (!documentId) return;

    try {
        const response = await fetch(`https://api.doxyncure.com/pending/${hospital}`);
        const data = await response.json();

        // If no longer pending, check if approved
        if (data && data.id === documentId) {
            return; // still pending
        }

        const statusResponse = await fetch(`https://api.doxyncure.com/file/${documentId}`);

        if (statusResponse.status === 200) {
            clearAll();
            alert("Document Approved ✅");
        }

    } catch (err) {
        console.error(err);
    }
}

// ========================
// Timer Logic
// ========================

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    document.getElementById('timer').innerText =
        `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;

    if (timeLeft <= 0) {
        clearAll();
        deleteFromServer();
        alert("Approval timed out. Document deleted.");
    }

    timeLeft--;
}

function clearAll() {
    clearInterval(approvalTimer);
    clearInterval(pollingInterval);
    document.getElementById('approval-modal').style.display = 'none';
}

// ========================
// Delete If Timeout
// ========================

async function deleteFromServer() {
    if (!documentId) return;

    await fetch(`https://api.doxyncure.com/deny/${documentId}`, {
        method: "POST"
    });
}