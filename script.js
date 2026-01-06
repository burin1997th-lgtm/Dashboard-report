// ตัวแปร global
let currentFile = null;
let csvData = null;
let parsedData = [];

// DOM Elements
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const fileInfoSection = document.getElementById('file-info-section');
const nextStepsSection = document.getElementById('next-steps-section');
const previewSection = document.getElementById('preview-section');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const fileName = document.getElementById('file-name');
const columnCount = document.getElementById('column-count');
const rowCount = document.getElementById('row-count');
const fileSize = document.getElementById('file-size');
const uploadStatus = document.getElementById('upload-status');
const dataPreview = document.getElementById('data-preview');
const samplePreview = document.getElementById('sample-preview');
const sampleData = document.getElementById('sample-data');

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    console.log('ระบบอัปโหลดไฟล์ CSV พร้อมใช้งาน');
    
    // ตั้งค่าการอัปโหลดไฟล์
    setupFileUpload();
    
    // ตั้งค่าปุ่มดำเนินการ
    setupActionButtons();
    
    // ตั้งค่าปุ่มตัวอย่าง
    setupSampleButtons();
    
    // ตรวจสอบการรองรับ File API
    checkFileAPISupport();
});

// ตรวจสอบการรองรับ File API
function checkFileAPISupport() {
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        showError('เบราว์เซอร์ของคุณไม่รองรับการอัปโหลดไฟล์ กรุณาอัปเดตเบราว์เซอร์');
        return false;
    }
    return true;
}

// ตั้งค่าการอัปโหลดไฟล์
function setupFileUpload() {
    // คลิกที่พื้นที่อัปโหลด
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // เมื่อเลือกไฟล์
    fileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            handleFileUpload(this.files[0]);
        }
    });
    
    // Drag and drop events
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

// จัดการการอัปโหลดไฟล์
function handleFileUpload(file) {
    // ตรวจสอบว่าเป็นไฟล์ CSV หรือไม่
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('กรุณาเลือกไฟล์ CSV เท่านั้น (นามสกุล .csv)');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size/1024/1024).toFixed(2)}MB) ขนาดสูงสุดคือ 10MB`);
        return;
    }
    
    currentFile = file;
    
    // แสดงแถบความคืบหน้า
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'กำลังตรวจสอบไฟล์...';
    
    // อัปเดตสถานะไฟล์
    updateFileInfo(file);
    
    // อ่านไฟล์ CSV
    readCSVFile(file);
}

// อัปเดตข้อมูลไฟล์
function updateFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / (1024 * 1024)).toFixed(2);
    
    // แสดงส่วนข้อมูลไฟล์
    fileInfoSection.classList.remove('hidden');
    fileInfoSection.classList.add('fade-in');
}

// อ่านไฟล์ CSV
function readCSVFile(file) {
    const reader = new FileReader();
    
    reader.onloadstart = function() {
        progressFill.style.width = '30%';
        progressText.textContent = 'กำลังอ่านไฟล์...';
    };
    
    reader.onprogress = function(e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `กำลังอ่านไฟล์... ${percent}%`;
        }
    };
    
    reader.onload = function(e) {
        progressFill.style.width = '70%';
        progressText.textContent = 'กำลังประมวลผลข้อมูล...';
        
        csvData = e.target.result;
        processCSVData(csvData);
    };
    
    reader.onerror = function() {
        showError('เกิดข้อผิดพลาดในการอ่านไฟล์');
        uploadProgress.classList.add('hidden');
    };
    
    reader.onloadend = function() {
        setTimeout(() => {
            progressFill.style.width = '100%';
            progressText.textContent = 'อัปโหลดเสร็จสิ้น';
            
            // ซ่อนแถบความคืบหน้าหลังจาก 1 วินาที
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
            }, 1000);
        }, 500);
    };
    
    reader.readAsText(file, 'UTF-8');
}

// ประมวลผลข้อมูล CSV
function processCSVData(csvText) {
    try {
        // แยกข้อมูลเป็นแถว
        const lines = csvText.split(/\r\n|\n|\r/);
        
        // กรองแถวว่าง
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        
        if (nonEmptyLines.length === 0) {
            showError('ไฟล์ CSV ว่างเปล่า');
            return;
        }
        
        // แยกหัวตาราง
        const headers = parseCSVLine(nonEmptyLines[0]);
        
        // แยกข้อมูล
        parsedData = [];
        for (let i = 1; i < nonEmptyLines.length; i++) {
            const rowData = parseCSVLine(nonEmptyLines[i]);
            if (rowData.length === headers.length) {
                parsedData.push(rowData);
            }
        }
        
        // อัปเดตจำนวนแถวและคอลัมน์
        rowCount.textContent = parsedData.length.toLocaleString();
        columnCount.textContent = headers.length;
        
        // แสดงส่วนขั้นตอนต่อไป
        nextStepsSection.classList.remove('hidden');
        nextStepsSection.classList.add('fade-in');
        
        // แสดงตัวอย่างข้อมูล
        displayDataPreview(headers, parsedData);
        
        // แสดงการแจ้งเตือนสำเร็จ
        showSuccess('อัปโหลดไฟล์สำเร็จ! พบข้อมูล ' + 
                   parsedData.length.toLocaleString() + ' แถว, ' + 
                   headers.length + ' คอลัมน์');
        
    } catch (error) {
        console.error('Error processing CSV:', error);
        showError('รูปแบบไฟล์ CSV ไม่ถูกต้อง: ' + error.message);
    }
}

// แยกข้อมูลจากแถว CSV (รองรับค่าที่มี comma ภายใน)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : '';
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // อักษร " สองตัวติดกันหมายถึง " ภายในข้อความ
                current += '"';
                i++; // ข้ามตัวถัดไป
            } else {
                // เริ่มหรือสิ้นสุดคำที่อยู่ใน quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // จบคอลัมน์
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // เพิ่มคอลัมน์สุดท้าย
    result.push(current);
    
    return result;
}

// แสดงตัวอย่างข้อมูล
function displayDataPreview(headers, data) {
    previewSection.classList.remove('hidden');
    previewSection.classList.add('fade-in');
    
    // สร้างตาราง
    let tableHTML = '<table>';
    
    // หัวตาราง
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${escapeHTML(header.trim())}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // ข้อมูล (แสดงแค่ 10 แถวแรก)
    tableHTML += '<tbody>';
    const displayRows = Math.min(10, data.length);
    for (let i = 0; i < displayRows; i++) {
        tableHTML += '<tr>';
        data[i].forEach(cell => {
            tableHTML += `<td>${escapeHTML(cell.trim())}</td>`;
        });
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody>';
    
    // หมายเหตุ
    if (data.length > 10) {
        tableHTML += `<tfoot><tr><td colspan="${headers.length}" style="text-align: center; padding: 15px; background: #f8f9fa; font-style: italic;">
            แสดง 10 แถวแรกจากทั้งหมด ${data.length.toLocaleString()} แถว
        </td></tr></tfoot>`;
    }
    
    tableHTML += '</table>';
    
    dataPreview.innerHTML = tableHTML;
}

// ตั้งค่าปุ่มดำเนินการ
function setupActionButtons() {
    // ดูตัวอย่าง
    document.getElementById('preview-btn').addEventListener('click', showDataPreview);
    
    // วิเคราะห์ข้อมูล
    document.getElementById('analyze-btn').addEventListener('click', analyzeData);
    
    // ดาวน์โหลดข้อมูล
    document.getElementById('download-btn').addEventListener('click', downloadProcessedData);
    
    // ลบไฟล์
    document.getElementById('delete-btn').addEventListener('click', deleteFile);
    
    // การ์ดดำเนินการ
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            handleAction(action);
        });
    });
}

// ตั้งค่าปุ่มตัวอย่าง
function setupSampleButtons() {
    // สร้างไฟล์ตัวอย่าง
    document.getElementById('create-sample-btn').addEventListener('click', createSampleCSV);
    
    // ดาวน์โหลดไฟล์ตัวอย่าง
    document.getElementById('download-sample-btn').addEventListener('click', downloadSampleCSV);
}

// จัดการการดำเนินการ
function handleAction(action) {
    switch(action) {
        case 'preview':
            showDataPreview();
            break;
        case 'analyze':
            analyzeData();
            break;
        case 'download':
            downloadProcessedData();
            break;
        case 'delete':
            deleteFile();
            break;
    }
}

// แสดงตัวอย่างข้อมูล
function showDataPreview() {
    if (!parsedData || parsedData.length === 0) {
        showError('ไม่มีข้อมูลที่จะแสดง');
        return;
    }
    
    // เลื่อนไปยังส่วนแสดงข้อมูล
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// วิเคราะห์ข้อมูล
function analyzeData() {
    if (!parsedData || parsedData.length === 0) {
        showError('ไม่มีข้อมูลที่จะวิเคราะห์');
        return;
    }
    
    showMessage('กำลังวิเคราะห์ข้อมูล...', 'info');
    
    // จำลองการวิเคราะห์ข้อมูล
    setTimeout(() => {
        const analysis = generateDataAnalysis();
        showAnalysisResults(analysis);
    }, 1000);
}

// สร้างการวิเคราะห์ข้อมูล
function generateDataAnalysis() {
    const headers = parseCSVLine(csvData.split(/\r\n|\n|\r/)[0]);
    const rowCount = parsedData.length;
    
    let analysis = {
        totalRows: rowCount,
        totalColumns: headers.length,
        columnInfo: [],
        dataTypes: {},
        sampleValues: {}
    };
    
    // วิเคราะห์แต่ละคอลัมน์
    for (let i = 0; i < headers.length; i++) {
        const columnName = headers[i].trim();
        const columnValues = parsedData.map(row => row[i]);
        
        // ตรวจสอบประเภทข้อมูล
        let dataType = 'ข้อความ';
        let numericCount = 0;
        let emptyCount = 0;
        
        columnValues.forEach(value => {
            const trimmed = value.trim();
            if (trimmed === '') {
                emptyCount++;
            } else if (!isNaN(trimmed) && trimmed !== '') {
                numericCount++;
            }
        });
        
        if (numericCount > rowCount * 0.7) {
            dataType = 'ตัวเลข';
        } else if (emptyCount > rowCount * 0.5) {
            dataType = 'ว่างเปล่าส่วนใหญ่';
        }
        
        analysis.columnInfo.push({
            name: columnName,
            dataType: dataType,
            uniqueValues: new Set(columnValues).size,
            emptyCount: emptyCount,
            sample: columnValues.slice(0, 3).filter(v => v.trim() !== '')
        });
    }
    
    return analysis;
}

// แสดงผลการวิเคราะห์
function showAnalysisResults(analysis) {
    let resultHTML = `
        <div class="analysis-results">
            <h3><i class="fas fa-chart-bar"></i> ผลการวิเคราะห์ข้อมูล</h3>
            <div class="summary">
                <div class="summary-item">
                    <i class="fas fa-list"></i>
                    <div>
                        <h4>${analysis.totalRows.toLocaleString()}</h4>
                        <p>จำนวนแถวทั้งหมด</p>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-columns"></i>
                    <div>
                        <h4>${analysis.totalColumns}</h4>
                        <p>จำนวนคอลัมน์</p>
                    </div>
                </div>
            </div>
            
            <h4>ข้อมูลแต่ละคอลัมน์:</h4>
            <div class="columns-analysis">
    `;
    
    analysis.columnInfo.forEach((col, index) => {
        resultHTML += `
            <div class="column-item">
                <div class="column-header">
                    <span class="column-number">${index + 1}</span>
                    <h5>${escapeHTML(col.name)}</h5>
                    <span class="data-type ${col.dataType === 'ตัวเลข' ? 'numeric' : 'text'}">
                        ${col.dataType}
                    </span>
                </div>
                <div class="column-details">
                    <p><i class="fas fa-layer-group"></i> ค่าที่ไม่ซ้ำ: ${col.uniqueValues} ค่า</p>
                    <p><i class="fas fa-ban"></i> ค่าว่าง: ${col.emptyCount} ค่า</p>
                    ${col.sample.length > 0 ? 
                        `<p><i class="fas fa-eye"></i> ตัวอย่าง: ${col.sample.map(v => escapeHTML(v)).join(', ')}</p>` : 
                        ''}
                </div>
            </div>
        `;
    });
    
    resultHTML += `
            </div>
        </div>
    `;
    
    // แสดงในส่วนข้อมูล
    dataPreview.innerHTML = resultHTML;
    previewSection.classList.remove('hidden');
    previewSection.scrollIntoView({ behavior: 'smooth' });
    
    // เพิ่มสไตล์สำหรับผลการวิเคราะห์
    const style = document.createElement('style');
    style.textContent = `
        .analysis-results { padding: 20px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
        .summary-item { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            display: flex; 
            align-items: center; 
            gap: 15px;
            flex: 1;
            min-width: 200px;
        }
        .summary-item i { font-size: 2rem; color: #3498db; }
        .summary-item h4 { font-size: 2rem; margin: 0; color: #2c3e50; }
        .summary-item p { margin: 5px 0 0; color: #6c757d; }
        .columns-analysis { margin-top: 20px; }
        .column-item { 
            background: white; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 10px;
        }
        .column-header { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .column-number { 
            background: #3498db; 
            color: white; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-weight: bold;
        }
        .column-header h5 { 
            margin: 0; 
            flex-grow: 1; 
            color: #2c3e50;
            font-size: 1.1rem;
        }
        .data-type { 
            padding: 4px 10px; 
            border-radius: 12px; 
            font-size: 0.8rem; 
            font-weight: bold;
        }
        .data-type.numeric { background: #d4edda; color: #155724; }
        .data-type.text { background: #d1ecf1; color: #0c5460; }
        .column-details { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
            gap: 10px;
        }
        .column-details p { 
            margin: 5px 0; 
            color: #6c757d;
            display: flex;
            align-items: center;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);
    
    showSuccess('วิเคราะห์ข้อมูลสำเร็จ');
}

// ดาวน์โหลดข้อมูลที่ประมวลผลแล้ว
function downloadProcessedData() {
    if (!csvData) {
        showError('ไม่มีข้อมูลที่จะดาวน์โหลด');
        return;
    }
    
    showMessage('กำลังเตรียมไฟล์สำหรับดาวน์โหลด...', 'info');
    
    // สร้างไฟล์ CSV ใหม่
    let processedCSV = csvData;
    
    // เพิ่มคอลัมน์หมายเลขแถว (ตัวอย่างการประมวลผล)
    const lines = processedCSV.split(/\r\n|\n|\r/);
    const headers = lines[0];
    const newHeaders = 'หมายเลขแถว,' + headers;
    
    let newLines = [newHeaders];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
            newLines.push(`${i},${lines[i]}`);
        }
    }
    
    processedCSV = newLines.join('\n');
    
    // สร้าง Blob และลิงก์ดาวน์โหลด
    const blob = new Blob([processedCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const downloadName = currentFile ? 
        `processed_${currentFile.name.replace('.csv', '')}_${timestamp}.csv` : 
        `data_${timestamp}.csv`;
    
    link.href = url;
    link.download = downloadName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // คืนทรัพยากร
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showSuccess('ดาวน์โหลดไฟล์สำเร็จ: ' + downloadName);
}

// ลบไฟล์
function deleteFile() {
    if (confirm('คุณแน่ใจว่าต้องการลบไฟล์นี้ออกจากระบบ?\nข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้')) {
        // รีเซ็ตข้อมูล
        currentFile = null;
        csvData = null;
        parsedData = [];
        
        // รีเซ็ต input file
        fileInput.value = '';
        
        // ซ่อนส่วนต่างๆ
        fileInfoSection.classList.add('hidden');
        nextStepsSection.classList.add('hidden');
        previewSection.classList.add('hidden');
        
        // รีเซ็ตข้อมูลแสดงผล
        fileName.textContent = '-';
        rowCount.textContent = '0';
        columnCount.textContent = '0';
        fileSize.textContent = '0';
        
        showSuccess('ลบไฟล์ออกจากระบบสำเร็จ');
    }
}

// สร้างไฟล์ CSV ตัวอย่าง
function createSampleCSV() {
    const sampleHeaders = ['รหัส', 'ชื่อ-นามสกุล', 'อายุ', 'แผนก', 'เงินเดือน', 'วันที่เริ่มงาน'];
    const sampleData = [
        ['EMP001', 'สมชาย ใจดี', '28', 'การตลาด', '35000', '2023-01-15'],
        ['EMP002', 'สุนิสา แซ่ลิ้ม', '32', 'การเงิน', '42000', '2022-08-22'],
        ['EMP003', 'ประเสริฐ เก่งฉกาจ', '45', 'ไอที', '52000', '2021-03-10'],
        ['EMP004', 'กัลยา รักดี', '29', 'ทรัพยากรบุคคล', '38000', '2023-05-18'],
        ['EMP005', 'วิทยา เร็วแรง', '35', 'การผลิต', '41000', '2022-11-30'],
        ['EMP006', 'อรุณี สดใส', '27', 'การตลาด', '33000', '2023-07-12'],
        ['EMP007', 'นพดล มั่นคง', '41', 'การเงิน', '48000', '2021-09-05'],
        ['EMP008', 'เบญจา งามสง่า', '38', 'ไอที', '46000', '2022-02-28'],
        ['EMP009', 'ชัยวัฒน์ แข็งแรง', '31', 'การผลิต', '39000', '2023-03-25'],
        ['EMP010', 'สุภาวดี อ่อนหวาน', '26', 'ทรัพยากรบุคคล', '36000', '2023-08-14']
    ];
    
    // สร้าง CSV ข้อความ
    let csvContent = sampleHeaders.join(',') + '\n';
    sampleData.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    
    // แสดงตัวอย่าง
    samplePreview.classList.remove('hidden');
    sampleDataEl.textContent = csvContent;
    
    // อัปโหลดไฟล์ตัวอย่าง
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const file = new File([blob], 'ตัวอย่าง_ข้อมูลพนักงาน.csv', { type: 'text/csv' });
    
    // จัดการเหมือนอัปโหลดไฟล์ปกติ
    handleFileUpload(file);
    
    showSuccess('สร้างไฟล์ตัวอย่างสำเร็จและได้ทำการอัปโหลดแล้ว');
}

// ดาวน์โหลดไฟล์ตัวอย่าง
function downloadSampleCSV() {
    const sampleHeaders = ['รหัส', 'ชื่อ', 'นามสกุล', 'อายุ', 'จังหวัด', 'คะแนน'];
    const sampleData = [
        ['S001', 'สมชาย', 'ใจดี', '25', 'กรุงเทพ', '85'],
        ['S002', 'สุนิสา', 'แซ่ลิ้ม', '30', 'เชียงใหม่', '92'],
        ['S003', 'ประเสริฐ', 'เก่งฉกาจ', '28', 'ชลบุรี', '78'],
        ['S004', 'กัลยา', 'รักดี', '22', 'นนทบุรี', '95'],
        ['S005', 'วิทยา', 'เร็วแรง', '35', 'ภูเก็ต', '88']
    ];
    
    let csvContent = sampleHeaders.join(',') + '\n';
    sampleData.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'ตัวอย่างข้อมูล.csv';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showSuccess('ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ');
}

// แสดงข้อความแจ้งเตือน
function showMessage(message, type = 'info') {
    // ลบข้อความเก่าหากมี
    const oldMessage = document.querySelector('.notification');
    if (oldMessage) {
        oldMessage.remove();
    }
    
    // สร้างข้อความใหม่
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    let bgColor = '#d1ecf1';
    let color = '#0c5460';
    let borderColor = '#bee5eb';
    
    if (type === 'success') {
        icon = 'check-circle';
        bgColor = '#d4edda';
        color = '#155724';
        borderColor = '#c3e6cb';
    } else if (type === 'error') {
        icon = 'exclamation-circle';
        bgColor = '#f8d7da';
        color = '#721c24';
        borderColor = '#f5c6cb';
    }
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: ${color};
        border: 1px solid ${borderColor};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // ลบข้อความหลังจาก 5 วินาที
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // เพิ่ม animation keyframes ถ้ายังไม่มี
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ฟังก์ชันช่วยเหลือ
function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
