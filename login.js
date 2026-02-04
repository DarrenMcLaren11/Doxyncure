const db = [
    { u: "admin", p: "dox_admin", hosp: "XYZ" },
    { u: "staff1", p: "pass1", hosp: "XYZ" },
    { u: "staff2", p: "pass2", hosp: "XYZ" },
    { u: "staff3", p: "pass3", hosp: "XYZ" },
    { u: "staff4", p: "pass4", hosp: "XYZ" },
    { u: "staff5", p: "pass5", hosp: "XYZ" },
    { u: "staff6", p: "pass6", hosp: "ABC" },
    { u: "staff7", p: "pass7", hosp: "ABC" },
    { u: "staff8", p: "pass8", hosp: "ABC" },
    { u: "staff9", p: "pass9", hosp: "ABC" },
    { u: "staff10", p: "pass10", hosp: "ABC" }
];

function handleLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const err = document.getElementById('err');
    
    const user = db.find(e => e.u === u && e.p === p);
    
    if(user) {
        localStorage.setItem("userHosp", user.hosp);
        window.location.href = "input.html";
    } else {
        err.style.display = 'block';
    }
}