// ==========================================
// 1. CẤU HÌNH ĐƯỜNG DẪN & BIẾN TOÀN CỤC
// ==========================================
const API = "";
const ENDPOINTS = {
    LOCKERS: `${API}/lockers`,
    SESSIONS: `${API}/sessions`,
    TICKETS: `${API}/tickets`
};

let chartInstance = null;

// Khởi tạo khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadPageData();
    // Tự động làm mới dữ liệu mỗi 10 giây
    setInterval(loadPageData, 10000);
    setupTicketForm();
});

// Điều hướng tải dữ liệu dựa trên URL
function loadPageData() {
    const path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html") || path === "") {
        loadDashboard();
    } else if (path.includes("lockers.html")) {
        loadLockers();
    } else if (path.includes("users.html")) {
        loadSessions();
    } else if (path.includes("support.html")) {
        loadTickets();
    }
}

// Hàm chuẩn hóa Status để hiện đúng màu CSS
function getStatusClass(status) {
    if (!status) return "free";
    const s = status.toUpperCase();
    if (s === "FREE" || s === "AVAILABLE") return "free";
    if (s === "OCCUPIED" || s === "IN_USE") return "in-use";
    if (s === "ERROR") return "error";
    return s.toLowerCase();
}

// ==========================================
// 2. QUẢN LÝ LOCKER (TRANG lockers.html)
// ==========================================

// Hàm mở Modal để THÊM MỚI
function showLockerModal() {
    const modal = document.getElementById("lockerModal");
    if (!modal) return;

    document.getElementById("modalTitle").innerText = "Thêm Tủ Đồ Mới";
    document.getElementById("editFlag").value = ""; // Rỗng = Thêm mới

    const idInput = document.getElementById("lockerId");
    if (idInput) {
        idInput.value = "";
        idInput.disabled = false; // Cho phép nhập ID tay
    }

    document.getElementById("lockerLocation").value = "";
    document.getElementById("statusGroup").style.display = "none";
    modal.style.display = "block";
}

// Hàm mở Modal để CHỈNH SỬA
async function showEditLocker(id) {
    try {
        const l = await fetch(`${ENDPOINTS.LOCKERS}/${id}`).then(res => res.json());
        const modal = document.getElementById("lockerModal");
        if (!modal) return;

        document.getElementById("modalTitle").innerText = "Cập Nhật Tủ #" + id;
        document.getElementById("editFlag").value = "EDIT";

        const idInput = document.getElementById("lockerId");
        if (idInput) {
            idInput.value = id;
            idInput.disabled = true; // Khóa ID khi sửa
        }

        document.getElementById("lockerLocation").value = l.location || "";
        document.getElementById("lockerStatus").value = l.status;
        document.getElementById("statusGroup").style.display = "block";
        modal.style.display = "block";
    } catch (e) { alert("Không tìm thấy thông tin tủ."); }
}

// Hàm LƯU DỮ LIỆU (POST/PUT)
async function saveLocker() {
    const isEdit = document.getElementById("editFlag").value === "EDIT";
    const id = document.getElementById("lockerId").value;
    const location = document.getElementById("lockerLocation").value;
    const status = document.getElementById("lockerStatus").value;

    if (!id || !location) {
        alert("Vui lòng nhập đầy đủ Mã tủ (ID) và Vị trí!");
        return;
    }

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${ENDPOINTS.LOCKERS}/${id}` : ENDPOINTS.LOCKERS;
    const bodyData = isEdit ? { location, status } : { id, location };

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            closeModal();
            loadLockers();
        } else {
            alert("Lỗi: Mã tủ (ID) có thể đã tồn tại!");
        }
    } catch (e) { alert("Lỗi kết nối server."); }
}

async function loadLockers() {
    try {
        const data = await fetch(ENDPOINTS.LOCKERS).then(res => res.json());
        const tbody = document.getElementById("lockerTable");
        if (!tbody) return;

        tbody.innerHTML = data.map(l => `
            <tr>
                <td><strong>${l.id}</strong></td>
                <td>${l.location || 'Chưa xác định'}</td>
                <td class="status-${getStatusClass(l.status)}">${l.status}</td>
                <td>
                    <button style="background:#3b82f6" onclick="handleLockerControl('${l.id}', 'open')">Mở</button>
                    <button style="background:#475569" onclick="showEditLocker('${l.id}')">Sửa</button>
                    <button style="background:#ef4444" onclick="deleteLocker('${l.id}')">Xóa</button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải danh sách tủ:", e); }
}

async function deleteLocker(id) {
    if (!confirm(`Xác nhận xóa tủ ${id}?`)) return;
    await fetch(`${ENDPOINTS.LOCKERS}/${id}`, { method: "DELETE" });
    loadLockers();
}

function closeModal() {
    const modal = document.getElementById("lockerModal");
    if (modal) modal.style.display = "none";
}

// ==========================================
// 3. DASHBOARD, SESSIONS & TICKETS
// ==========================================
async function loadDashboard() {
    try {
        const [lockers, tickets] = await Promise.all([
            fetch(ENDPOINTS.LOCKERS).then(res => res.json()),
            fetch(ENDPOINTS.TICKETS).then(res => res.ok ? res.json() : []).catch(() => [])
        ]);

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        const countFree = lockers.filter(l => ["FREE", "AVAILABLE"].includes(l.status.toUpperCase())).length;
        const countUsed = lockers.filter(l => ["OCCUPIED", "IN_USE"].includes(l.status.toUpperCase())).length;
        const countError = lockers.filter(l => l.status.toUpperCase() === "ERROR").length;

        setVal("total", lockers.length);
        setVal("free", countFree);
        setVal("occupied", countUsed);
        setVal("error", countError);
        setVal("supportCount", tickets.filter(t => t.status !== "RESOLVED").length);

        const ctx = document.getElementById("chart");
        if (ctx) {
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Trống', 'Đang dùng', 'Lỗi'],
                    datasets: [{
                        data: [countFree, countUsed, countError],
                        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        const layout = document.getElementById("layout");
        if (layout) {
            layout.innerHTML = lockers.map(l => `
                <div class="locker status-${getStatusClass(l.status)}" title="Vị trí: ${l.location || 'N/A'}">${l.id}</div>
            `).join("");
        }
    } catch (e) { console.error("Lỗi Dashboard:", e); }
}

async function loadSessions() {
    try {
        const data = await fetch(ENDPOINTS.SESSIONS).then(res => res.json());
        const tbody = document.getElementById("sessionTable");
        if (!tbody) return;
        tbody.innerHTML = data.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.locker_id || 'N/A'}</td>
                <td style="font-family:monospace; color:#3b82f6;">${s.palm_hash || '---'}</td>
                <td>${s.start_time ? new Date(s.start_time).toLocaleString('vi-VN') : '---'}</td>
                <td>${s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : '<span style="color:green; font-weight:bold;">ĐANG DÙNG</span>'}</td>
                <td><button style="background:#f59e0b" onclick="finishSession('${s.id}')">Kết thúc</button></td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải phiên sử dụng:", e); }
}

async function loadTickets() {
    try {
        const data = await fetch(ENDPOINTS.TICKETS).then(res => res.json());
        const tbody = document.getElementById("supportTable");
        if (!tbody) return;
        tbody.innerHTML = data.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.session_id || 'N/A'}</td>
                <td>${t.created_at ? new Date(t.created_at).toLocaleString('vi-VN') : '---'}</td>
                <td>${t.reason}</td>
                <td class="status-${t.status ? t.status.toLowerCase() : 'open'}">${t.status}</td>
                <td>
                    <button onclick="updateTicketStatus('${t.id}', 'RESOLVED')">Giải quyết</button>
                    <button style="background:#ef4444" onclick="deleteTicket('${t.id}')">Xóa</button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error("Lỗi tải ticket:", e); }
}

async function handleLockerControl(id, action) {
    try {
        const res = await fetch(`${ENDPOINTS.LOCKERS}/${id}/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: "ADMIN_OVER_WRITE" })
        }).then(res => res.json());
        alert(res.message || "Lệnh đã được gửi đi!");
        loadLockers();
    } catch (e) { alert("Lỗi điều khiển tủ đồ."); }
}

function setupTicketForm() {
    const form = document.getElementById("ticketForm");
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const session_id = document.getElementById("ticketLockerId").value;
        const reason = document.getElementById("ticketReason").value;
        try {
            await fetch(ENDPOINTS.TICKETS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id, reason, status: "OPEN" })
            });
            document.getElementById("responseMessage").innerText = "✅ Đã gửi báo cáo lỗi thành công!";
            form.reset();
        } catch (e) { document.getElementById("responseMessage").innerText = "❌ Lỗi kết nối server."; }
    };
}