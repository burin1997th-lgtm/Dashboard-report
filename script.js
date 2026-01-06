// ตัวแปร global
let currentFile = null;
let fileData = null;

// DOM Elements
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const fileInfoSection = document.getElementById('file-info-section');
const nextStepsSection = document.getElementById('next-steps-section');
const fileName = document.getElementById('file-name');
const columnCount = document.getElementById('column-count');
const rowCount = document.getElementById('row-count');
const fileSize = document.getElementById('file-size');
const actionCards = document.querySelectorAll('.action-card');
const actionButtons = document.querySelectorAll('.action-buttons .btn');
const previewModal = document.getElementById('preview-modal');
const previewTableContainer = document.getElementById('preview-table-container');
const closeModalButtons = document.querySelectorAll('.close-modal');

// ฟังก์ชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // ตั้งค่าการจัดการอัปโหลดไฟล์
    setupFileUpload();
    
    // ตั้งค่าปุ่มดำเนินการ
    setupActionButtons();
    
    // ตั้งค่า modal
    setupModal();
    
    // ตรวจสอบว่ามีไฟล์ที่อัปโหลดแล้วใน localStorage หรือไม่
    checkForExistingFile();
});

// ตั้งค่าการจัดการอัปโหลดไฟล์
function setupFileUpload() {
    // การคลิกที่พื้นที่อัปโหลด
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // การเลือกไฟล์จาก input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

// จัดการการเลือกไฟล์
function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
}

// จัดการไฟล์ที่อัปโหลด
function handleFile(file) {
    // ตรวจสอบประเภทไฟล์
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('กรุณาเลือกไฟล์ CSV เท่านั้น');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
    }
    
    // อัปเดตข้อมูลไฟล์
    currentFile = file;
    
    // แสดงข้อมูลไฟล์
    displayFileInfo(file);
    
    // อ่านและประมวลผลไฟล์ CSV
    readCSVFile(file);
}

// แสดงข้อมูลไฟล์
function displayFileInfo(file) {
    // แสดงส่วนข้อมูลไฟล์และขั้นตอนต่อไป
    fileInfoSection.classList.remove('hidden');
    nextStepsSection.classList.remove('hidden');
    
    // อัปเดตข้อมูลไฟล์
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / (1024 * 1024)).toFixed(2);
    
    // เพิ่มเอฟเฟกต์การแสดงผล
    fileInfoSection.style.opacity = '0';
    nextStepsSection.style.opacity = '0';
    
    setTimeout(() => {
        fileInfoSection.style.transition = 'opacity 0.5s';
        nextStepsSection.style.transition = 'opacity 0.5s';
        fileInfoSection.style.opacity = '1';
        nextStepsSection.style.opacity = '1';
    }, 100);
    
    // บันทึกข้อมูลไฟล์ใน localStorage
    localStorage.setItem('lastUploadedFile', JSON.stringify({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
    }));
}

// อ่านไฟล์ CSV
function readCSVFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        processCSVData(text);
    };
    
    reader.readAsText(file, 'UTF-8');
}

// ประมวลผลข้อมูล CSV
function processCSVData(text) {
    try {
        // แยกข้อมูลเป็นแถว
        const rows = text.split('\n');
        
        // นับจำนวนแถวและคอลัมน์
        const rowCountValue = rows.length - 1; // ลบหัวตาราง
        let columnCountValue = 0;
        
        if (rows.length > 0) {
            const firstRow = rows[0];
            columnCountValue = firstRow.split(',').length;
        }
        
        // อัปเดตตัวนับ
        rowCount.textContent = rowCountValue.toLocaleString();
        columnCount.textContent = columnCountValue;
        
        // เก็บข้อมูลสำหรับใช้ต่อไป
        fileData = {
            rows: rows,
            rowCount: rowCountValue,
            columnCount: columnCountValue,
            headers: rows.length > 0 ? rows[0].split(',') : []
        };
        
        // แสดงข้อความสำเร็จ
        showNotification('อัปโหลดและประมวลผลไฟล์สำเร็จ', 'success');
        
    } catch (error) {
        console.error('Error processing CSV:', error);
        showNotification('เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV', 'error');
    }
}

// ตั้งค่าปุ่มดำเนินการ
function setupActionButtons() {
    // การ์ดดำเนินการ
    actionCards.forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            handleAction(action);
        });
    });
    
    // ปุ่มดำเนินการ
    document.getElementById('preview-btn').addEventListener('click', () => handleAction('preview'));
    document.getElementById('analyze-btn').addEventListener('click', () => handleAction('analyze'));
    document.getElementById('graph-btn').addEventListener('click', () => handleAction('graph'));
    document.getElementById('download-btn').addEventListener('click', () => handleAction('download'));
    document.getElementById('delete-btn').addEventListener('click', () => handleAction('delete'));
}

// จัดการการดำเนินการ
function handleAction(action) {
    switch(action) {
        case 'preview':
            showPreview();
            break;
        case 'analyze':
            analyzeData();
            break;
        case 'graph':
            createGraph();
            break;
        case 'download':
            downloadData();
            break;
        case 'delete':
            deleteFile();
            break;
    }
}

// แสดงตัวอย่างข้อมูล
function showPreview() {
    if (!fileData || !fileData.rows) {
        showNotification('ไม่พบข้อมูลไฟล์', 'error');
        return;
    }
    
    // ล้างตารางเก่า
    previewTableContainer.innerHTML = '';
    
    // สร้างตาราง
    const table = document.createElement('table');
    
    // เพิ่มหัวตาราง
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    fileData.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.trim();
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // เพิ่มข้อมูล (10 แถวแรก)
    const tbody = document.createElement('tbody');
    const maxRows = Math.min(11, fileData.rows.length);
    
    for (let i = 1; i < maxRows; i++) {
        const row = document.createElement('tr');
        const cells = fileData.rows[i].split(',');
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell.trim();
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    previewTableContainer.appendChild(table);
    
    // แสดง modal
    previewModal.classList.remove('hidden');
}

// วิเคราะห์ข้อมูล
function analyzeData() {
    if (!fileData) {
        showNotification('ไม่พบข้อมูลไฟล์', 'error');
        return;
    }
    
    // ในเวอร์ชันจริง ควรมีโค้ดสำหรับวิเคราะห์ข้อมูลจริง
    showNotification('กำลังวิเคราะห์ข้อมูล... ฟังก์ชันนี้อยู่ในระหว่างการพัฒนา', 'info');
    
    // ตัวอย่างการวิเคราะห์เบื้องต้น
    setTimeout(() => {
        const analysisResult = `
            <div class="analysis-summary">
                <h4>สรุปการวิเคราะห์ข้อมูล</h4>
                <p>✅ ไฟล์มี ${fileData.rowCount.toLocaleString()} แถว และ ${fileData.columnCount} คอลัมน์</p>
                <p>✅ ไม่พบข้อมูลที่ขาดหาย (Missing Values)</p>
                <p>✅ ไม่พบข้อมูลซ้ำ (Duplicates)</p>
                <p>📊 ระบบพร้อมสำหรับการสร้างรายงานและการวิเคราะห์เพิ่มเติม</p>
            </div>
        `;
        
        // แสดงผลการวิเคราะห์ใน modal
        previewTableContainer.innerHTML = analysisResult;
        previewModal.classList.remove('hidden');
        
        // อัปเดตหัวข้อ modal
        document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-chart-bar"></i> ผลการวิเคราะห์ข้อมูล';
    }, 1000);
}

// สร้างกราฟ
function createGraph() {
    if (!fileData) {
        showNotification('ไม่พบข้อมูลไฟล์', 'error');
        return;
    }
    
    showNotification('กำลังเตรียมสร้างกราฟ... ฟังก์ชันนี้อยู่ในระหว่างการพัฒนา', 'info');
    
    // ตัวอย่างกราฟ
    setTimeout(() => {
        const graphHTML = `
            <div class="graph-placeholder">
                <h4>ตัวอย่างกราฟจากข้อมูล</h4>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="background: #f0f0f0; height: 300px; display: flex; align-items: flex-end; justify-content: space-around; padding: 20px; border-radius: 8px;">
                        <div style="background: #3498db; width: 40px; height: 200px;" title="คอลัมน์ 1"></div>
                        <div style="background: #2ecc71; width: 40px; height: 150px;" title="คอลัมน์ 2"></div>
                        <div style="background: #e74c3c; width: 40px; height: 180px;" title="คอลัมน์ 3"></div>
                        <div style="background: #f39c12; width: 40px; height: 120px;" title="คอลัมน์ 4"></div>
                    </div>
                    <p style="margin-top: 15px; color: #7f8c8d;">กราฟแท่งแสดงข้อมูลตัวอย่างจาก 4 คอลัมน์แรก</p>
                </div>
                <p>ในเวอร์ชันเต็ม คุณจะสามารถเลือกคอลัมน์ที่ต้องการและประเภทของกราฟได้</p>
            </div>
        `;
        
        previewTableContainer.innerHTML = graphHTML;
        previewModal.classList.remove('hidden');
        
        // อัปเดตหัวข้อ modal
        document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-chart-line"></i> ตัวอย่างกราฟ';
    }, 1000);
}

// ดาวน์โหลดข้อมูล
function downloadData() {
    if (!currentFile) {
        showNotification('ไม่พบไฟล์สำหรับดาวน์โหลด', 'error');
        return;
    }
    
    // ในเวอร์ชันจริง ควรมีโค้ดสำหรับการประมวลผลและดาวน์โหลดไฟล์จริง
    showNotification('กำลังเตรียมไฟล์สำหรับดาวน์โหลด...', 'info');
    
    setTimeout(() => {
        // สร้างลิงก์ดาวน์โหลดจำลอง
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(currentFile);
        downloadLink.download = `processed_${currentFile.name}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showNotification('ดาวน์โหลดไฟล์สำเร็จ', 'success');
    }, 1500);
}

// ลบไฟล์
function deleteFile() {
    if (confirm('คุณแน่ใจว่าต้องการลบไฟล์นี้ออกจากระบบ?')) {
        // รีเซ็ตข้อมูลไฟล์
        currentFile = null;
        fileData = null;
        
        // ซ่อนส่วนข้อมูลไฟล์และขั้นตอนต่อไป
        fileInfoSection.classList.add('hidden');
        nextStepsSection.classList.add('hidden');
        
        // รีเซ็ต input file
        fileInput.value = '';
        
        // ลบข้อมูลจาก localStorage
        localStorage.removeItem('lastUploadedFile');
        
        showNotification('ลบไฟล์ออกจากระบบสำเร็จ', 'success');
    }
}

// ตั้งค่า modal
function setupModal() {
    // ปิด modal เมื่อคลิกปุ่มปิด
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            previewModal.classList.add('hidden');
        });
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.add('hidden');
        }
    });
}

// ตรวจสอบไฟล์ที่มีอยู่
function checkForExistingFile() {
    const savedFile = localStorage.getItem('lastUploadedFile');
    
    if (savedFile) {
        try {
            const fileInfo = JSON.parse(savedFile);
            
            // สร้างไฟล์จำลองจากข้อมูลที่บันทึกไว้
            const mockFile = {
                name: fileInfo.name,
                size: fileInfo.size,
                lastModified: fileInfo.lastModified
            };
            
            // แสดงข้อมูลไฟล์
            displayFileInfo(mockFile);
            
            // แจ้งผู้ใช้
            showNotification('พบไฟล์ที่อัปโหลดล่าสุด โปรดอัปโหลดไฟล์ใหม่เพื่อประมวลผลข้อมูล', 'info');
            
        } catch (error) {
            console.error('Error loading saved file:', error);
        }
    }
}

// แสดงการแจ้งเตือน
function showNotification(message, type = 'info') {
    // ลบการแจ้งเตือนเก่าหากมี
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // สร้างการแจ้งเตือนใหม่
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // เลือกไอคอนตามประเภท
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // เพิ่มสไตล์
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // เพิ่ม keyframe animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // ลบการแจ้งเตือนหลังจาก 5 วินาที
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// เพิ่มสไตล์สำหรับ notification
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyle);
