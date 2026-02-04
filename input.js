// Retrieve hospital name from the login session
const hospital = localStorage.getItem("userHosp") || "General";

function openPreview() {
    const editorContent = document.getElementById('clinical-editor').value;
    if (!editorContent.trim()) {
        alert("The workspace is empty. Please enter patient notes.");
        return;
    }

    const titleDisplay = document.getElementById('hospital-name-display');
    const textContent = document.getElementById('pdf-text-content');

    // Branding logic
    titleDisplay.innerText = hospital + " HOSPITAL";
    
    // Dynamic Color Branding
    if (hospital === "ABC") {
        titleDisplay.style.color = "#065f46"; // Dark Green
    } else {
        titleDisplay.style.color = "#1e3a8a"; // Dark Blue
    }

    textContent.innerText = editorContent;
    document.getElementById('preview-modal').style.display = 'flex';
}

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
}

function downloadDocument() {
    const element = document.getElementById('pdf-export-area');
    const opt = {
        margin: 0.5,
        filename: hospital + '_Record_' + Date.now() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        alert("Document Authorized and Downloaded.");
        closePreview();
    });
}