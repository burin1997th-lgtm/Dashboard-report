// ระบบเลือกคอลัมน์สรุปผลจาก CSV

// ตัวแปรเก็บข้อมูล
let csvData = [];
let csvHeaders = [];
let selectedColumns = {
    zone: null,
    area: null,
    id: null
};
let summaryData = {};
let plotsData = [];
let zoneChart = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("ระบบเริ่มทำงานแล้ว");
    
    // Browse button
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            document.getElementById('csvFileInput').click();
        });
    }
    
    // File input change
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
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
    
    const exportPlotsBtn = document.getElementById('exportPlotsBtn');
    if (exportPlotsBtn) {
        exportPlotsBtn.addEventListener('click', exportPlots);
    }
    
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    // Search and filter
    const searchPlot = document.getElementById('searchPlot');
    if (searchPlot) {
        searchPlot.addEventListener('input', filterPlots);
    }
    
    const filterZone = document.getElementById('filterZone');
    if (filterZone) {
        filterZone.addEventListener('change', filterPlots);
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
            
            // แสดงตัวเลือกคอลัมน์
            showColumnOptions();
            
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
    
    for (let i = 1; i < lines.length; i++) {
        try {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length === csvHeaders.length) {
                const row = {};
                csvHeaders.forEach((header, index) => {
                    row[header] = values[index] || '';
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

// แสดงตัวเลือกคอลัมน์
function showColumnOptions() {
    const columnSelector = document.getElementById('columnSelector');
    if (!columnSelector) return;
    
    // แสดงส่วนเลือกคอลัมน์
    columnSelector.style.display = 'block';
    
    // สร้างตัวเลือกคอลัมน์โซน
    createColumnOptions('zoneColumnOptions', 'เลือกคอลัมน์โซน', 'zone', true);
    
    // สร้างตัวเลือกคอลัมน์พื้นที่
    createColumnOptions('areaColumnOptions', 'เลือกคอลัมน์พื้นที่ (ไร่)', 'area', true);
    
    // สร้างตัวเลือกคอลัมน์รหัสแปลง
    createColumnOptions('idColumnOptions', 'เลือกคอลัมน์รหัสแปลง (ไม่บังคับ)', 'id', false);
}

// สร้างตัวเลือกคอลัมน์
function createColumnOptions(containerId, title, columnType, required) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // สร้างตัวเลือก "ไม่เลือก"
    if (!required) {
        const noneOption = document.createElement('div');
        noneOption.className = 'column-option';
        noneOption.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="${columnType}Column" id="${columnType}None" value="" ${!selectedColumns[columnType] ? 'checked' : ''}>
                <label class="form-check-label" for="${columnType}None" style="color: var(--text-light);">
                    <i class="bi bi-dash-circle me-2"></i>ไม่เลือก
                </label>
            </div>
        `;
        noneOption.addEventListener('click', () => {
            const radio = noneOption.querySelector('input[type="radio"]');
            radio.checked = true;
            selectedColumns[columnType] = null;
            updateColumnSelection(columnType, '');
        });
        container.appendChild(noneOption);
    }
    
    // สร้างตัวเลือกสำหรับแต่ละคอลัมน์
    csvHeaders.forEach((header, index) => {
        const columnOption = document.createElement('div');
        columnOption.className = 'column-option';
        
        // ตรวจสอบว่าคอลัมน์นี้เหมาะกับประเภทนี้หรือไม่
        const isRecommended = isRecommendedForType(header, columnType);
        const recommendedText = isRecommended ? '<span class="badge bg-success ms-2">แนะนำ</span>' : '';
        
        columnOption.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="${columnType}Column" id="${columnType}${index}" value="${header}" ${selectedColumns[columnType] === header ? 'checked' : ''}>
                <label class="form-check-label" for="${columnType}${index}">
                    ${header} ${recommendedText}
                </label>
            </div>
        `;
        
        columnOption.addEventListener('click', () => {
            const radio = columnOption.querySelector('input[type="radio"]');
            radio.checked = true;
            selectedColumns[columnType] = header;
            updateColumnSelection(columnType, header);
        });
        
        container.appendChild(columnOption);
    });
}

// ตรวจสอบว่าคอลัมน์แนะนำสำหรับประเภทนี้หรือไม่
function isRecommendedForType(columnName, type) {
    const columnNameLower = columnName.toLowerCase();
    
    switch(type) {
        case 'zone':
            return columnNameLower.includes('โซน') || 
                   columnNameLower.includes('zone') || 
                   columnNameLower.includes('พื้นที่');
        case 'area':
            return columnNameLower.includes('ไร่') || 
                   columnNameLower.includes('area') || 
                   columnNameLower.includes('พื้นที่') ||
                   columnNameLower.includes('ขนาด');
        case 'id':
            return columnNameLower.includes('รหัส') || 
                   columnNameLower.includes('id') || 
                   columnNameLower.includes('แปลง') ||
                   columnNameLower.includes('เลขที่');
        default:
            return false;
    }
}

// อัปเดตการเลือกคอลัมน์
function updateColumnSelection(type, value) {
    selectedColumns[type] = value;
    console.log(`เลือกคอลัมน์ ${type}: ${value}`);
}

// สร้างรายงานสรุปผล
function generateReport() {
    console.log("เริ่มสร้างรายงานสรุปผล");
    
    if (csvData.length === 0) {
        showMessage('กรุณาอัปโหลดไฟล์ CSV ก่อน', 'warning');
        return;
    }
    
    // ตรวจสอบว่ามีการเลือกคอลัมน์โซนหรือไม่
    if (!selectedColumns.zone) {
        showMessage('กรุณาเลือกคอลัมน์โซนสำหรับสรุปผล', 'warning');
        return;
    }
    
    // ตรวจสอบว่ามีการเลือกคอลัมน์พื้นที่หรือไม่
    if (!selectedColumns.area) {
        showMessage('กรุณาเลือกคอลัมน์พื้นที่ (ไร่) สำหรับสรุปผล', 'warning');
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
            
            // แสดงตารางแปลง
            displayPlotsTable();
            
            // แสดงการวิเคราะห์
            displayAnalysis();
            
            // แสดงส่วนผลลัพธ์
            document.getElementById('resultsSection').style.display = 'block';
            
            // เลื่อนไปยังผลลัพธ์
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
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
        uniqueZones: new Set(),
        maxZonePlots: { name: '', count: 0 },
        maxZoneArea: { name: '', area: 0 },
        largestPlot: { id: '', area: 0 }
    };
    
    plotsData.forEach(plot => {
        const zone = plot.zone;
        const area = plot.area;
        
        // เพิ่มข้อมูลโซน
        if (!summaryData.zones[zone]) {
            summaryData.zones[zone] = {
                count: 0,
                totalArea: 0,
                plots: []
            };
        }
        
        summaryData.zones[zone].count++;
        summaryData.zones[zone].totalArea += area;
        summaryData.zones[zone].plots.push(plot);
        
        // อัพเดทผลรวม
        summaryData.totalArea += area;
        summaryData.uniqueZones.add(zone);
        
        // ค้นหาโซนที่มีแปลงมากที่สุด
        if (summaryData.zones[zone].count > summaryData.maxZonePlots.count) {
            summaryData.maxZonePlots = { name: zone, count: summaryData.zones[zone].count };
        }
        
        // ค้นหาโซนที่มีพื้นที่มากที่สุด
        if (summaryData.zones[zone].totalArea > summaryData.maxZoneArea.area) {
            summaryData.maxZoneArea = { name: zone, area: summaryData.zones[zone].totalArea };
        }
        
        // ค้นหาแปลงที่ใหญ่ที่สุด
        if (area > summaryData.largestPlot.area) {
            summaryData.largestPlot = { id: plot.id, area: area };
        }
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
                <span class="badge" style="background-color: ${getZoneColor(plot.zone)}">${plot.zone}</span>
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

// กรองแปลง
function filterPlots() {
    updatePlotsTable();
}

// แสดงการวิเคราะห์
function displayAnalysis() {
    // อัพเดทสถิติสำคัญ
    document.getElementById('maxPlotsZone').textContent = `${summaryData.maxZonePlots.name} (${summaryData.maxZonePlots.count} แปลง)`;
    document.getElementById('maxAreaZone').textContent = `${summaryData.maxZoneArea.name} (${formatNumber(summaryData.maxZoneArea.area, 2)} ไร่)`;
    document.getElementById('largestPlot').textContent = `${summaryData.largestPlot.id} (${formatNumber(summaryData.largestPlot.area, 2)} ไร่)`;
    
    const avgArea = summaryData.totalPlots > 0 ? summaryData.totalArea / summaryData.totalPlots : 0;
    document.getElementById('averagePlotArea').textContent = formatNumber(avgArea, 2);
    
    // สร้างกราฟ
    createZoneChart();
}

// สร้างกราฟโซน
function createZoneChart() {
    const ctx = document.getElementById('zoneChart')?.getContext('2d');
    if (!ctx) return;
    
    // ลบกราฟเก่าถ้ามี
    if (zoneChart) {
        zoneChart.destroy();
    }
    
    // เรียงลำดับโซนตามจำนวนแปลง
    const sortedZones = Object.keys(summaryData.zones).sort((a, b) => {
        return summaryData.zones[b].count - summaryData.zones[a].count;
    });
    
    const zoneNames = sortedZones;
    const plotCounts = zoneNames.map(zone => summaryData.zones[zone].count);
    
    // สีสำหรับแต่ละโซน
    const backgroundColors = zoneNames.map(zone => getZoneColor(zone));
    
    zoneChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zoneNames,
            datasets: [{
                label: 'จำนวนแปลง',
                data: plotCounts,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => darkenColor(color, 20)),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'จำนวนแปลง'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'โซน'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `จำนวนแปลง: ${context.parsed.y} แปลง`;
                        }
                    }
                }
            }
        }
    });
}

// ดึงสีสำหรับโซน
function getZoneColor(zone) {
    // สร้างสีจาก hash ของชื่อโซน
    let hash = 0;
    for (let i = 0; i < zone.length; i++) {
        hash = zone.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // สร้างสีจาก pastel palette
    const colors = [
        '#B0E0E6', // Powder Blue
        '#87CEEB', // Sky Blue
        '#98FB98', // Pale Green
        '#FFDAB9', // Peach Puff
        '#E6E6FA', // Lavender
        '#F0E68C', // Khaki
        '#DDA0DD', // Plum
        '#AFEEEE'  // Pale Turquoise
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// ทำให้สีเข้มขึ้น
function darkenColor(color, percent) {
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);

    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
                    color: #2F4F4F;
                }
                
                .report-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                h1 { 
                    color: #4169E1; 
                    border-bottom: 2px solid #B0E0E6; 
                    padding-bottom: 10px; 
                    margin-bottom: 20px;
                }
                
                h2 { 
                    color: #4682B4; 
                    margin-top: 25px; 
                    margin-bottom: 15px;
                }
                
                .header-info {
                    background-color: #F0F8FF;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #B0E0E6;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                }
                
                th { 
                    background-color: #B0E0E6; 
                    color: #2F4F4F; 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 2px solid #6495ED;
                }
                
                td { 
                    padding: 10px 12px; 
                    border-bottom: 1px solid #E6F3FF; 
                }
                
                tr:nth-child(even) { 
                    background-color: #F8FDFF; 
                }
                
                .summary-box { 
                    background-color: #F0F8FF; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                    border: 1px solid #B0E0E6;
                }
                
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    color: #708090; 
                    font-size: 0.9em; 
                    padding-top: 20px;
                    border-top: 1px solid #E6F3FF;
                }
                
                .stat-number {
                    font-weight: bold;
                    color: #4169E1;
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
                <h1>📊 รายงานสรุปผลแปลงตามโซน</h1>
                
                <div class="header-info">
                    <p><strong>วันที่สร้างรายงาน:</strong> ${printDate} ${printTime}</p>
                    <p><strong>ไฟล์ต้นฉบับ:</strong> ${fileName}</p>
                    <p><strong>คอลัมน์โซนที่ใช้:</strong> "${selectedColumns.zone}"</p>
                    <p><strong>คอลัมน์พื้นที่ที่ใช้:</strong> "${selectedColumns.area}"</p>
                </div>
                
                <div class="summary-box">
                    <h2>📈 สรุปภาพรวม</h2>
                    <p><strong>จำนวนแปลงทั้งหมด:</strong> <span class="stat-number">${summaryData.totalPlots}</span> แปลง</p>
                    <p><strong>จำนวนโซน:</strong> <span class="stat-number">${summaryData.uniqueZones.size}</span> โซน</p>
                    <p><strong>พื้นที่รวมทั้งหมด:</strong> <span class="stat-number">${formatNumber(summaryData.totalArea, 2)}</span> ไร่</p>
                    <p><strong>พื้นที่เฉลี่ยต่อแปลง:</strong> <span class="stat-number">${formatNumber(summaryData.totalPlots > 0 ? summaryData.totalArea / summaryData.totalPlots : 0, 2)}</span> ไร่</p>
                </div>
                
                <h2>🗺️ สรุปตามโซน</h2>
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
                    <p>รายงานนี้สร้างขึ้นอัตโนมัติจากไฟล์ CSV</p>
                    <p>© 2023 กรมพัฒนาที่ดิน</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 12px 24px; background-color: #4169E1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                        🖨️ พิมพ์รายงาน
                    </button>
                    <button onclick="window.close()" style="padding: 12px 24px; background-color: #708090; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
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
    csvData = [];
    csvHeaders = [];
    selectedColumns = {
        zone: null,
        area: null,
        id: null
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
        <div id="${alertId}" class="alert alert-custom alert-${colorClass} alert-dismissible fade show" role="alert">
            <i class="bi bi-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
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
            '<i class="bi bi-graph-up me-2"></i> สร้างรายงานสรุปผล';
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
