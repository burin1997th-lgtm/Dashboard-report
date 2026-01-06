// ระบบอัปโหลดไฟล์ CSV และสรุปผลอัตโนมัติ

// ตัวแปรเก็บข้อมูล
let csvData = [];
let csvHeaders = [];
let detectedColumns = {
    zone: null,
    area: null,
    id: null,
    owner: null
};
let summaryData = {};

// ค่าคงที่
const RAI_TO_SQM = 1600; // 1 ไร่ = 1600 ตารางเมตร

// ฟังก์ชันจัดรูปแบบตัวเลข
function formatNumber(num, decimals = 2) {
    return Number(num).toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Browse button
    document.getElementById('browseBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
    
    // File input change
    document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
    
    // Remove file button
    document.getElementById('removeFileBtn').addEventListener('click', removeFile);
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    
    // Export buttons
    document.getElementById('exportSummaryBtn').addEventListener('click', exportSummary);
    document.getElementById('exportFullBtn').addEventListener('click', exportFullData);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    
    // Drag and drop functionality
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Click upload area
    uploadArea.addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
});

// จัดการเมื่อเลือกไฟล์
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// จัดการไฟล์
function handleFile(file) {
    // ตรวจสอบประเภทไฟล์
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('กรุณาเลือกไฟล์ CSV เท่านั้น');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกินไป (ขนาดสูงสุด 10MB)');
        return;
    }
    
    // อ่านไฟล์
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            processCSV(content);
            
            // แสดงข้อมูลไฟล์
            showFileInfo(file);
            
            // แสดงคอลัมน์ที่ตรวจจับได้
            showDetectedColumns();
            
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// ประมวลผลข้อมูล CSV
function processCSV(content) {
    // แยกบรรทัด
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('ไฟล์ CSV ว่างเปล่า');
    }
    
    // หา delimiter
    let delimiter = ',';
    const firstLine = lines[0];
    
    // ตรวจสอบ delimiter
    if (firstLine.includes(';') && !firstLine.includes(',')) {
        delimiter = ';';
    } else if (firstLine.includes('\t')) {
        delimiter = '\t';
    }
    
    // ดึงหัวคอลัมน์
    csvHeaders = firstLine.split(delimiter).map(h => h.trim());
    
    if (csvHeaders.length === 0) {
        throw new Error('ไม่พบหัวคอลัมน์ในไฟล์ CSV');
    }
    
    // ตรวจจับคอลัมน์สำคัญอัตโนมัติ
    detectColumns();
    
    // อ่านข้อมูล
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        if (values.length === csvHeaders.length) {
            const row = {};
            csvHeaders.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            csvData.push(row);
        }
    }
    
    console.log('อัปโหลดไฟล์สำเร็จ:', csvData.length, 'แถว', csvHeaders.length, 'คอลัมน์');
}

// ตรวจจับคอลัมน์สำคัญอัตโนมัติ
function detectColumns() {
    detectedColumns = {
        zone: null,
        area: null,
        id: null,
        owner: null
    };
    
    // คำค้นหาสำหรับแต่ละคอลัมน์
    const searchTerms = {
        zone: ['โซน', 'zone', 'zon', 'พื้นที่', 'ภาค', 'กลุ่ม'],
        area: ['พื้นที่', 'area', 'ขนาด', 'ตร.ม.', 'ไร่', 'sqm', 'ตรม', 'ตร ม'],
        id: ['รหัส', 'id', 'เลขที่', 'แปลง', 'code', 'หมายเลข'],
        owner: ['เจ้าของ', 'owner', 'ชื่อ', 'ผู้ถือ', 'ผู้ครอบครอง']
    };
    
    // ค้นหาคอลัมน์ตามคำค้นหา
    csvHeaders.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        
        // ตรวจสอบคอลัมน์โซน
        if (!detectedColumns.zone && searchTerms.zone.some(term => headerLower.includes(term))) {
            detectedColumns.zone = header;
        }
        
        // ตรวจสอบคอลัมน์พื้นที่
        if (!detectedColumns.area && searchTerms.area.some(term => headerLower.includes(term))) {
            detectedColumns.area = header;
        }
        
        // ตรวจสอบคอลัมน์รหัส
        if (!detectedColumns.id && searchTerms.id.some(term => headerLower.includes(term))) {
            detectedColumns.id = header;
        }
        
        // ตรวจสอบคอลัมน์เจ้าของ
        if (!detectedColumns.owner && searchTerms.owner.some(term => headerLower.includes(term))) {
            detectedColumns.owner = header;
        }
    });
    
    // ถ้าตรวจจับคอลัมน์โซนหรือพื้นที่ไม่เจอ ใช้คอลัมน์แรก/สอง
    if (!detectedColumns.zone && csvHeaders.length > 0) {
        detectedColumns.zone = csvHeaders[0];
    }
    
    if (!detectedColumns.area && csvHeaders.length > 1) {
        detectedColumns.area = csvHeaders[1];
    }
}

// แสดงข้อมูลไฟล์
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileDetails = document.getElementById('fileDetails');
    
    fileName.textContent = file.name;
    fileDetails.textContent = `ขนาด: ${formatFileSize(file.size)} | แถว: ${csvData.length} | คอลัมน์: ${csvHeaders.length}`;
    
    fileInfo.style.display = 'block';
}

// แสดงคอลัมน์ที่ตรวจจับได้
function showDetectedColumns() {
    const container = document.getElementById('autoDetectedColumns');
    const columnSelector = document.getElementById('columnSelector');
    
    container.innerHTML = '';
    
    // เพิ่มคอลัมน์ที่ตรวจจับได้
    Object.keys(detectedColumns).forEach(key => {
        if (detectedColumns[key]) {
            const columnName = detectedColumns[key];
            const columnLabel = getColumnLabel(key);
            
            const div = document.createElement('div');
            div.className = 'column-item';
            div.innerHTML = `
                <div>
                    <strong>${columnLabel}</strong><br>
                    <small class="text-muted">ใช้คอลัมน์: ${columnName}</small>
                </div>
                <span class="badge bg-success">ตรวจจับอัตโนมัติ</span>
            `;
            container.appendChild(div);
        }
    });
    
    columnSelector.style.display = 'block';
}

// ดึงชื่อแสดงของคอลัมน์
function getColumnLabel(key) {
    const labels = {
        zone: 'คอลัมน์โซน',
        area: 'คอลัมน์พื้นที่',
        id: 'คอลัมน์รหัส',
        owner: 'คอลัมน์เจ้าของ'
    };
    return labels[key] || key;
}

// สรุปผลอัตโนมัติ
function generateReport() {
    if (csvData.length === 0) {
        alert('กรุณาอัปโหลดไฟล์ CSV ก่อน');
        return;
    }
    
    // ตรวจสอบว่ามีคอลัมน์โซนและพื้นที่หรือไม่
    if (!detectedColumns.zone || !detectedColumns.area) {
        alert('ระบบไม่สามารถตรวจจับคอลัมน์โซนหรือพื้นที่ได้ กรุณาตรวจสอบไฟล์ CSV ของคุณ');
        return;
    }
    
    // คำนวณสรุปผล
    calculateSummary();
    
    // แสดงผลลัพธ์
    displayResults();
    
    // แสดงตัวอย่างข้อมูล
    displayDataPreview();
    
    // แสดงส่วนผลลัพธ์
    document.getElementById('resultsSection').style.display = 'block';
    
    // เลื่อนไปยังผลลัพธ์
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    
    // แสดงข้อความสำเร็จ
    showMessage('สรุปผลเรียบร้อยแล้ว!', 'success');
}

// คำนวณสรุปผล
function calculateSummary() {
    summaryData = {
        zones: {},
        totalAreaSqm: 0,
        totalAreaRai: 0,
        totalRows: csvData.length,
        uniqueZones: new Set()
    };
    
    csvData.forEach(row => {
        const zone = row[detectedColumns.zone] || 'ไม่ระบุโซน';
        let areaValue = parseFloat(row[detectedColumns.area]) || 0;
        
        // ตรวจสอบหน่วยของพื้นที่ (ตร.ม. หรือ ไร่)
        // ถ้าค่าพื้นที่น้อยกว่า 1000 มักจะเป็นไร่
        let areaSqm, areaRai;
        if (areaValue < 1000) {
            // สมมติว่าเป็นไร่
            areaRai = areaValue;
            areaSqm = areaRai * RAI_TO_SQM;
        } else {
            // สมมติว่าเป็นตารางเมตร
            areaSqm = areaValue;
            areaRai = areaSqm / RAI_TO_SQM;
        }
        
        // เพิ่มข้อมูลโซน
        if (!summaryData.zones[zone]) {
            summaryData.zones[zone] = {
                count: 0,
                areaSqm: 0,
                areaRai: 0
            };
        }
        
        summaryData.zones[zone].count++;
        summaryData.zones[zone].areaSqm += areaSqm;
        summaryData.zones[zone].areaRai += areaRai;
        
        // อัพเดทผลรวม
        summaryData.totalAreaSqm += areaSqm;
        summaryData.totalAreaRai += areaRai;
        summaryData.uniqueZones.add(zone);
    });
}

// แสดงผลลัพธ์
function displayResults() {
    // อัพเดทสถิติ
    document.getElementById('totalRows').textContent = summaryData.totalRows.toLocaleString();
    document.getElementById('totalZones').textContent = summaryData.uniqueZones.size;
    document.getElementById('totalAreaRai').textContent = formatNumber(summaryData.totalAreaRai, 2);
    document.getElementById('totalAreaSqm').textContent = formatNumber(summaryData.totalAreaSqm, 0);
    
    // แสดงตารางสรุปตามโซน
    displayZoneSummary();
}

// แสดงสรุปตามโซน
function displayZoneSummary() {
    const tbody = document.getElementById('zoneSummaryTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    // เรียงลำดับโซนตามพื้นที่ (มากไปน้อย)
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].areaRai - summaryData.zones[a].areaRai;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalAreaRai > 0 ? 
            (data.areaRai / summaryData.totalAreaRai) * 100 : 0;
        
        const tr = document.createElement('tr');
        
        // สีของโซน
        const zoneColors = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'];
        const zoneColor = zoneColors[sortedZones.indexOf(zone) % zoneColors.length];
        
        tr.innerHTML = `
            <td>
                <span class="badge bg-${zoneColor} zone-badge">${zone}</span>
            </td>
            <td>${data.count}</td>
            <td>${formatNumber(data.areaRai, 3)}</td>
            <td>${formatNumber(data.areaSqm, 0)}</td>
            <td>
                <div class="progress-custom">
                    <div class="progress-bar-custom" style="width: ${percentage}%"></div>
                </div>
            </td>
            <td><strong>${formatNumber(percentage, 1)}%</strong></td>
        `;
        
        tbody.appendChild(tr);
    });
}

// แสดงตัวอย่างข้อมูล
function displayDataPreview() {
    const thead = document.getElementById('dataPreviewTable').querySelector('thead');
    const tbody = document.getElementById('dataPreviewTable').querySelector('tbody');
    
    // เคลียร์ข้อมูลเดิม
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // สร้าง header
    const headerRow = document.createElement('tr');
    csvHeaders.forEach(header => {
        // ตรวจสอบว่าเป็นคอลัมน์สำคัญหรือไม่
        let isImportant = Object.values(detectedColumns).includes(header);
        let headerClass = isImportant ? 'table-primary' : '';
        
        const th = document.createElement('th');
        th.className = headerClass;
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // แสดง 20 แถวแรก (หรือน้อยกว่านั้นถ้ามีไม่ถึง)
    const displayRows = Math.min(csvData.length, 20);
    
    for (let i = 0; i < displayRows; i++) {
        const row = csvData[i];
        const tr = document.createElement('tr');
        
        csvHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            
            // เน้นคอลัมน์สำคัญ
            if (Object.values(detectedColumns).includes(header)) {
                td.className = 'fw-bold';
                
                if (header === detectedColumns.zone) {
                    td.classList.add('text-primary');
                } else if (header === detectedColumns.area) {
                    td.classList.add('text-success');
                }
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    }
    
    // เพิ่มแถวสรุปถ้ามีข้อมูลมากกว่า 20 แถว
    if (csvData.length > 20) {
        const summaryRow = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = csvHeaders.length;
        td.className = 'text-center text-muted fst-italic';
        td.textContent = `... และอีก ${csvData.length - 20} แถว (ทั้งหมด ${csvData.length} แถว)`;
        summaryRow.appendChild(td);
        tbody.appendChild(summaryRow);
    }
}

// ส่งออกสรุปผล
function exportSummary() {
    if (!summaryData.zones || Object.keys(summaryData.zones).length === 0) {
        alert('ยังไม่มีข้อมูลสรุปผล');
        return;
    }
    
    let csvContent = "รายงานสรุปผลตามโซน\n\n";
    csvContent += "โซน,จำนวนข้อมูล,พื้นที่รวม (ไร่),พื้นที่รวม (ตร.ม.),ร้อยละ\n";
    
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].areaRai - summaryData.zones[a].areaRai;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalAreaRai > 0 ? 
            (data.areaRai / summaryData.totalAreaRai) * 100 : 0;
        
        csvContent += `${zone},${data.count},${data.areaRai.toFixed(3)},${data.areaSqm.toFixed(0)},${percentage.toFixed(2)}%\n`;
    });
    
    csvContent += `\nสรุปทั้งหมด\n`;
    csvContent += `จำนวนข้อมูลทั้งหมด,${summaryData.totalRows}\n`;
    csvContent += `จำนวนโซนทั้งหมด,${summaryData.uniqueZones.size}\n`;
    csvContent += `พื้นที่รวมทั้งหมด (ไร่),${summaryData.totalAreaRai.toFixed(2)}\n`;
    csvContent += `พื้นที่รวมทั้งหมด (ตร.ม.),${summaryData.totalAreaSqm.toFixed(0)}\n`;
    
    downloadCSV(csvContent, 'สรุปผลตามโซน.csv');
}

// ส่งออกข้อมูลทั้งหมด
function exportFullData() {
    if (csvData.length === 0) {
        alert('ยังไม่มีข้อมูล');
        return;
    }
    
    let csvContent = csvHeaders.join(',') + '\n';
    
    csvData.forEach(row => {
        const rowValues = csvHeaders.map(header => row[header] || '');
        csvContent += rowValues.join(',') + '\n';
    });
    
    downloadCSV(csvContent, 'ข้อมูลทั้งหมด.csv');
}

// ดาวน์โหลดไฟล์ CSV
function downloadCSV(content, filename) {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// พิมพ์รายงาน
function printReport() {
    if (!summaryData.zones || Object.keys(summaryData.zones).length === 0) {
        alert('ยังไม่มีข้อมูลรายงาน');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const now = new Date();
    const printDate = now.toLocaleDateString('th-TH');
    const printTime = now.toLocaleTimeString('th-TH');
    
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>รายงานสรุปผลตามโซน</title>
            <style>
                body { font-family: 'Sarabun', sans-serif; margin: 20px; }
                h1 { color: #2c786c; border-bottom: 2px solid #2c786c; padding-bottom: 10px; }
                h2 { color: #004445; margin-top: 25px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th { background-color: #2c786c; color: white; padding: 10px; text-align: left; }
                td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .summary-box { background-color: #e9f5f3; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.9em; }
                @media print {
                    body { margin: 0; padding: 15px; }
                    h1 { font-size: 24px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>รายงานสรุปผลตามโซน</h1>
            <p><strong>วันที่สร้างรายงาน:</strong> ${printDate} ${printTime}</p>
            <p><strong>ไฟล์ต้นฉบับ:</strong> <span id="originalFileName">${document.getElementById('fileName').textContent}</span></p>
            
            <div class="summary-box">
                <h3>สรุปภาพรวม</h3>
                <p><strong>จำนวนข้อมูลทั้งหมด:</strong> ${summaryData.totalRows} แถว</p>
                <p><strong>จำนวนโซน:</strong> ${summaryData.uniqueZones.size} โซน</p>
                <p><strong>พื้นที่รวมทั้งหมด:</strong> ${formatNumber(summaryData.totalAreaRai, 3)} ไร่ (${formatNumber(summaryData.totalAreaSqm, 0)} ตร.ม.)</p>
                <p><strong>คอลัมน์ที่ใช้สรุปผล:</strong> โซน: "${detectedColumns.zone}", พื้นที่: "${detectedColumns.area}"</p>
            </div>
            
            <h2>สรุปตามโซน</h2>
            <table>
                <tr>
                    <th>โซน</th>
                    <th>จำนวนข้อมูล</th>
                    <th>พื้นที่รวม (ไร่)</th>
                    <th>พื้นที่รวม (ตร.ม.)</th>
                    <th>ร้อยละ</th>
                </tr>
    `;
    
    // เรียงลำดับโซนตามพื้นที่
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].areaRai - summaryData.zones[a].areaRai;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalAreaRai > 0 ? 
            (data.areaRai / summaryData.totalAreaRai) * 100 : 0;
        
        printContent += `
            <tr>
                <td>${zone}</td>
                <td>${data.count}</td>
                <td>${formatNumber(data.areaRai, 3)}</td>
                <td>${formatNumber(data.areaSqm, 0)}</td>
                <td>${formatNumber(percentage, 1)}%</td>
            </tr>
        `;
    });
    
    printContent += `
            </table>
            
            <div class="footer">
                <p>ระบบอัปโหลด CSV และสรุปผลอัตโนมัติ | 1 ไร่ = 1600 ตารางเมตร</p>
                <p>รายงานนี้สร้างขึ้นอัตโนมัติจากไฟล์ CSV</p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #2c786c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    พิมพ์รายงาน
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    ปิดหน้าต่าง
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ลบไฟล์
function removeFile() {
    csvData = [];
    csvHeaders = [];
    detectedColumns = {
        zone: null,
        area: null,
        id: null,
        owner: null
    };
    
    document.getElementById('csvFileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('columnSelector').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    showMessage('ลบไฟล์เรียบร้อยแล้ว', 'info');
}

// แสดงข้อความ
function showMessage(message, type = 'info') {
    // สร้าง alert element
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // แทรก alert ด้านบนของ container
    const container = document.querySelector('.container');
    container.insertAdjacentHTML('afterbegin', alertHtml);
    
    // อัตโนมัติปิดหลังจาก 5 วินาที
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

// จัดรูปแบบขนาดไฟล์
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// เริ่มต้นระบบ
console.log('ระบบอัปโหลด CSV และสรุปผลอัตโนมัติ พร้อมใช้งาน');
