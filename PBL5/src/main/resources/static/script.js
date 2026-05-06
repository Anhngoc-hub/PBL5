// ==========================================
// 1. CẤU HÌNH ĐƯỜNG DẪN & BIẾN TOÀN CỤC
// ==========================================
const API = "http://localhost:8080"; // Đã thêm cổng mặc định của Spring Boot
const ENDPOINTS = {
    LOCKERS: `${API}/lockers`,
    SESSIONS: `${API}/sessions`,
    TICKETS: `${API}/tickets`,
    IMAGES: `${API}/sessions/images` // Endpoint để lấy ảnh từ Folder
};

let chartInstance = null;
let isSearching = false; // Flag kiểm soát tự động làm mới
// Khởi tạo khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadPageData();
    // Tự động làm mới mỗi 15 giây
    setInterval(() => {
        const isModalOpen = document.querySelector('.modal[style*="display: block"]');
        // Chỉ làm mới nếu không mở Modal và không ở chế độ tìm kiếm
        if (!isModalOpen && !isSearching) {
            console.log("🔄 Tự động cập nhật dữ liệu...");
            loadPageData();
        }
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

    isSearching = (keyword !== "" || status !== "ALL");

    try {
        const url = `${ENDPOINTS.LOCKERS}/search?keyword=${encodeURIComponent(keyword)}&status=${status}`;
        const response = await fetch(url);
        const results = await response.json();
        renderTable(results);
    } catch (e) {
        showErrorDialog("Lỗi khi tìm kiếm dữ liệu!");
    }
}

async function resetFilters() {
    document.getElementById("lockerSearch").value = "";
    document.getElementById("statusFilter").value = "ALL";
    await loadLockers();
}
async function showTicketModal(lockerId) {
    const modal = document.getElementById("ticketModal");
    const gallery = document.getElementById("imageGallery");
    const placeholder = document.getElementById("imagePlaceholder");

    // Hiện Modal và điền thông tin text
    modal.style.display = "block";
    document.getElementById("displayLockerId").innerText = "#" + lockerId;
    document.getElementById("ticketLockerId").value = lockerId;
    document.getElementById("ticketTime").value = new Date().toLocaleString('vi-VN');

    // Reset Gallery sạch sẽ trước khi tải ảnh mới
    gallery.querySelectorAll('img').forEach(img => img.remove());
    placeholder.style.display = "block";
    placeholder.innerHTML = "⌛ Đang tìm phiên sử dụng gần nhất...";

    try {
        // 1. Lấy Session mới nhất của tủ này
        // Lưu ý: Endpoint này phải trả về object có cả id (tên folder) và startTime
        const sessionRes = await fetch(`http://localhost:8080/sessions/${lockerId}/current-session`);
        if (!sessionRes.ok) throw new Error("Không tìm thấy session");
        const session = await sessionRes.json();

        if (session && session.id) {
            placeholder.innerHTML = "⌛ Đang tải ảnh từ folder...";

            // 2. Lấy danh sách URL ảnh từ folder thực tế
            // Truyền id (session_177...) và startTime (2024-05-20...)
            const imgRes = await fetch(`http://localhost:8080/sessions/images?sessionId=${session.id}&startTime=${session.startTime}`);
            const imageUrls = await imgRes.json();

            if (imageUrls && imageUrls.length > 0) {
                placeholder.style.display = "none";
                imageUrls.forEach(url => {
                    const img = document.createElement("img");
                    // URL từ Java trả về là đường dẫn tương đối, cần thêm prefix host
                    img.src = `http://localhost:8080${url}`;

                    img.style.width = "100%";
                    img.style.borderRadius = "8px";
                    img.style.marginBottom = "10px";
                    img.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

                    gallery.appendChild(img);
                });
            } else {
                placeholder.innerHTML = "⚠️ Thư mục ảnh trống.";
            }
        } else {
            placeholder.innerHTML = "⚠️ Tủ đồ này hiện không có dữ liệu phiên.";
        }
    } catch (e) {
        console.error("Lỗi:", e);
        placeholder.innerHTML = "⚠️ Không thể kết nối đến máy chủ ảnh.";
    }
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
        const res = await fetch("http://localhost:8080/lockers/open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lockerId: lockerId,
                reason: reason
            })
        });

        if (res.ok) {
            closeTicketModal();
            alert("✅ Đã gửi lệnh mở tủ + lưu ticket thành công!");
            loadLockers();
        } else {
            showErrorDialog("Không thể thực hiện lệnh mở tủ!");
        }

    } catch (e) {
        console.error("Lỗi thật sự là:", e);
        showErrorDialog("Lỗi kết nối Server!");
    }
}
// 1. Tìm kiếm và Sắp xếp (Thay thế hoàn toàn cho logic cũ)
async function filterSessions() {
    const lockerId = document.getElementById("sessionSearch").value.trim();
    const status = document.getElementById("statusFilter").value;
    const sortBy = document.getElementById("sortField").value;

    // Bật flag để dừng auto-refresh
    isSearching = (lockerId !== "" || status !== "ALL");

    try {
        const url = `${API}/sessions/search?lockerId=${encodeURIComponent(lockerId)}&status=${status}&sortBy=${sortBy}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderSessionTable(data);
    } catch (e) {
        console.error(e);
        // Tránh hiện dialog liên tục nếu do auto-refresh lỗi, chỉ hiện khi người dùng chủ động tìm
        if (lockerId) showErrorDialog("Lỗi truy xuất dữ liệu!");
    }
}
// 2. Tải toàn bộ danh sách khi trang web vừa mở
async function loadSessions() {
    try {
        const response = await fetch(ENDPOINTS.SESSIONS);
        const data = await response.json();
        renderSessionTable(data);
    } catch (e) {
        console.error("Lỗi tải phiên sử dụng:", e);
    }
}


function renderSessionTable(data) {
    const tbody = document.getElementById("sessionTable");
    if (!tbody) return;

    const list = Array.isArray(data) ? data : (data && data.id ? [data] : []);

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => {
        const statusColor = s.status === 'ACTIVE' ? '#22c55e' : '#64748b';

        return `
        <tr>
            <td><strong>${s.id}</strong></td>
            <td>${s.lockerId || 'N/A'}</td>
            <td style="font-family:monospace; font-size:12px; color:#3b82f6;">${s.palm_hash || s.palmHash || '---'}</td>
            <td>${(s.start_time || s.startTime) ? new Date(s.start_time || s.startTime).toLocaleString('vi-VN') : '---'}</td>
            <td>${(s.end_time || s.endTime) ? new Date(s.end_time || s.endTime).toLocaleString('vi-VN') : '---'}</td>
            
            <td>
                <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                    ${s.status}
                </span>
            </td>

            <td>
                <button style="background:#f59e0b; border:none; color:white; padding:5px 10px; border-radius:4px; cursor:pointer;" 
                        onclick="finishSession('${s.id}')">Kết thúc</button>
            </td>
        </tr>
    `}).join("");
}
// 4. Reset các bộ lọc về mặc định
function resetSessionFilters() {
    isSearching = false; // Tắt flag để tiếp tục auto-refresh
    document.getElementById("sessionSearch").value = "";
    document.getElementById("statusFilter").value = "ALL";
    if (document.getElementById("sortField")) document.getElementById("sortField").value = "start_time";
    loadSessions();
}