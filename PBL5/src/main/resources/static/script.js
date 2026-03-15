const API = "http://localhost:8080/api";
let chartInstance = null;

// Khởi tạo khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadPageData();
    // Tự động làm mới dữ liệu mỗi 10 giây
    setInterval(loadPageData, 10000);
    setupTicketForm();
});

// Điều hướng tải dữ liệu dựa trên file HTML đang mở
function loadPageData() {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === "index.html" || page === "") loadDashboard();
    if (page === "lockers.html") loadLockers();
    if (page === "users.html") loadSessions();
    if (page === "support.html") loadTickets();
}

// ==========================================
// 1. QUẢN LÝ LOCKER (Bảng: pbl5 locker)
// ==========================================

async function loadLockers() {
    try {
        const data = await fetch(`${API}/lockers`).then(res => res.json());
        const tbody = document.getElementById("lockerTable");
        if (!tbody) return;

        tbody.innerHTML = data.map(l => `
            <tr>
                <td><strong>${l.id}</strong></td>
                <td>${l.location}</td>
                <td class="status-${l.status.toLowerCase()}">${l.status}</td>
                <td>
                    <button onclick="handleLockerControl('${l.id}', 'open')">Mở</button>
                    <button style="background:#64748b" onclick="handleLockerControl('${l.id}', 'close')">Đóng</button>
                    <button style="background:#475569" onclick="showEditLocker('${l.id}')">Sửa</button>
                    <button style="background:#ef4444" onclick="deleteLocker('${l.id}')">Xóa</button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải danh sách tủ:", e); }
}

async function showLockerModal() {
    const modal = document.getElementById("lockerModal");
    if (!modal) return;
    document.getElementById("modalTitle").innerText = "Thêm Tủ Đồ Mới";
    document.getElementById("editLockerId").value = "";
    document.getElementById("lockerLocation").value = "";
    document.getElementById("statusGroup").style.display = "none";
    modal.style.display = "block";
}

async function showEditLocker(id) {
    const l = await fetch(`${API}/lockers/${id}`).then(res => res.json());
    const modal = document.getElementById("lockerModal");
    if (!modal) return;

    document.getElementById("modalTitle").innerText = "Cập Nhật Tủ #" + id;
    document.getElementById("editLockerId").value = id;
    document.getElementById("lockerLocation").value = l.location;
    document.getElementById("lockerStatus").value = l.status;
    document.getElementById("statusGroup").style.display = "block";
    modal.style.display = "block";
}

async function saveLocker() {
    const id = document.getElementById("editLockerId").value;
    const location = document.getElementById("lockerLocation").value;
    const status = document.getElementById("lockerStatus").value;

    if (!location) return alert("Vui lòng nhập vị trí!");

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/lockers/${id}` : `${API}/lockers`;
    const body = id ? { location, status } : { location };

    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    closeModal();
    loadLockers();
}

async function deleteLocker(id) {
    if (!confirm("Xóa tủ " + id + "?")) return;
    await fetch(`${API}/lockers/${id}`, { method: "DELETE" });
    loadLockers();
}

// ==========================================
// 2. QUẢN LÝ SESSION (Bảng: pbl5 session)
// ==========================================

async function loadSessions() {
    try {
        const data = await fetch(`${API}/sessions`).then(res => res.json());
        const tbody = document.getElementById("sessionTable");
        if (!tbody) return;

        tbody.innerHTML = data.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.locker_id}</td>
                <td title="${s.palm_hash}" style="cursor:help; color:#3b82f6;">Xem mã băm</td>
                <td>${s.start_time ? new Date(s.start_time).toLocaleString('vi-VN') : '---'}</td>
                <td>${s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : '<span style="color:green">Đang hoạt động</span>'}</td>
                <td>
                    <button style="background:#f59e0b" onclick="finishSession('${s.id}')">Kết thúc</button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải phiên sử dụng:", e); }
}

async function finishSession(id) {
    await fetch(`${API}/sessions/${id}/finish`, { method: "PUT" });
    loadSessions();
}

// ==========================================
// 3. QUẢN LÝ TICKET (Bảng: pbl5 ticket)
// ==========================================

async function loadTickets() {
    try {
        const data = await fetch(`${API}/tickets`).then(res => res.json());
        const tbody = document.getElementById("supportTable");
        if (!tbody) return;

        tbody.innerHTML = data.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.locker_id || 'N/A'}</td>
                <td>${new Date(t.created_at).toLocaleString('vi-VN')}</td>
                <td>${t.reason}</td>
                <td class="status-${t.status.toLowerCase()}">${t.status}</td>
                <td>
                    <button onclick="updateTicketStatus('${t.id}', 'RESOLVED')">Giải quyết</button>
                    <button style="background:#ef4444" onclick="deleteTicket('${t.id}')">Xóa</button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải ticket:", e); }
}

async function updateTicketStatus(id, status) {
    await fetch(`${API}/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status })
    });
    loadTickets();
}

async function deleteTicket(id) {
    if (!confirm("Xóa ticket này?")) return;
    await fetch(`${API}/tickets/${id}`, { method: "DELETE" });
    loadTickets();
}

// Hàm gửi ticket từ trang report.html
function setupTicketForm() {
    const form = document.getElementById("ticketForm");
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const locker_id = document.getElementById("ticketLockerId").value; // Theo DB dùng locker_id
        const reason = document.getElementById("ticketReason").value;
        const msg = document.getElementById("responseMessage");

        try {
            const res = await fetch(`${API}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locker_id, reason })
            });
            if (res.ok) {
                msg.innerText = "✅ Đã gửi báo cáo lỗi thành công!";
                msg.style.color = "green";
                form.reset();
            }
        } catch (e) {
            msg.innerText = "❌ Không thể gửi báo cáo.";
            msg.style.color = "red";
        }
    };
}

// ==========================================
// 4. LOCKER CONTROL (Mở/Đóng)
// ==========================================

async function handleLockerControl(id, action) {
    try {
        const res = await fetch(`${API}/lockers/${id}/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: "ADMIN_OVERRIDE" })
        }).then(res => res.json());
        alert(res.message);
        loadLockers();
    } catch (e) { alert("Lỗi kết nối đến tủ đồ."); }
}

// ==========================================
// 5. DASHBOARD & BIỂU ĐỒ
// ==========================================

async function loadDashboard() {
    try {
        const [lockers, tickets] = await Promise.all([
            fetch(`${API}/lockers`).then(res => res.json()),
            fetch(`${API}/tickets`).then(res => res.json())
        ]);

        const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).innerText = val; };

        setVal("total", lockers.length);
        setVal("free", lockers.filter(l => l.status === "FREE").length);
        setVal("occupied", lockers.filter(l => l.status === "IN_USE").length);
        setVal("error", lockers.filter(l => l.status === "ERROR").length);
        setVal("supportCount", tickets.filter(t => t.status !== "RESOLVED").length);

        // Biểu đồ
        const ctx = document.getElementById("chart");
        if (ctx) {
            const stats = [
                lockers.filter(l => l.status === "FREE").length,
                lockers.filter(l => l.status === "IN_USE").length,
                lockers.filter(l => l.status === "ERROR").length
            ];
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Trống', 'Đang dùng', 'Lỗi'],
                    datasets: [{
                        data: stats,
                        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Layout trực quan
        const layout = document.getElementById("layout");
        if (layout) {
            layout.innerHTML = lockers.map(l => `
                <div class="locker status-${l.status.toLowerCase()}" title="Vị trí: ${l.location}">${l.id}</div>
            `).join("");
        }
    } catch (e) { console.error("Lỗi Dashboard:", e); }
}

function closeModal() {
    const modal = document.getElementById("lockerModal");
    if (modal) modal.style.display = "none";
}
/*
// const API = "http://localhost:8080/api"; // Tạm thời đóng API thật
let chartInstance = null;

// DỮ LIỆU MẪU (MOCK DATA)
const mockLockers = [
    { id: "L01", location: "Khu A - Tầng 1", status: "FREE" },
    { id: "L02", location: "Khu A - Tầng 1", status: "IN_USE" },
    { id: "L03", location: "Khu A - Tầng 1", status: "ERROR" },
    { id: "L04", location: "Khu B - Tầng 2", status: "FREE" },
    { id: "L05", location: "Khu B - Tầng 2", status: "IN_USE" },
    { id: "L06", location: "Khu B - Tầng 2", status: "FREE" },
    { id: "L07", location: "Khu C - Tầng 1", status: "FREE" },
    { id: "L08", location: "Khu C - Tầng 1", status: "ERROR" }
];

const mockSessions = [
    { id: "S001", locker_id: "L02", palm_hash: "hash_99a5b...", start_time: "2026-03-15T08:30:00", end_time: null },
    { id: "S002", locker_id: "L05", palm_hash: "hash_22c81...", start_time: "2026-03-15T09:00:00", end_time: "2026-03-15T10:15:00" }
];

const mockTickets = [
    { id: "TK01", locker_id: "L03", created_at: "2026-03-15T07:20:00", reason: "Tủ kẹt khóa không mở được", status: "OPEN" },
    { id: "TK02", locker_id: "L08", created_at: "2026-03-14T15:45:00", reason: "Lỗi cảm biến nhận diện", status: "RESOLVED" }
];

document.addEventListener("DOMContentLoaded", () => {
    loadPageData();
});

function loadPageData() {
    const page = window.location.pathname.split("/").pop();
    if (page === "index.html" || page === "") loadDashboard();
    if (page === "lockers.html") loadLockers();
    if (page === "users.html") loadSessions();
    if (page === "support.html") loadTickets();
}

// 1. QUẢN LÝ LOCKER
async function loadLockers() {
    const data = mockLockers; // Dùng dữ liệu mẫu
    const tbody = document.getElementById("lockerTable");
    if (!tbody) return;
    tbody.innerHTML = data.map(l => `
        <tr>
            <td><strong>${l.id}</strong></td>
            <td>${l.location}</td>
            <td class="status-${l.status.toLowerCase()}">${l.status}</td>
            <td>
                <button onclick="alert('Mở tủ ${l.id}')">Mở</button>
                <button style="background:#64748b" onclick="alert('Đóng tủ ${l.id}')">Đóng</button>
                <button style="background:#475569">Sửa</button>
                <button style="background:#ef4444">Xóa</button>
            </td>
        </tr>
    `).join("");
}

// 2. QUẢN LÝ SESSION
async function loadSessions() {
    const data = mockSessions; // Dùng dữ liệu mẫu
    const tbody = document.getElementById("sessionTable");
    if (!tbody) return;
    tbody.innerHTML = data.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.locker_id}</td>
            <td title="${s.palm_hash}" style="color:#3b82f6; cursor:help;">Xem mã băm</td>
            <td>${new Date(s.start_time).toLocaleString('vi-VN')}</td>
            <td>${s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : '<span style="color:green; font-weight:bold;">Đang dùng</span>'}</td>
            <td><button style="background:#f59e0b">Kết thúc</button></td>
        </tr>
    `).join("");
}

// 3. QUẢN LÝ TICKET
async function loadTickets() {
    const data = mockTickets; // Dùng dữ liệu mẫu
    const tbody = document.getElementById("supportTable");
    if (!tbody) return;
    tbody.innerHTML = data.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.locker_id}</td>
            <td>${new Date(t.created_at).toLocaleString('vi-VN')}</td>
            <td>${t.reason}</td>
            <td class="status-${t.status.toLowerCase()}">${t.status}</td>
            <td><button>Giải quyết</button></td>
        </tr>
    `).join("");
}

// 4. DASHBOARD
async function loadDashboard() {
    const lockers = mockLockers;
    const tickets = mockTickets;

    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).innerText = val; };

    setVal("total", lockers.length);
    setVal("free", lockers.filter(l => l.status === "FREE").length);
    setVal("occupied", lockers.filter(l => l.status === "IN_USE").length);
    setVal("error", lockers.filter(l => l.status === "ERROR").length);
    setVal("supportCount", tickets.filter(t => t.status === "OPEN").length);

    // Vẽ biểu đồ Chart.js
    const ctx = document.getElementById("chart");
    if (ctx) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Trống', 'Đang dùng', 'Lỗi'],
                datasets: [{
                    data: [
                        lockers.filter(l => l.status === "FREE").length,
                        lockers.filter(l => l.status === "IN_USE").length,
                        lockers.filter(l => l.status === "ERROR").length
                    ],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Vẽ sơ đồ tủ
    const layout = document.getElementById("layout");
    if (layout) {
        layout.innerHTML = lockers.map(l => `
            <div class="locker status-${l.status.toLowerCase()}" title="${l.location}">${l.id}</div>
        `).join("");
    }
}

// Modal functions
function showLockerModal() { document.getElementById("lockerModal").style.display = "block"; }
function closeModal() { document.getElementById("lockerModal").style.display = "none"; }
*/