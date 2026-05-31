// ==========================================
// 1. CẤU HÌNH ĐƯỜNG DẪN & BIẾN TOÀN CỤC
// ==========================================
const API = "http://localhost:8080";
const ENDPOINTS = {
    LOCKERS: `${API}/lockers`,
    SESSIONS: `${API}/sessions`,
    TICKETS: `${API}/api/tickets`,
    IMAGES: `${API}/sessions/images`
};

let chartInstance = null;
let isSearching = false;
let originalTicketsData = [];

// Khởi tạo khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadPageData();
    // Tự động làm mới mỗi 15 giây
    setInterval(() => {
        const isModalOpen = document.querySelector('.modal[style*="display: block"]');
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
        alert(message);
    }
}

function closeErrorDialog() {
    const dialog = document.getElementById("errorDialog");
    if (dialog) dialog.style.display = "none";
}

// ==========================================
// 3. QUẢN LÝ LOCKER (TRANG lockers.html)
// ==========================================
function renderTable(data) {
    const tbody = document.getElementById("lockerTable");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(l => {
        const isOccupied = l.status && l.status.toUpperCase() === "OCCUPIED";

        return `
        <tr>
            <td><strong>${l.id}</strong></td>
            <td>${l.location || 'Chưa xác định'}</td>
            <td class="status-${getStatusClass(l.status)}">${l.status}</td>
            <td>
                ${isOccupied ? `<button style="background:#3b82f6" onclick="handleOpenTicket('${l.id}')">Mở</button>` : ''}
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

// Luồng bóc tách dữ liệu mở tủ khẩn cấp (Sửa lỗi Nguyên nhân 1)
async function handleOpenTicket(lockerId) {
    try {
        console.log("=== BẮT ĐẦU LUỒNG MỞ TỦ KHẨN CẤP ===");
        const response = await fetch(`http://localhost:8080/sessions/${lockerId}/current-session`);

        if (!response.ok) {
            alert(`⚠️ Không tìm thấy phiên sử dụng hoạt động cho tủ này.`);
            return;
        }

        const textData = await response.text();
        if (!textData || textData.trim() === "") {
            alert(`❌ Không có dữ liệu phiên sử dụng mẫu trong Database liên kết với tủ ${lockerId}!`);
            return;
        }

        const session = JSON.parse(textData);
        let rawTime = session.startTime || session.start_time;
        if (!rawTime) {
            alert("❌ Phiên này không lưu thời gian bắt đầu, không quét được ảnh!");
            return;
        }

        const dateObj = new Date(rawTime);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const ss = String(dateObj.getSeconds()).padStart(2, '0');

        const folderSessionId = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
        let shortId = lockerId.replace(/\D+/g, "").slice(-2);

        showTicketModal(shortId, folderSessionId);

    } catch (error) {
        console.error("Lỗi crash luồng:", error);
        alert("Hệ thống gặp sự cố khi đọc dữ liệu.");
    }
}

async function showTicketModal(lockerId, sessionId) {
    const modal = document.getElementById("ticketModal");
    const gallery = document.getElementById("imageGallery");
    const placeholder = document.getElementById("imagePlaceholder");

    modal.style.display = "block";
    document.getElementById("displayLockerId").innerText = lockerId;
    document.getElementById("ticketLockerId").value = lockerId;
    document.getElementById("ticketTime").value = new Date().toLocaleString('vi-VN');

    gallery.querySelectorAll('img').forEach(img => img.remove());
    placeholder.style.display = "block";

    try {
        const response = await fetch(`http://localhost:8080/sessions/images-by-session?sessionId=${sessionId}`);
        if (!response.ok) throw new Error("Không tìm thấy ảnh");

        const imageUrls = await response.json();

        if (imageUrls.length > 0) {
            placeholder.style.display = "none";
            imageUrls.forEach(url => {
                const img = document.createElement("img");
                img.src = `http://localhost:8080${url}`;
                img.style.width = "100%";
                img.style.height = "120px";
                img.style.objectFit = "cover";
                img.style.borderRadius = "8px";
                img.style.cursor = "pointer";
                img.onclick = () => window.open(img.src, '_blank');
                gallery.appendChild(img);
            });
        }
    } catch (error) {
        placeholder.innerHTML = "⚠️ Không tìm thấy dữ liệu ảnh.";
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
// 4. DASHBOARD & TICKETS
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
        const response = await fetch(ENDPOINTS.TICKETS);
        if (!response.ok) throw new Error("Không thể tải dữ liệu Ticket");

        originalTicketsData = await response.json();
        renderTicketDataToTable(originalTicketsData);

    } catch (e) {
        console.error("Lỗi tải ticket:", e);
        const tbody = document.getElementById("supportTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:20px;">Lỗi kết nối server không thể hiển thị lịch sử!</td></tr>`;
        }
    }
}
// Hàm render dữ liệu lên bảng (Đã xếp Mã Ticket, Mã Tủ, Mã Phiên liền kề nhau)
function renderTicketDataToTable(dataList) {
    const tbody = document.getElementById("supportTable");
    if (!tbody) return;

    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Không tìm thấy dữ liệu ticket phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = dataList.map(t => {
        const ticketId = t.id || 'N/A';
        const reason = t.reason || '---';
        const lockerId = t.locker ? t.locker.id : 'N/A';
        const lockerLocation = t.locker ? (t.locker.location || 'Chưa xác định') : 'N/A';
        const sessionId = t.session ? t.session.id : '<span style="color:#94a3b8;">[null]</span>';

        let timeStr = '---';
        if (t.created_at || t.createdAt) {
            timeStr = new Date(t.created_at || t.createdAt).toLocaleString('vi-VN');
        }

        return `
            <tr>
                <td><strong>${ticketId}</strong></td>
                <td><span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 13px;">${lockerId}</span></td>
                <td style="font-family: monospace; font-weight: bold; color: #1e293b;">${sessionId}</td> <td style="color: #475569; font-weight: 500;">${lockerLocation}</td>
                <td>${timeStr}</td>
                <td style="color:#ef4444; font-weight:500;">${reason}</td>
            </tr>
        `;
    }).join("");
}
function filterTicketTable() {
    const searchKeyword = document.getElementById("ticketSearchInput").value.trim().toUpperCase();

    const filteredResults = originalTicketsData.filter(t => {
        // 1. Lấy mã tủ đồ (Ví dụ: "LK00000001")
        const currentLockerId = t.locker && t.locker.id ? t.locker.id.toUpperCase() : '';

        // 2. Lấy vị trí tủ đồ (Ví dụ: "TẦNG 1 - KHU A")
        const currentLockerLocation = t.locker && t.locker.location ? t.locker.location.toUpperCase() : '';

        // Luồng xử lý kiểm tra: Từ khóa khớp với Vị trí HOẶC khớp với Mã tủ thì đều giữ lại hàng đó
        return currentLockerLocation.includes(searchKeyword) || currentLockerId.includes(searchKeyword);
    });

    // Vẽ lại giao diện bảng sau khi đã lọc bắc cầu thành công
    renderTicketDataToTable(filteredResults);
}

function clearTicketSearch() {
    document.getElementById("ticketSearchInput").value = "";
    renderTicketDataToTable(originalTicketsData);
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lockerId: lockerId, reason: reason })
        });

        if (res.ok) {
            closeTicketModal();
            alert("✅ Đã gửi lệnh mở tủ + lưu ticket thành công!");
            loadLockers();
        } else {
            showErrorDialog("Không thể thực hiện lệnh mở tủ!");
        }
    } catch (e) {
        showErrorDialog("Lỗi kết nối Server!");
    }
}

// ==========================================
// 5. QUẢN LÝ PHIÊN SỬ DỤNG (TRANG users.html)
// ==========================================
async function filterSessions() {
    const lockerId = document.getElementById("sessionSearch").value.trim();
    const status = document.getElementById("statusFilter").value;
    const sortBy = document.getElementById("sortField").value;

    isSearching = (lockerId !== "" || status !== "ALL");

    try {
        const url = `${API}/sessions/search?lockerId=${encodeURIComponent(lockerId)}&status=${status}&sortBy=${sortBy}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderSessionTable(data);
    } catch (e) {
        if (lockerId) showErrorDialog("Lỗi truy xuất dữ liệu!");
    }
}

async function loadSessions() {
    try {
        const response = await fetch(ENDPOINTS.SESSIONS);
        const data = await response.json();
        renderSessionTable(data);
    } catch (e) { console.error("Lỗi tải phiên sử dụng:", e); }
}

// Hàm render bảng - ĐÃ XÓA HOÀN TOÀN CỘT HÀNH ĐỘNG VÀ BUTTON KẾT THÚC
function renderSessionTable(data) {
    const tbody = document.getElementById("sessionTable");
    if (!tbody) return;

    const list = Array.isArray(data) ? data : (data && data.id ? [data] : []);

    // Số lượng cột giảm xuống còn 6 cột sau khi xóa cột Palm Hash
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => {
        const statusColor = s.status === 'ACTIVE' ? '#22c55e' : '#64748b';
        const rawTime = s.start_time || s.startTime;

        let folderSessionId = "";
        if (rawTime) {
            const dateObj = new Date(rawTime);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');
            const ss = String(dateObj.getSeconds()).padStart(2, '0');
            folderSessionId = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
        }

        return `
        <tr>
            <td><strong>${s.id}</strong></td>
            <td>${s.lockerId || 'N/A'}</td>
            <td>${rawTime ? new Date(rawTime).toLocaleString('vi-VN') : '---'}</td>
            <td>${(s.end_time || s.endTime) ? new Date(s.end_time || s.endTime).toLocaleString('vi-VN') : '---'}</td>
            
            <td style="text-align: center; vertical-align: middle; padding: 5px;">
                ${folderSessionId ? `
                    <div id="img-container-${folderSessionId}" style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; background: #e2e8f0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1;">
                        <span style="font-size: 11px; color: #64748b;">⏳</span>
                    </div>
                ` : '---'}
            </td>

            <td>
                <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                    ${s.status}
                </span>
            </td>
        </tr>
    `;
    }).join("");

    // Gọi luồng nạp ảnh ngầm lên từng dòng
    list.forEach(s => {
        const rawTime = s.start_time || s.startTime;
        if (rawTime) {
            const dateObj = new Date(rawTime);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');
            const ss = String(dateObj.getSeconds()).padStart(2, '0');
            const folderSessionId = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

            fetchAndRenderRowImage(folderSessionId);
        }
    });
}
// Hàm quét ảnh chạy ngầm và tạo Popup trưng bày Album (Cách 1)
async function fetchAndRenderRowImage(sessionId) {
    const container = document.getElementById(`img-container-${sessionId}`);
    if (!container) return;

    try {
        const response = await fetch(`http://localhost:8080/sessions/images-by-session?sessionId=${sessionId}`);
        if (!response.ok) throw new Error();

        const imageUrls = await response.json();

        if (imageUrls && imageUrls.length > 0) {
            const allImagesJson = JSON.stringify(imageUrls).replace(/"/g, '&quot;');

            container.innerHTML = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <img src="http://localhost:8080${imageUrls[0]}" 
                         style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
                         title="Xem tất cả ${imageUrls.length} ảnh" 
                         onclick="openImageGalleryPopup('${sessionId}', '${allImagesJson}')">
                    ${imageUrls.length > 1 ? `
                        <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; font-size: 9px; padding: 1px 4px; border-radius: 4px; font-weight: bold; pointer-events: none;">
                            +${imageUrls.length - 1}
                        </span>
                    ` : ''}
                </div>`;
        } else {
            container.innerHTML = `<span style="font-size: 16px;" title="Thư mục trống">🖐️</span>`;
        }
    } catch (error) {
        container.innerHTML = `<span style="font-size: 11px; color: #94a3b8;" title="Không tìm thấy thư mục ảnh">❌</span>`;
    }
}

// Popup hiển thị danh sách toàn bộ hình ảnh trong Session
function openImageGalleryPopup(sessionId, imagesJson) {
    const imageUrls = JSON.parse(imagesJson.replace(/&quot;/g, '"'));

    let overlay = document.createElement("div");
    overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;";
    overlay.id = "gallery-overlay";

    let content = document.createElement("div");
    content.style = "background: white; padding: 20px; border-radius: 12px; max-width: 600px; width: 90%; box-shadow: 0 5px 25px rgba(0,0,0,0.3);";
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e293b;">Danh sách ảnh quét - Session #${sessionId}</h3>
            <button onclick="document.getElementById('gallery-overlay').remove()" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Đóng ×</button>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 15px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding: 5px;">
            ${imageUrls.map(url => `
                <img src="http://localhost:8080${url}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open(this.src, '_blank')">
            `).join("")}
        </div>
    `;

    overlay.appendChild(content);
    overlay.onclick = (e) => { if (e.target.id === "gallery-overlay") overlay.remove(); };
    document.body.appendChild(overlay);
}

function resetSessionFilters() {
    isSearching = false;
    document.getElementById("sessionSearch").value = "";
    document.getElementById("statusFilter").value = "ALL";
    if (document.getElementById("sortField")) document.getElementById("sortField").value = "start_time";
    loadSessions();
}