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
    // Tự động làm mới mỗi 15 giây (tránh làm phiền khi đang nhập liệu)
    setInterval(() => {
        const isModalOpen = document.querySelector('.modal[style*="display: block"]');
        if (!isModalOpen) loadPageData();
    }, 15000);
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
    if (s === "OCCUPIED") return "in-use";
    if (s === "ERROR") return "error";
    return s.toLowerCase();
}

// ==========================================
// 2. HÀM HỆ THỐNG (THÔNG BÁO LỖI KIỂU WINDOWS)
// ==========================================
function showErrorDialog(message) {
    const dialog = document.getElementById("errorDialog");
    const msg = document.getElementById("errorDialogMessage");
    if (dialog && msg) {
        msg.innerText = message;
        dialog.style.display = "flex";
    } else {
        alert(message); // Backup nếu thiếu HTML
    }
}

function closeErrorDialog() {
    const dialog = document.getElementById("errorDialog");
    if (dialog) dialog.style.display = "none";
}

// ==========================================
// 3. QUẢN LÝ LOCKER (TRANG lockers.html)
// ==========================================

// Hàm vẽ bảng (Dùng chung cho Load và Search)
function renderTable(data) {
    const tbody = document.getElementById("lockerTable");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(l => {
        // Kiểm tra xem trạng thái có phải là OCCUPIED không (không phân biệt hoa thường)
        const isOccupied = l.status && l.status.toUpperCase() === "OCCUPIED";

        return `
            <tr>
                <td><strong>${l.id}</strong></td>
                <td>${l.location || 'Chưa xác định'}</td>
                <td class="status-${getStatusClass(l.status)}">${l.status}</td>
                <td>
                    ${isOccupied ? `<button style="background:#3b82f6" onclick="showTicketModal('${l.id}')">Mở</button>` : ''}
                    
                    <button style="background:#475569" onclick="showEditLocker('${l.id}')">Sửa</button>
                    <button style="background:#ef4444" onclick="deleteLocker('${l.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join("");
}

async function loadLockers() {
    try {
        const data = await fetch(ENDPOINTS.LOCKERS).then(res => res.json());
        renderTable(data);
    } catch (e) { console.error("Lỗi tải danh sách tủ:", e); }
}

// TÌM KIẾM VÀ LỌC (GỌI BACKEND)
async function filterLockers() {
    const keyword = document.getElementById("lockerSearch").value.trim();
    const status = document.getElementById("statusFilter").value;

    try {
        const url = `${ENDPOINTS.LOCKERS}/search?keyword=${encodeURIComponent(keyword)}&status=${status}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const results = await response.json();
        renderTable(results);
    } catch (e) {
        showErrorDialog("Lỗi khi tìm kiếm dữ liệu từ hệ thống!");
    }
}

async function resetFilters() {
    document.getElementById("lockerSearch").value = "";
    document.getElementById("statusFilter").value = "ALL";
    await loadLockers();
}
function showTicketModal(lockerId) {
    const modal = document.getElementById("ticketModal");
    if (!modal) return;
    document.getElementById("displayLockerId").innerText = "#" + lockerId;
    document.getElementById("ticketLockerId").value = lockerId;
    document.getElementById("ticketTime").value = new Date().toLocaleString('vi-VN');
    document.getElementById("ticketReason").value = "";
    modal.style.display = "block";
}

function closeTicketModal() {
    document.getElementById("ticketModal").style.display = "none";
}
function showLockerModal() {
    const modal = document.getElementById("lockerModal");
    if (!modal) return;
    document.getElementById("modalTitle").innerText = "Thêm Tủ Đồ Mới";
    document.getElementById("editFlag").value = "";
    const idGroup = document.getElementById("idInputGroup");
    if (idGroup) idGroup.style.display = "none";
    document.getElementById("lockerLocation").value = "";
    document.getElementById("statusGroup").style.display = "none";
    modal.style.display = "block";
}

async function showEditLocker(id) {
    try {
        const l = await fetch(`${ENDPOINTS.LOCKERS}/${id}`).then(res => res.json());
        const modal = document.getElementById("lockerModal");
        if (!modal) return;
        document.getElementById("modalTitle").innerText = "Cập Nhật Tủ #" + id;
        document.getElementById("editFlag").value = "EDIT";
        const idGroup = document.getElementById("idInputGroup");
        if (idGroup) idGroup.style.display = "block";
        const idInput = document.getElementById("lockerId");
        if (idInput) {
            idInput.value = id;
            idInput.disabled = true;
        }
        document.getElementById("lockerLocation").value = l.location || "";
        document.getElementById("lockerStatus").value = l.status;
        document.getElementById("statusGroup").style.display = "block";
        modal.style.display = "block";
    } catch (e) { showErrorDialog("Không tìm thấy thông tin tủ."); }
}

async function saveLocker() {
    const editFlagEl = document.getElementById("editFlag");
    const locationEl = document.getElementById("lockerLocation");
    const statusEl = document.getElementById("lockerStatus");
    const idEl = document.getElementById("lockerId");
    const errorEl = document.getElementById("error-message");

    if (errorEl) errorEl.style.display = "none";

    if (!locationEl.value.trim()) {
        if (errorEl) {
            errorEl.innerText = "⚠️ Bạn chưa nhập vị trí tủ!";
            errorEl.style.display = "block";
        }
        return;
    }

    const isEdit = editFlagEl.value === "EDIT";
    const id = idEl ? idEl.value : "";
    const bodyData = isEdit ? { location: locationEl.value, status: statusEl.value } : { location: locationEl.value };
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${ENDPOINTS.LOCKERS}/${id}` : ENDPOINTS.LOCKERS;

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
            showErrorDialog("Vị trí này đã có tủ đồ rồi, Toàn chọn chỗ khác nhé!");
        }
    } catch (e) {
        showErrorDialog("Lỗi kết nối server rồi!");
    }
}

async function deleteLocker(id) {
    if (!confirm(`Xác nhận xóa tủ ${id}?`)) return;
    await fetch(`${ENDPOINTS.LOCKERS}/${id}`, { method: "DELETE" });
    loadLockers();
}

function closeModal() {
    const modal = document.getElementById("lockerModal");
    const errorEl = document.getElementById("error-message");
    if (modal) modal.style.display = "none";
    if (errorEl) errorEl.style.display = "none";
}

// ==========================================
// 4. DASHBOARD, SESSIONS & TICKETS
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
async function submitTicket() {
    const lockerId = document.getElementById("ticketLockerId").value;
    const reason = document.getElementById("ticketReason").value;

    if (!reason.trim()) {
        showErrorDialog("Vui lòng nhập lý do!");
        return;
    }

    try {
        // Sửa lại thành ${lockerId} cho khớp với biến ở trên
        const url = `http://localhost:8080/lockers/open?id=${lockerId}`;

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (res.ok) {
            closeTicketModal();
            alert("✅ Đã gửi lệnh mở tủ khẩn cấp thành công!");
            loadLockers();
        } else {
            showErrorDialog("Không thể thực hiện lệnh mở tủ!");
        }
    } catch (e) {
        // In lỗi thật ra F12 Console để dễ tìm nguyên nhân
        console.error("Lỗi thật sự là:", e);
        showErrorDialog("Lỗi kết nối Server!");
    }
}


