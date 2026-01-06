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
    console.log("ระบบเริ่มทำงานแล้ว");
    
    // Browse button
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            console.log("คลิกปุ่มเลือกไฟล์");
            document.getElementById('csvFileInput').click();
        });
    } else {
        console.error("ไม่พบปุ่ม browseBtn");
    }
    
    // File input change
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    } else {
        console.error("ไม่พบ input file");
    }
    
    // Remove file button
    const removeBtn = document.getElementById('removeFileBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeFile);
    }
    
    // Generate report button
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateReport);
    }
    
    // Export buttons
    const exportSummaryBtn = document.getElementById('exportSummaryBtn');
    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener('click', exportSummary);
    }
    
    const exportFullBtn = document.getElementById('exportFullBtn');
    if (exportFullBtn) {
        exportFullBtn.addEventListener('click', exportFullData);
    }
    
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    // Drag and drop functionality
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
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
    }
    
    console.log("Event listeners ทั้งหมดถูกตั้งค่าเรียบร้อย");
});

// จัดการเมื่อเลือกไฟล์
function handleFileSelect(e) {
    console.log("handleFileSelect ถูกเรียก");
    const file = e.target.files[0];
    if (file) {
        console.log("ไฟล์ที่เลือก:", file.name);
        handleFile(file);
    } else {
        console.log("ไม่มีไฟล์ถูกเลือก");
    }
}

// จัดการไฟล์
function handleFile(file) {
    console.log("เริ่มจัดการไฟล์:", file.name);
    
    // ตรวจสอบประเภทไฟล์
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('กรุณาเลือกไฟล์ CSV เท่านั้น (.csv)', 'danger');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('ไฟล์มีขนาดใหญ่เกินไป (ขนาดสูงสุด 10MB)', 'danger');
        return;
    }
    
    // แสดง loading
    showLoading(true);
    
    // อ่านไฟล์
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log("อ่านไฟล์สำเร็จ ขนาด:", content.length, "ตัวอักษร");
            processCSV(content);
            
            // แสดงข้อมูลไฟล์
            showFileInfo(file);
            
            // แสดงคอลัมน์ที่ตรวจจับได้
            showDetectedColumns();
            
            // ซ่อน loading
            showLoading(false);
            
            showMessage('อัปโหลดไฟล์สำเร็จ!', 'success');
            
        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
            showLoading(false);
            showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message, 'danger');
        }
    };
    
    reader.onerror = function() {
        console.error("ข้อผิดพลาดในการอ่านไฟล์");
        showLoading(false);
        showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์', 'danger');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// ประมวลผลข้อมูล CSV
function processCSV(content) {
    console.log("เริ่มประมวลผล CSV");
    
    // แยกบรรทัด
    const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');
    console.log("พบ", lines.length, "บรรทัด");
    
    if (lines.length === 0) {
        throw new Error('ไฟล์ CSV ว่างเปล่า');
    }
    
    // หา delimiter
    let delimiter = ',';
    const firstLine = lines[0];
    
    // ตรวจสอบ delimiter
    if (firstLine.includes(';') && !firstLine.includes(',')) {
        delimiter = ';';
        console.log("ใช้ delimiter: ;");
    } else if (firstLine.includes('\t')) {
        delimiter = '\t';
        console.log("ใช้ delimiter: \\t (แท็บ)");
    } else {
        console.log("ใช้ delimiter: ,");
    }
    
    // ดึงหัวคอลัมน์
    csvHeaders = firstLine.split(delimiter).map(h => h.trim());
    console.log("หัวคอลัมน์:", csvHeaders);
    
    if (csvHeaders.length === 0) {
        throw new Error('ไม่พบหัวคอลัมน์ในไฟล์ CSV');
    }
    
    // ตรวจจับคอลัมน์สำคัญอัตโนมัติ
    detectColumns();
    
    // อ่านข้อมูล
    csvData = [];
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        try {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length === csvHeaders.length) {
                const row = {};
                csvHeaders.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                csvData.push(row);
            } else {
                console.warn(`บรรทัดที่ ${i+1}: จำนวนคอลัมน์ไม่ตรงกับหัวตาราง (${values.length} != ${csvHeaders.length})`);
                errorCount++;
            }
        } catch (error) {
            console.error(`ข้อผิดพลาดที่บรรทัดที่ ${i+1}:`, error);
            errorCount++;
        }
    }
    
    console.log('อัปโหลดไฟล์สำเร็จ:', csvData.length, 'แถว,', csvHeaders.length, 'คอลัมน์, ข้อผิดพลาด:', errorCount);
    
    if (errorCount > 0) {
        showMessage(`อัปโหลดสำเร็จ但有 ${errorCount} บรรทัดมีปัญหา`, 'warning');
    }
}

// ตรวจจับคอลัมน์สำคัญอัตโนมัติ
function detectColumns() {
    console.log("เริ่มตรวจจับคอลัมน์อัตโนมัติ");
    
    detectedColumns = {
        zone: null,
        area: null,
        id: null,
        owner: null
    };
    
    // คำค้นหาสำหรับแต่ละคอลัมน์
    const searchTerms = {
        zone: ['โซน', 'zone', 'zon', 'ภาค', 'กลุ่ม', 'พื้นที่'],
        area: ['พื้นที่', 'area', 'ขนาด', 'ตร.ม.', 'ไร่', 'sqm', 'ตรม', 'ตร ม', 'ตร m'],
        id: ['รหัส', 'id', 'เลขที่', 'แปลง', 'code', 'หมายเลข', 'ลำดับ'],
        owner: ['เจ้าของ', 'owner', 'ชื่อ', 'ผู้ถือ', 'ผู้ครอบครอง', 'ผู้ดูแล']
    };
    
    // ค้นหาคอลัมน์ตามคำค้นหา
    csvHeaders.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        
        // ตรวจสอบคอลัมน์โซน
        if (!detectedColumns.zone && searchTerms.zone.some(term => headerLower.includes(term))) {
            detectedColumns.zone = header;
            console.log("ตรวจจับคอลัมน์โซน:", header);
        }
        
        // ตรวจสอบคอลัมน์พื้นที่
        if (!detectedColumns.area && searchTerms.area.some(term => headerLower.includes(term))) {
            detectedColumns.area = header;
            console.log("ตรวจจับคอลัมน์พื้นที่:", header);
        }
        
        // ตรวจสอบคอลัมน์รหัส
        if (!detectedColumns.id && searchTerms.id.some(term => headerLower.includes(term))) {
            detectedColumns.id = header;
            console.log("ตรวจจับคอลัมน์รหัส:", header);
        }
        
        // ตรวจสอบคอลัมน์เจ้าของ
        if (!detectedColumns.owner && searchTerms.owner.some(term => headerLower.includes(term))) {
            detectedColumns.owner = header;
            console.log("ตรวจจับคอลัมน์เจ้าของ:", header);
        }
    });
    
    // ถ้าตรวจจับคอลัมน์โซนหรือพื้นที่ไม่เจอ ใช้คอลัมน์แรก/สอง
    if (!detectedColumns.zone && csvHeaders.length > 0) {
        detectedColumns.zone = csvHeaders[0];
        console.log("ใช้คอลัมน์แรกเป็นโซน:", csvHeaders[0]);
    }
    
    if (!detectedColumns.area && csvHeaders.length > 1) {
        detectedColumns.area = csvHeaders[1];
        console.log("ใช้คอลัมน์ที่สองเป็นพื้นที่:", csvHeaders[1]);
    }
    
    console.log("ผลการตรวจจับคอลัมน์:", detectedColumns);
}

// แสดงข้อมูลไฟล์
function showFileInfo(file) {
    console.log("แสดงข้อมูลไฟล์");
    
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileDetails = document.getElementById('fileDetails');
    
    if (fileInfo && fileName && fileDetails) {
        fileName.textContent = file.name;
        fileDetails.textContent = `ขนาด: ${formatFileSize(file.size)} | แถว: ${csvData.length} | คอลัมน์: ${csvHeaders.length}`;
        
        fileInfo.style.display = 'block';
    }
}

// แสดงคอลัมน์ที่ตรวจจับได้
function showDetectedColumns() {
    console.log("แสดงคอลัมน์ที่ตรวจจับได้");
    
    const container = document.getElementById('autoDetectedColumns');
    const columnSelector = document.getElementById('columnSelector');
    
    if (!container || !columnSelector) {
        console.error("ไม่พบ container สำหรับแสดงคอลัมน์");
        return;
    }
    
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
                    <strong style="color: var(--text-dark);">${columnLabel}</strong><br>
                    <small class="text-muted">ใช้คอลัมน์: <code>${columnName}</code></small>
                </div>
                <span class="badge bg-success" style="background: linear-gradient(135deg, var(--success-green) 0%, #58D68D 100%)!important;">ตรวจจับอัตโนมัติ</span>
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
    console.log("เริ่มสร้างรายงานสรุปผล");
    
    if (csvData.length === 0) {
        showMessage('กรุณาอัปโหลดไฟล์ CSV ก่อน', 'warning');
        return;
    }
    
    // ตรวจสอบว่ามีคอลัมน์โซนและพื้นที่หรือไม่
    if (!detectedColumns.zone || !detectedColumns.area) {
        showMessage('ระบบไม่สามารถตรวจจับคอลัมน์โซนหรือพื้นที่ได้ กรุณาตรวจสอบไฟล์ CSV ของคุณ', 'danger');
        return;
    }
    
    // แสดง loading
    showLoading(true);
    
    // หน่วงเวลาเล็กน้อยเพื่อให้เห็น animation
    setTimeout(() => {
        try {
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
            
            // ซ่อน loading
            showLoading(false);
            
            showMessage('สรุปผลเรียบร้อยแล้ว!', 'success');
            
        } catch (error) {
            console.error("ข้อผิดพลาดในการสรุปผล:", error);
            showLoading(false);
            showMessage('เกิดข้อผิดพลาดในการสรุปผล: ' + error.message, 'danger');
        }
    }, 500);
}

// คำนวณสรุปผล
function calculateSummary() {
    console.log("เริ่มคำนวณสรุปผล");
    
    summaryData = {
        zones: {},
        totalAreaSqm: 0,
        totalAreaRai: 0,
        totalRows: csvData.length,
        uniqueZones: new Set()
    };
    
    let rowCount = 0;
    csvData.forEach(row => {
        try {
            const zone = row[detectedColumns.zone] || 'ไม่ระบุโซน';
            let areaValue = parseFloat(row[detectedColumns.area]) || 0;
            
            // ตรวจสอบหน่วยของพื้นที่ (ตร.ม. หรือ ไร่)
            let areaSqm, areaRai;
            if (areaValue < 1000 && areaValue > 0) {
                // สมมติว่าเป็นไร่ ถ้าค่าน้อยกว่า 1000
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
            
            rowCount++;
        } catch (error) {
            console.warn("ข้อผิดพลาดในการคำนวณแถวที่", rowCount, error);
        }
    });
    
    console.log("คำนวณสรุปผลเสร็จสิ้น:", summaryData);
}

// แสดงผลลัพธ์
function displayResults() {
    console.log("แสดงผลลัพธ์");
    
    // อัพเดทสถิติ
    const totalRowsElem = document.getElementById('totalRows');
    const totalZonesElem = document.getElementById('totalZones');
    const totalAreaRaiElem = document.getElementById('totalAreaRai');
    const totalAreaSqmElem = document.getElementById('totalAreaSqm');
    
    if (totalRowsElem) totalRowsElem.textContent = summaryData.totalRows.toLocaleString();
    if (totalZonesElem) totalZonesElem.textContent = summaryData.uniqueZones.size;
    if (totalAreaRaiElem) totalAreaRaiElem.textContent = formatNumber(summaryData.totalAreaRai, 2);
    if (totalAreaSqmElem) totalAreaSqmElem.textContent = formatNumber(summaryData.totalAreaSqm, 0);
    
    // แสดงตารางสรุปตามโซน
    displayZoneSummary();
}

// แสดงสรุปตามโซน
function displayZoneSummary() {
    console.log("แสดงสรุปตามโซน");
    
    const tbody = document.getElementById('zoneSummaryTable')?.querySelector('tbody');
    if (!tbody) {
        console.error("ไม่พบตารางสรุปโซน");
        return;
    }
    
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
                <span class="badge zone-badge" style="background: linear-gradient(135deg, var(--accent-blue) 0%, var(--medium-blue) 100%)!important;">${zone}</span>
            </td>
            <td>${data.count}</td>
            <td><strong>${formatNumber(data.areaRai, 3)}</strong></td>
            <td>${formatNumber(data.areaSqm, 0)}</td>
            <td>
                <div class="progress-custom">
                    <div class="progress-bar-custom" style="width: ${percentage}%"></div>
                </div>
            </td>
            <td><strong style="color: var(--dark-blue);">${formatNumber(percentage, 1)}%</strong></td>
        `;
        
        tbody.appendChild(tr);
    });
}

// แสดงตัวอย่างข้อมูล
function displayDataPreview() {
    console.log("แสดงตัวอย่างข้อมูล");
    
    const thead = document.getElementById('dataPreviewTable')?.querySelector('thead');
    const tbody = document.getElementById('dataPreviewTable')?.querySelector('tbody');
    
    if (!thead || !tbody) {
        console.error("ไม่พบตารางตัวอย่างข้อมูล");
        return;
    }
    
    // เคลียร์ข้อมูลเดิม
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // สร้าง header
    const headerRow = document.createElement('tr');
    csvHeaders.forEach(header => {
        // ตรวจสอบว่าเป็นคอลัมน์สำคัญหรือไม่
        let isImportant = Object.values(detectedColumns).includes(header);
        
        const th = document.createElement('th');
        if (isImportant) {
            th.style.backgroundColor = 'var(--light-blue)';
            th.style.color = 'var(--text-dark)';
        }
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
                td.classList.add('fw-bold');
                
                if (header === detectedColumns.zone) {
                    td.style.color = 'var(--dark-blue)';
                } else if (header === detectedColumns.area) {
                    td.style.color = 'var(--text-dark)';
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
    console.log("ส่งออกสรุปผล");
    
    if (!summaryData.zones || Object.keys(summaryData.zones).length === 0) {
        showMessage('ยังไม่มีข้อมูลสรุปผล', 'warning');
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
    csvContent += `คอลัมน์โซนที่ใช้,${detectedColumns.zone}\n`;
    csvContent += `คอลัมน์พื้นที่ที่ใช้,${detectedColumns.area}\n`;
    csvContent += `วันที่สรุปผล,${new Date().toLocaleDateString('th-TH')}\n`;
    
    downloadCSV(csvContent, `สรุปผลตามโซน_${new Date().toISOString().slice(0,10)}.csv`);
    
    showMessage('ดาวน์โหลดสรุปผลเรียบร้อยแล้ว', 'success');
}

// ส่งออกข้อมูลทั้งหมด
function exportFullData() {
    console.log("ส่งออกข้อมูลทั้งหมด");
    
    if (csvData.length === 0) {
        showMessage('ยังไม่มีข้อมูล', 'warning');
        return;
    }
    
    let csvContent = csvHeaders.join(',') + '\n';
    
    csvData.forEach(row => {
        const rowValues = csvHeaders.map(header => {
            const value = row[header] || '';
            // ถ้าค่ามีคอมมา, ใส่ quotes
            return value.includes(',') ? `"${value}"` : value;
        });
        csvContent += rowValues.join(',') + '\n';
    });
    
    downloadCSV(csvContent, `ข้อมูลทั้งหมด_${new Date().toISOString().slice(0,10)}.csv`);
    
    showMessage('ดาวน์โหลดข้อมูลทั้งหมดเรียบร้อยแล้ว', 'success');
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
    console.log("พิมพ์รายงาน");
    
    if (!summaryData.zones || Object.keys(summaryData.zones).length === 0) {
        showMessage('ยังไม่มีข้อมูลรายงาน', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const now = new Date();
    const printDate = now.toLocaleDateString('th-TH');
    const printTime = now.toLocaleTimeString('th-TH');
    
    const fileName = document.getElementById('fileName')?.textContent || 'ไฟล์ CSV';
    
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>รายงานสรุปผลตามโซน</title>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
                
                body { 
                    font-family: 'Sarabun', sans-serif; 
                    margin: 20px; 
                    color: #2C3E50;
                    background-color: #f8f9fa;
                }
                
                .report-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                
                h1 { 
                    color: #3498DB; 
                    border-bottom: 3px solid #87CEEB; 
                    padding-bottom: 10px; 
                    margin-bottom: 20px;
                }
                
                h2 { 
                    color: #5DADE2; 
                    margin-top: 25px; 
                    margin-bottom: 15px;
                }
                
                .header-info {
                    background-color: #E0F7FF;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                }
                
                th { 
                    background-color: #AED6F1; 
                    color: #2C3E50; 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 2px solid #87CEEB;
                }
                
                td { 
                    padding: 10px 12px; 
                    border-bottom: 1px solid #E0F7FF; 
                }
                
                tr:nth-child(even) { 
                    background-color: #f8f9fa; 
                }
                
                .summary-box { 
                    background-color: #E0F7FF; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                }
                
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    color: #7F8C8D; 
                    font-size: 0.9em; 
                    padding-top: 20px;
                    border-top: 1px solid #E0F7FF;
                }
                
                .stat-number {
                    font-weight: bold;
                    color: #3498DB;
                }
                
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background-color: white;
                    }
                    
                    .report-container {
                        box-shadow: none;
                        padding: 0;
                    }
                    
                    .no-print { 
                        display: none; 
                    }
                    
                    h1 { font-size: 24px; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1><i class="bi bi-graph-up"></i> รายงานสรุปผลตามโซน</h1>
                
                <div class="header-info">
                    <p><strong>วันที่สร้างรายงาน:</strong> ${printDate} ${printTime}</p>
                    <p><strong>ไฟล์ต้นฉบับ:</strong> ${fileName}</p>
                    <p><strong>คอลัมน์โซนที่ใช้:</strong> "${detectedColumns.zone}"</p>
                    <p><strong>คอลัมน์พื้นที่ที่ใช้:</strong> "${detectedColumns.area}"</p>
                </div>
                
                <div class="summary-box">
                    <h2>สรุปภาพรวม</h2>
                    <p><strong>จำนวนข้อมูลทั้งหมด:</strong> <span class="stat-number">${summaryData.totalRows}</span> แถว</p>
                    <p><strong>จำนวนโซน:</strong> <span class="stat-number">${summaryData.uniqueZones.size}</span> โซน</p>
                    <p><strong>พื้นที่รวมทั้งหมด:</strong> <span class="stat-number">${formatNumber(summaryData.totalAreaRai, 3)}</span> ไร่ 
                    (${formatNumber(summaryData.totalAreaSqm, 0)} ตร.ม.)</p>
                    <p><strong>อัตราแปลงหน่วย:</strong> 1 ไร่ = 1,600 ตารางเมตร</p>
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
                <td><strong>${zone}</strong></td>
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
                    <p>© 2023 กรมพัฒนาที่ดิน</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 12px 24px; background-color: #3498DB; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        🖨️ พิมพ์รายงาน
                    </button>
                    <button onclick="window.close()" style="padding: 12px 24px; background-color: #7F8C8D; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                        ✖️ ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ลบไฟล์
function removeFile() {
    console.log("ลบไฟล์");
    
    csvData = [];
    csvHeaders = [];
    detectedColumns = {
        zone: null,
        area: null,
        id: null,
        owner: null
    };
    
    document.getElementById('csvFileInput').value = '';
    
    const fileInfo = document.getElementById('fileInfo');
    const columnSelector = document.getElementById('columnSelector');
    const resultsSection = document.getElementById('resultsSection');
    
    if (fileInfo) fileInfo.style.display = 'none';
    if (columnSelector) columnSelector.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    
    showMessage('ลบไฟล์เรียบร้อยแล้ว', 'info');
}

// แสดงข้อความ
function showMessage(message, type = 'info') {
    console.log(`แสดงข้อความ: ${message} (ประเภท: ${type})`);
    
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error("ไม่พบ alertContainer");
        return;
    }
    
    // สร้าง alert element
    const alertId = 'alert-' + Date.now();
    
    // ไอคอนตามประเภท
    let icon = 'info-circle';
    let colorClass = 'info';
    
    switch(type) {
        case 'success':
            icon = 'check-circle';
            colorClass = 'success';
            break;
        case 'danger':
            icon = 'exclamation-triangle';
            colorClass = 'danger';
            break;
        case 'warning':
            icon = 'exclamation-circle';
            colorClass = 'warning';
            break;
        default:
            icon = 'info-circle';
            colorClass = 'info';
    }
    
    const alertHtml = `
        <div id="${alertId}" class="alert alert-custom alert-${colorClass} alert-dismissible fade show" role="alert">
            <i class="bi bi-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // แทรก alert ด้านบนของ container
    alertContainer.insertAdjacentHTML('afterbegin', alertHtml);
    
    // อัตโนมัติปิดหลังจาก 5 วินาที
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

// แสดง/ซ่อน loading
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generateBtn = document.getElementById('generateReportBtn');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    
    if (generateBtn) {
        generateBtn.disabled = show;
        generateBtn.innerHTML = show ? 
            '<i class="bi bi-hourglass-split me-2"></i> กำลังประมวลผล...' : 
            '<i class="bi bi-graph-up-arrow me-2"></i> สรุปผลอัตโนมัติ';
    }
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
console.log('ระบบอัปโหลด CSV และสรุปผลอัตโนมัติ พร้อมใช้งาน (ธีมพาสเทลสีฟ้า)');
showMessage('ระบบพร้อมใช้งาน กรุณาอัปโหลดไฟล์ CSV', 'info');
