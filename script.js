// ระบบเลือกคอลัมน์สรุปผลจาก CSV

// ตัวแปรเก็บข้อมูล
let csvData = [];
let csvHeaders = [];
let csvColumnSamples = {}; // เก็บตัวอย่างข้อมูลแต่ละคอลัมน์
let selectedColumns = {
    zone: null,
    area: null,
    id: null
};
let summaryData = {};
let plotsData = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("ระบบเริ่มทำงานแล้ว");
    
    // Browse button
    document.getElementById('browseBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
    
    // File input change
    document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
    
    // Remove file button
    document.getElementById('removeFileBtn').addEventListener('click', removeFile);
    
    // Clear selections button
    document.getElementById('clearSelectionsBtn').addEventListener('click', clearAllSelections);
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    
    // Export buttons
    document.getElementById('exportSummaryBtn').addEventListener('click', exportSummary);
    document.getElementById('exportPlotsBtn').addEventListener('click', exportPlots);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    
    // Search and filter
    document.getElementById('searchPlot').addEventListener('input', filterPlots);
    document.getElementById('filterZone').addEventListener('change', filterPlots);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    
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
    
    console.log("Event listeners ทั้งหมดถูกตั้งค่าเรียบร้อย");
});

// จัดการเมื่อเลือกไฟล์
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        console.log("ไฟล์ที่เลือก:", file.name);
        handleFile(file);
    }
}

// จัดการไฟล์
function handleFile(file) {
    // ตรวจสอบประเภทไฟล์
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('กรุณาเลือกไฟล์ CSV เท่านั้น (.csv)', 'danger');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์
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
            console.log("อ่านไฟล์สำเร็จ");
            processCSV(content);
            
            // แสดงข้อมูลไฟล์
            showFileInfo(file);
            
            // แสดงส่วนเลือกคอลัมน์
            showColumnSelectionSection();
            
            // แสดงคอลัมน์ทั้งหมด
            displayAllColumns();
            
            // ซ่อน loading
            showLoading(false);
            
            showMessage('อัปโหลดไฟล์สำเร็จ! กรุณาเลือกคอลัมน์สำหรับสรุปผล', 'success');
            
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
    console.log("หัวคอลัมน์:", csvHeaders);
    
    if (csvHeaders.length === 0) {
        throw new Error('ไม่พบหัวคอลัมน์ในไฟล์ CSV');
    }
    
    // อ่านข้อมูล
    csvData = [];
    csvColumnSamples = {};
    
    // กำหนดค่าเริ่มต้นสำหรับตัวอย่างคอลัมน์
    csvHeaders.forEach(header => {
        csvColumnSamples[header] = [];
    });
    
    for (let i = 1; i < lines.length; i++) {
        try {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length === csvHeaders.length) {
                const row = {};
                csvHeaders.forEach((header, index) => {
                    const value = values[index] || '';
                    row[header] = value;
                    
                    // เก็บตัวอย่างข้อมูล (สูงสุด 5 ค่า)
                    if (csvColumnSamples[header].length < 5 && value) {
                        csvColumnSamples[header].push(value);
                    }
                });
                csvData.push(row);
            }
        } catch (error) {
            console.warn(`ข้อผิดพลาดที่บรรทัดที่ ${i+1}:`, error);
        }
    }
    
    console.log('อัปโหลดไฟล์สำเร็จ:', csvData.length, 'แถว,', csvHeaders.length, 'คอลัมน์');
}

// แสดงข้อมูลไฟล์
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileDetails = document.getElementById('fileDetails');
    
    if (fileInfo && fileName && fileDetails) {
        fileName.textContent = file.name;
        fileDetails.textContent = `คอลัมน์: ${csvHeaders.length} | แถว: ${csvData.length}`;
        
        fileInfo.style.display = 'block';
    }
}

// แสดงส่วนเลือกคอลัมน์
function showColumnSelectionSection() {
    const columnSelectionSection = document.getElementById('columnSelectionSection');
    if (columnSelectionSection) {
        columnSelectionSection.style.display = 'block';
        columnSelectionSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// แสดงคอลัมน์ทั้งหมด
function displayAllColumns() {
    const columnGrid = document.getElementById('columnGrid');
    const selectedColumnsDisplay = document.getElementById('selectedColumnsDisplay');
    
    if (!columnGrid) return;
    
    columnGrid.innerHTML = '';
    
    // สร้างการ์ดสำหรับแต่ละคอลัมน์
    csvHeaders.forEach((columnName, index) => {
        const columnCard = createColumnCard(columnName, index);
        columnGrid.appendChild(columnCard);
    });
    
    // แสดงส่วนคอลัมน์ที่เลือกแล้ว
    updateSelectedColumnsDisplay();
}

// สร้างการ์ดคอลัมน์
function createColumnCard(columnName, index) {
    const card = document.createElement('div');
    card.className = 'column-card';
    
    // ตรวจสอบว่าคอลัมน์นี้ถูกเลือกเป็นประเภทไหน
    let selectedClass = '';
    let selectedType = '';
    
    if (selectedColumns.zone === columnName) {
        selectedClass = 'zone-selected';
        selectedType = 'โซน';
    } else if (selectedColumns.area === columnName) {
        selectedClass = 'area-selected';
        selectedType = 'พื้นที่';
    } else if (selectedColumns.id === columnName) {
        selectedClass = 'id-selected';
        selectedType = 'รหัสแปลง';
    }
    
    if (selectedClass) {
        card.classList.add('selected', selectedClass);
    }
    
    // ดึงตัวอย่างข้อมูล
    const samples = csvColumnSamples[columnName] || [];
    const sampleText = samples.length > 0 ? samples.join(', ') : 'ไม่มีข้อมูลตัวอย่าง';
    
    card.innerHTML = `
        <div class="column-header">
            <div class="column-name">${columnName}</div>
            ${selectedType ? `<span class="column-badge">${selectedType}</span>` : ''}
        </div>
        <div class="column-preview" title="${sampleText}">
            <small>${sampleText}</small>
        </div>
        <div class="column-actions">
            <button class="action-btn zone-btn" data-column="${columnName}" data-type="zone">
                <i class="bi bi-pin-map me-1"></i> ใช้เป็นโซน
            </button>
            <button class="action-btn area-btn" data-column="${columnName}" data-type="area">
                <i class="bi bi-square me-1"></i> ใช้เป็นพื้นที่
            </button>
            <button class="action-btn id-btn" data-column="${columnName}" data-type="id">
                <i class="bi bi-hash me-1"></i> ใช้เป็นรหัส
            </button>
        </div>
    `;
    
    // เพิ่ม event listeners สำหรับปุ่ม
    const zoneBtn = card.querySelector('.zone-btn');
    const areaBtn = card.querySelector('.area-btn');
    const idBtn = card.querySelector('.id-btn');
    
    zoneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectColumn(columnName, 'zone');
        updateColumnCards();
    });
    
    areaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectColumn(columnName, 'area');
        updateColumnCards();
    });
    
    idBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectColumn(columnName, 'id');
        updateColumnCards();
    });
    
    // คลิกที่การ์ดเพื่อดูรายละเอียด
    card.addEventListener('click', () => {
        showColumnDetails(columnName);
    });
    
    return card;
}

// เลือกคอลัมน์
function selectColumn(columnName, type) {
    // ถ้าคอลัมน์นี้ถูกเลือกอยู่แล้วเป็นประเภทนี้ ให้ยกเลิกการเลือก
    if (selectedColumns[type] === columnName) {
        selectedColumns[type] = null;
        showMessage(`ยกเลิกเลือกคอลัมน์ "${columnName}" เป็น${getTypeLabel(type)}`, 'info');
    } else {
        // ถ้ามีคอลัมน์อื่นถูกเลือกเป็นประเภทนี้อยู่แล้ว ให้ยกเลิกก่อน
        if (selectedColumns[type]) {
            showMessage(`เปลี่ยนคอลัมน์${getTypeLabel(type)}จาก "${selectedColumns[type]}" เป็น "${columnName}"`, 'info');
        } else {
            showMessage(`เลือกคอลัมน์ "${columnName}" เป็น${getTypeLabel(type)}`, 'success');
        }
        
        selectedColumns[type] = columnName;
    }
    
    updateSelectedColumnsDisplay();
}

// ดึงชื่อประเภทเป็นภาษาไทย
function getTypeLabel(type) {
    switch(type) {
        case 'zone': return 'โซน';
        case 'area': return 'พื้นที่';
        case 'id': return 'รหัสแปลง';
        default: return '';
    }
}

// อัปเดตการ์ดคอลัมน์ทั้งหมด
function updateColumnCards() {
    const columnGrid = document.getElementById('columnGrid');
    if (!columnGrid) return;
    
    // ลบการ์ดทั้งหมด
    columnGrid.innerHTML = '';
    
    // สร้างการ์ดใหม่
    csvHeaders.forEach((columnName, index) => {
        const columnCard = createColumnCard(columnName, index);
        columnGrid.appendChild(columnCard);
    });
}

// แสดงรายละเอียดคอลัมน์
function showColumnDetails(columnName) {
    const samples = csvColumnSamples[columnName] || [];
    const dataType = detectDataType(samples);
    
    let message = `คอลัมน์: <strong>${columnName}</strong><br>`;
    message += `ประเภทข้อมูล: <strong>${dataType}</strong><br>`;
    message += `จำนวนข้อมูล: <strong>${csvData.length}</strong> แถว<br>`;
    message += `ตัวอย่างข้อมูล: <em>${samples.length > 0 ? samples.join(', ') : 'ไม่มีข้อมูล'}</em>`;
    
    showMessage(message, 'info', 5000);
}

// ตรวจสอบประเภทข้อมูล
function detectDataType(samples) {
    if (samples.length === 0) return 'ไม่ทราบ';
    
    // ตรวจสอบว่าข้อมูลเป็นตัวเลขหรือไม่
    const isNumeric = samples.every(sample => !isNaN(sample) && sample.trim() !== '');
    
    if (isNumeric) {
        // ตรวจสอบว่าเป็นพื้นที่ไร่หรือไม่ (มักจะมีทศนิยม)
        const hasDecimal = samples.some(sample => sample.includes('.'));
        return hasDecimal ? 'ตัวเลข (พื้นที่ไร่)' : 'ตัวเลข';
    }
    
    // ตรวจสอบว่ามีคำว่าโซนหรือ zone หรือไม่
    const hasZone = samples.some(sample => 
        sample.toLowerCase().includes('โซน') || 
        sample.toLowerCase().includes('zone')
    );
    
    if (hasZone) return 'ข้อความ (โซน)';
    
    // ตรวจสอบว่ามีรหัสแปลงหรือไม่
    const hasCode = samples.some(sample => 
        /^[A-Za-z0-9]+$/.test(sample) || 
        sample.toLowerCase().includes('แปลง')
    );
    
    if (hasCode) return 'ข้อความ (รหัส)';
    
    return 'ข้อความ';
}

// อัปเดตการแสดงคอลัมน์ที่เลือกแล้ว
function updateSelectedColumnsDisplay() {
    const selectedColumnsDisplay = document.getElementById('selectedColumnsDisplay');
    const selectedZoneColumn = document.getElementById('selectedZoneColumn');
    const selectedAreaColumn = document.getElementById('selectedAreaColumn');
    const selectedIdColumn = document.getElementById('selectedIdColumn');
    
    if (!selectedColumnsDisplay || !selectedZoneColumn || !selectedAreaColumn || !selectedIdColumn) return;
    
    // อัปเดตข้อความ
    selectedZoneColumn.textContent = selectedColumns.zone || 'ยังไม่ได้เลือก';
    selectedAreaColumn.textContent = selectedColumns.area || 'ยังไม่ได้เลือก';
    selectedIdColumn.textContent = selectedColumns.id || 'ยังไม่ได้เลือก (ไม่บังคับ)';
    
    // ตรวจสอบว่ามีการเลือกคอลัมน์โซนและพื้นที่แล้วหรือไม่
    const hasRequiredColumns = selectedColumns.zone && selectedColumns.area;
    
    // แสดงหรือซ่อนส่วนคอลัมน์ที่เลือกแล้ว
    if (hasRequiredColumns) {
        selectedColumnsDisplay.style.display = 'block';
        selectedColumnsDisplay.scrollIntoView({ behavior: 'smooth' });
    } else {
        selectedColumnsDisplay.style.display = 'none';
    }
}

// ล้างการเลือกทั้งหมด
function clearAllSelections() {
    selectedColumns = {
        zone: null,
        area: null,
        id: null
    };
    
    updateColumnCards();
    updateSelectedColumnsDisplay();
    
    showMessage('ล้างการเลือกคอลัมน์ทั้งหมดเรียบร้อยแล้ว', 'info');
}

// สร้างรายงานสรุปผล
function generateReport() {
    console.log("เริ่มสร้างรายงานสรุปผล");
    
    if (csvData.length === 0) {
        showMessage('กรุณาอัปโหลดไฟล์ CSV ก่อน', 'warning');
        return;
    }
    
    // ตรวจสอบว่ามีการเลือกคอลัมน์โซนและพื้นที่แล้วหรือไม่
    if (!selectedColumns.zone) {
        showMessage('กรุณาเลือกคอลัมน์โซนสำหรับสรุปผล', 'warning');
        return;
    }
    
    if (!selectedColumns.area) {
        showMessage('กรุณาเลือกคอลัมน์พื้นที่สำหรับสรุปผล', 'warning');
        return;
    }
    
    // แสดง loading
    showLoading(true);
    
    // หน่วงเวลาเล็กน้อย
    setTimeout(() => {
        try {
            // ประมวลผลข้อมูลแปลง
            processPlotsData();
            
            // คำนวณสรุปผล
            calculateSummary();
            
            // แสดงผลลัพธ์
            displayResults();
            
            // แสดงข้อมูลรายงาน
            displayReportInfo();
            
            // แสดงส่วนผลลัพธ์
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // ซ่อน loading
            showLoading(false);
            
            showMessage('สร้างรายงานสรุปผลเรียบร้อยแล้ว!', 'success');
            
        } catch (error) {
            console.error("ข้อผิดพลาดในการสรุปผล:", error);
            showLoading(false);
            showMessage('เกิดข้อผิดพลาดในการสรุปผล: ' + error.message, 'danger');
        }
    }, 500);
}

// ประมวลผลข้อมูลแปลง
function processPlotsData() {
    plotsData = [];
    
    csvData.forEach((row, index) => {
        try {
            const plot = {
                index: index + 1,
                id: selectedColumns.id ? (row[selectedColumns.id] || `แปลง${index + 1}`) : `แปลง${index + 1}`,
                zone: row[selectedColumns.zone] || 'ไม่ระบุโซน',
                area: parseFloat(row[selectedColumns.area]) || 0
            };
            
            // เพิ่มหมายเหตุสำหรับแปลงที่มีพื้นที่ = 0
            if (plot.area === 0) {
                plot.note = 'พื้นที่ = 0';
            } else if (plot.area < 0) {
                plot.note = 'พื้นที่ติดลบ';
            } else {
                plot.note = '';
            }
            
            plotsData.push(plot);
        } catch (error) {
            console.warn(`ข้อผิดพลาดในการประมวลผลแถวที่ ${index + 1}:`, error);
        }
    });
    
    console.log("ประมวลผลข้อมูลแปลงสำเร็จ:", plotsData.length, "แปลง");
}

// คำนวณสรุปผล
function calculateSummary() {
    summaryData = {
        zones: {},
        totalPlots: plotsData.length,
        totalArea: 0,
        uniqueZones: new Set()
    };
    
    plotsData.forEach(plot => {
        const zone = plot.zone;
        const area = plot.area;
        
        // เพิ่มข้อมูลโซน
        if (!summaryData.zones[zone]) {
            summaryData.zones[zone] = {
                count: 0,
                totalArea: 0
            };
        }
        
        summaryData.zones[zone].count++;
        summaryData.zones[zone].totalArea += area;
        
        // อัพเดทผลรวม
        summaryData.totalArea += area;
        summaryData.uniqueZones.add(zone);
    });
    
    console.log("คำนวณสรุปผลเสร็จสิ้น:", summaryData);
}

// แสดงผลลัพธ์
function displayResults() {
    // อัพเดทสถิติ
    document.getElementById('totalPlots').textContent = summaryData.totalPlots.toLocaleString();
    document.getElementById('totalZones').textContent = summaryData.uniqueZones.size;
    document.getElementById('totalArea').textContent = formatNumber(summaryData.totalArea, 2);
    
    // คำนวณพื้นที่เฉลี่ยต่อแปลง
    const avgArea = summaryData.totalPlots > 0 ? summaryData.totalArea / summaryData.totalPlots : 0;
    document.getElementById('avgArea').textContent = formatNumber(avgArea, 2);
    
    // แสดงตารางสรุปตามโซน
    displayZoneSummary();
    
    // แสดงตารางแปลง
    displayPlotsTable();
}

// แสดงสรุปตามโซน
function displayZoneSummary() {
    const tbody = document.getElementById('zoneSummaryTable')?.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // เรียงลำดับโซนตามจำนวนแปลง (มากไปน้อย)
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].count - summaryData.zones[a].count;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalArea > 0 ? 
            (data.totalArea / summaryData.totalArea) * 100 : 0;
        const avgAreaPerPlot = data.count > 0 ? data.totalArea / data.count : 0;
        
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>
                <span class="badge zone-badge">${zone}</span>
            </td>
            <td><strong>${data.count}</strong></td>
            <td>${formatNumber(data.totalArea, 2)}</td>
            <td>${formatNumber(avgAreaPerPlot, 2)}</td>
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

// แสดงตารางแปลง
function displayPlotsTable() {
    const tbody = document.getElementById('plotsTable')?.querySelector('tbody');
    const filterZone = document.getElementById('filterZone');
    
    if (!tbody || !filterZone) return;
    
    // เคลียร์ตาราง
    tbody.innerHTML = '';
    
    // เคลียร์และสร้างตัวเลือกกรองโซน
    filterZone.innerHTML = '<option value="">ทั้งหมด (โซน)</option>';
    
    // เพิ่มตัวเลือกโซน
    Object.keys(summaryData.zones).sort().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        filterZone.appendChild(option);
    });
    
    // แสดงข้อมูลแปลงทั้งหมด
    updatePlotsTable();
}

// อัปเดตตารางแปลง (พร้อมการกรอง)
function updatePlotsTable() {
    const tbody = document.getElementById('plotsTable')?.querySelector('tbody');
    const searchPlot = document.getElementById('searchPlot');
    const filterZone = document.getElementById('filterZone');
    
    if (!tbody || !searchPlot || !filterZone) return;
    
    tbody.innerHTML = '';
    
    const searchText = searchPlot.value.toLowerCase();
    const selectedZone = filterZone.value;
    
    let filteredPlots = plotsData;
    
    // กรองตามโซน
    if (selectedZone) {
        filteredPlots = filteredPlots.filter(plot => plot.zone === selectedZone);
    }
    
    // กรองตามคำค้นหา
    if (searchText) {
        filteredPlots = filteredPlots.filter(plot => 
            plot.id.toLowerCase().includes(searchText) || 
            plot.zone.toLowerCase().includes(searchText)
        );
    }
    
    // แสดงแปลงที่กรองแล้ว
    filteredPlots.forEach(plot => {
        const tr = document.createElement('tr');
        
        // กำหนดสีตามพื้นที่
        let areaClass = '';
        if (plot.area === 0) {
            areaClass = 'text-danger';
        } else if (plot.area < 1) {
            areaClass = 'text-warning';
        } else if (plot.area > 10) {
            areaClass = 'text-success';
        }
        
        tr.innerHTML = `
            <td>${plot.index}</td>
            <td><strong>${plot.id}</strong></td>
            <td>
                <span class="badge zone-badge">${plot.zone}</span>
            </td>
            <td class="${areaClass}"><strong>${formatNumber(plot.area, 2)}</strong></td>
            <td><small class="text-muted">${plot.note}</small></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // แสดงข้อความถ้าไม่มีข้อมูล
    if (filteredPlots.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="5" class="text-center py-4 text-muted">
                <i class="bi bi-search display-6"></i>
                <p class="mt-2">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// แสดงข้อมูลรายงาน
function displayReportInfo() {
    document.getElementById('reportZoneColumn').textContent = selectedColumns.zone;
    document.getElementById('reportAreaColumn').textContent = selectedColumns.area;
    document.getElementById('reportIdColumn').textContent = selectedColumns.id || 'ไม่ได้เลือก';
    document.getElementById('reportTotalData').textContent = csvData.length;
}

// กรองแปลง
function filterPlots() {
    updatePlotsTable();
}

// รีเซ็ตฟิลเตอร์
function resetFilters() {
    document.getElementById('searchPlot').value = '';
    document.getElementById('filterZone').value = '';
    updatePlotsTable();
}

// ส่งออกสรุปผล
function exportSummary() {
    if (!summaryData.zones || Object.keys(summaryData.zones).length === 0) {
        showMessage('ยังไม่มีข้อมูลสรุปผล', 'warning');
        return;
    }
    
    let csvContent = "รายงานสรุปผลตามโซน\n\n";
    csvContent += "โซน,จำนวนแปลง,พื้นที่รวม (ไร่),พื้นที่เฉลี่ย/แปลง,ร้อยละ\n";
    
    // เรียงลำดับโซนตามจำนวนแปลง
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].count - summaryData.zones[a].count;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalArea > 0 ? 
            (data.totalArea / summaryData.totalArea) * 100 : 0;
        const avgAreaPerPlot = data.count > 0 ? data.totalArea / data.count : 0;
        
        csvContent += `${zone},${data.count},${data.totalArea.toFixed(2)},${avgAreaPerPlot.toFixed(2)},${percentage.toFixed(2)}%\n`;
    });
    
    csvContent += `\nสรุปทั้งหมด\n`;
    csvContent += `จำนวนแปลงทั้งหมด,${summaryData.totalPlots}\n`;
    csvContent += `จำนวนโซน,${summaryData.uniqueZones.size}\n`;
    csvContent += `พื้นที่รวมทั้งหมด (ไร่),${summaryData.totalArea.toFixed(2)}\n`;
    csvContent += `พื้นที่เฉลี่ยต่อแปลง,${(summaryData.totalPlots > 0 ? summaryData.totalArea / summaryData.totalPlots : 0).toFixed(2)}\n`;
    csvContent += `คอลัมน์โซนที่ใช้,${selectedColumns.zone}\n`;
    csvContent += `คอลัมน์พื้นที่ที่ใช้,${selectedColumns.area}\n`;
    csvContent += `คอลัมน์รหัสแปลงที่ใช้,${selectedColumns.id || '-'}\n`;
    csvContent += `วันที่สรุปผล,${new Date().toLocaleDateString('th-TH')}\n`;
    
    downloadCSV(csvContent, `สรุปผลตามโซน_${new Date().toISOString().slice(0,10)}.csv`);
    
    showMessage('ดาวน์โหลดสรุปผลเรียบร้อยแล้ว', 'success');
}

// ส่งออกรายการแปลง
function exportPlots() {
    if (plotsData.length === 0) {
        showMessage('ยังไม่มีข้อมูลแปลง', 'warning');
        return;
    }
    
    let csvContent = "ลำดับ,รหัสแปลง,โซน,พื้นที่ (ไร่),หมายเหตุ\n";
    
    plotsData.forEach(plot => {
        csvContent += `${plot.index},${plot.id},${plot.zone},${plot.area.toFixed(2)},${plot.note}\n`;
    });
    
    downloadCSV(csvContent, `รายการแปลง_${new Date().toISOString().slice(0,10)}.csv`);
    
    showMessage('ดาวน์โหลดรายการแปลงเรียบร้อยแล้ว', 'success');
}

// พิมพ์รายงาน
function printReport() {
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
            <title>รายงานสรุปผลแปลงตามโซน</title>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
                
                body { 
                    font-family: 'Sarabun', sans-serif; 
                    margin: 20px; 
                    color: #2C3E50;
                }
                
                .report-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                h1 { 
                    color: #1976D2; 
                    border-bottom: 2px solid #64B5F6; 
                    padding-bottom: 10px; 
                    margin-bottom: 20px;
                }
                
                h2 { 
                    color: #4A90E2; 
                    margin-top: 25px; 
                    margin-bottom: 15px;
                }
                
                .header-info {
                    background-color: #E3F2FD;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #90CAF9;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                }
                
                th { 
                    background-color: #64B5F6; 
                    color: white; 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 2px solid #1976D2;
                }
                
                td { 
                    padding: 10px 12px; 
                    border-bottom: 1px solid #E3F2FD; 
                }
                
                tr:nth-child(even) { 
                    background-color: #F8FBFF; 
                }
                
                .summary-box { 
                    background-color: #E3F2FD; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                    border: 1px solid #90CAF9;
                }
                
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    color: #7B8A8B; 
                    font-size: 0.9em; 
                    padding-top: 20px;
                    border-top: 1px solid #E3F2FD;
                }
                
                @media print {
                    body { 
                        margin: 0; 
                        padding: 15px; 
                    }
                    
                    .no-print { 
                        display: none; 
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1>รายงานสรุปผลแปลงตามโซน</h1>
                
                <div class="header-info">
                    <p><strong>วันที่สร้างรายงาน:</strong> ${printDate} ${printTime}</p>
                    <p><strong>ไฟล์ต้นฉบับ:</strong> ${fileName}</p>
                    <p><strong>คอลัมน์โซนที่ใช้:</strong> "${selectedColumns.zone}"</p>
                    <p><strong>คอลัมน์พื้นที่ที่ใช้:</strong> "${selectedColumns.area}"</p>
                    <p><strong>คอลัมน์รหัสแปลงที่ใช้:</strong> "${selectedColumns.id || 'ไม่ได้เลือก'}"</p>
                </div>
                
                <div class="summary-box">
                    <h2>สรุปภาพรวม</h2>
                    <p><strong>จำนวนแปลงทั้งหมด:</strong> ${summaryData.totalPlots} แปลง</p>
                    <p><strong>จำนวนโซน:</strong> ${summaryData.uniqueZones.size} โซน</p>
                    <p><strong>พื้นที่รวมทั้งหมด:</strong> ${formatNumber(summaryData.totalArea, 2)} ไร่</p>
                    <p><strong>พื้นที่เฉลี่ยต่อแปลง:</strong> ${formatNumber(summaryData.totalPlots > 0 ? summaryData.totalArea / summaryData.totalPlots : 0, 2)} ไร่</p>
                </div>
                
                <h2>สรุปตามโซน</h2>
                <table>
                    <tr>
                        <th>โซน</th>
                        <th>จำนวนแปลง</th>
                        <th>พื้นที่รวม (ไร่)</th>
                        <th>พื้นที่เฉลี่ย/แปลง</th>
                        <th>ร้อยละ</th>
                    </tr>
    `;
    
    // เรียงลำดับโซนตามจำนวนแปลง
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].count - summaryData.zones[a].count;
    });
    
    sortedZones.forEach(zone => {
        const data = summaryData.zones[zone];
        const percentage = summaryData.totalArea > 0 ? 
            (data.totalArea / summaryData.totalArea) * 100 : 0;
        const avgAreaPerPlot = data.count > 0 ? data.totalArea / data.count : 0;
        
        printContent += `
            <tr>
                <td><strong>${zone}</strong></td>
                <td>${data.count}</td>
                <td>${formatNumber(data.totalArea, 2)}</td>
                <td>${formatNumber(avgAreaPerPlot, 2)}</td>
                <td>${formatNumber(percentage, 1)}%</td>
            </tr>
        `;
    });
    
    printContent += `
                </table>
                
                <div class="footer">
                    <p>ระบบเลือกคอลัมน์สรุปผลจาก CSV</p>
                    <p>รายงานนี้สร้างขึ้นอัตโนมัติ</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 12px 24px; background-color: #1976D2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        พิมพ์รายงาน
                    </button>
                    <button onclick="window.close()" style="padding: 12px 24px; background-color: #7B8A8B; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
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

// ลบไฟล์
function removeFile() {
    csvData = [];
    csvHeaders = [];
    csvColumnSamples = {};
    selectedColumns = {
        zone: null,
        area: null,
        id: null
    };
    
    document.getElementById('csvFileInput').value = '';
    
    // ซ่อนส่วนต่างๆ
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('columnSelectionSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // เคลียร์กริดคอลัมน์
    document.getElementById('columnGrid').innerHTML = '';
    
    showMessage('ลบไฟล์เรียบร้อยแล้ว', 'info');
}

// แสดงข้อความ
function showMessage(message, type = 'info', duration = 3000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
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
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${colorClass} alert-dismissible fade show" role="alert" style="border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <i class="bi bi-${icon} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('afterbegin', alertHtml);
    
    // อัตโนมัติปิดหลังจากระยะเวลาที่กำหนด
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, duration);
}

// แสดง/ซ่อน loading
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generateBtn = document.getElementById('generateReportBtn');
    const browseBtn = document.getElementById('browseBtn');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    
    if (generateBtn) {
        generateBtn.disabled = show;
        generateBtn.innerHTML = show ? 
            '<i class="bi bi-hourglass-split me-2"></i> กำลังประมวลผล...' : 
            '<i class="bi bi-graph-up me-2"></i> สร้างรายงานสรุปผล';
    }
    
    if (browseBtn) {
        browseBtn.disabled = show;
    }
}

// จัดรูปแบบตัวเลข
function formatNumber(num, decimals = 2) {
    return Number(num).toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// เริ่มต้นระบบ
console.log('ระบบเลือกคอลัมน์สรุปผลจาก CSV พร้อมใช้งาน');
showMessage('ระบบพร้อมใช้งาน กรุณาอัปโหลดไฟล์ CSV', 'info');
