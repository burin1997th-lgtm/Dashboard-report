// ระบบสรุปข้อมูลจากตารางตามโซน
// ตัวแปรเก็บข้อมูล
let tableData = [];
let zoneSummary = {};
let cropSummary = {};
let chartInstances = {};

// ค่าคงที่แปลงหน่วย
const RAI_TO_SQM = 1600; // 1 ไร่ = 1600 ตารางเมตร

// ฟังก์ชันแปลงหน่วย
function sqmToRai(sqm) {
    return sqm / RAI_TO_SQM;
}

function raiToSqm(rai) {
    return rai * RAI_TO_SQM;
}

// ฟังก์ชันจัดรูปแบบตัวเลข
function formatNumber(num, decimals = 2) {
    return Number(num).toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// โหลดข้อมูลตัวอย่าง
function loadSampleData() {
    const sampleData = [
        { id: 'A001', zone: 'โซน A', areaSqm: 1600, owner: 'สมชาย', crop: 'ข้าว' },
        { id: 'A002', zone: 'โซน A', areaSqm: 2400, owner: 'สมหญิง', crop: 'อ้อย' },
        { id: 'A003', zone: 'โซน A', areaSqm: 3200, owner: 'สมหมาย', crop: 'ข้าว' },
        { id: 'B001', zone: 'โซน B', areaSqm: 4000, owner: 'สมศรี', crop: 'มันสำปะหลัง' },
        { id: 'B002', zone: 'โซน B', areaSqm: 800, owner: 'สมปอง', crop: 'อ้อย' },
        { id: 'B003', zone: 'โซน B', areaSqm: 1200, owner: 'สมใจ', crop: 'ยางพารา' },
        { id: 'C001', zone: 'โซน C', areaSqm: 3200, owner: 'สมศักดิ์', crop: 'ปาล์มน้ำมัน' },
        { id: 'C002', zone: 'โซน C', areaSqm: 2400, owner: 'สมพร', crop: 'มันสำปะหลัง' },
        { id: 'D001', zone: 'โซน D', areaSqm: 4800, owner: 'สมบูรณ์', crop: 'ข้าว' },
        { id: 'D002', zone: 'โซน D', areaSqm: 1600, owner: 'สมรักษ์', crop: 'อื่นๆ' }
    ];
    
    tableData = sampleData;
    renderTable();
    updateSummary();
}

// เพิ่มแถวข้อมูลใหม่
function addNewRow() {
    const plotId = document.getElementById('plotId').value.trim();
    const zone = document.getElementById('zone').value.trim();
    const area = parseFloat(document.getElementById('area').value);
    const owner = document.getElementById('owner').value.trim();
    const cropType = document.getElementById('cropType').value;
    
    // ตรวจสอบข้อมูล
    if (!plotId || !zone || isNaN(area) || area <= 0) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน: รหัสแปลง, โซน, และพื้นที่ (ต้องมากกว่า 0)');
        return;
    }
    
    // ตรวจสอบรหัสแปลงซ้ำ
    if (tableData.some(row => row.id === plotId)) {
        alert('รหัสแปลงนี้มีอยู่แล้วในระบบ');
        return;
    }
    
    // เพิ่มข้อมูลใหม่
    const newRow = {
        id: plotId,
        zone: zone,
        areaSqm: area,
        owner: owner || 'ไม่ระบุ',
        crop: cropType || 'ไม่ระบุ'
    };
    
    tableData.push(newRow);
    
    // รีเซ็ตฟอร์ม
    document.getElementById('plotId').value = '';
    document.getElementById('zone').value = '';
    document.getElementById('area').value = '';
    document.getElementById('owner').value = '';
    document.getElementById('cropType').value = '';
    
    // อัปเดตตารางและสรุป
    renderTable();
    updateSummary();
    
    // โฟกัสที่ช่องรหัสแปลง
    document.getElementById('plotId').focus();
    
    // แสดงข้อความสำเร็จ
    showToast('เพิ่มข้อมูลสำเร็จ', 'success');
}

// ลบแถวข้อมูล
function deleteRow(plotId) {
    if (confirm(`ต้องการลบข้อมูลแปลง ${plotId} ใช่หรือไม่?`)) {
        tableData = tableData.filter(row => row.id !== plotId);
        renderTable();
        updateSummary();
        showToast('ลบข้อมูลสำเร็จ', 'warning');
    }
}

// แก้ไขแถวข้อมูล
function editRow(plotId) {
    const row = tableData.find(row => row.id === plotId);
    if (row) {
        // เติมข้อมูลลงในฟอร์ม
        document.getElementById('plotId').value = row.id;
        document.getElementById('zone').value = row.zone;
        document.getElementById('area').value = row.areaSqm;
        document.getElementById('owner').value = row.owner;
        document.getElementById('cropType').value = row.crop;
        
        // ลบแถวเดิม
        tableData = tableData.filter(r => r.id !== plotId);
        
        // อัปเดตตาราง
        renderTable();
        
        // แสดงข้อความ
        showToast('กรุณาแก้ไขข้อมูลและกดเพิ่มข้อมูลใหม่', 'info');
    }
}

// อัปโหลดไฟล์ CSV
function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const csvText = document.getElementById('csvText').value;
    
    let csvContent = '';
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            csvContent = e.target.result;
            processCSV(csvContent);
        };
        
        reader.readAsText(file, 'UTF-8');
    } else if (csvText) {
        processCSV(csvText);
    } else {
        alert('กรุณาเลือกไฟล์ CSV หรือวางข้อมูล CSV');
        return;
    }
}

// ประมวลผลข้อมูล CSV
function processCSV(csvContent) {
    try {
        // แยกบรรทัด
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert('ไฟล์ CSV ไม่มีข้อมูลหรือรูปแบบไม่ถูกต้อง');
            return;
        }
        
        // หา delimiter
        let delimiter = ',';
        if (lines[0].includes(';') && !lines[0].includes(',')) {
            delimiter = ';';
        }
        
        // ดึงหัวคอลัมน์
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        // กำหนดคอลัมน์ที่ต้องการ
        const idIndex = headers.findIndex(h => 
            h.toLowerCase().includes('id') || 
            h.toLowerCase().includes('รหัส') || 
            h.toLowerCase().includes('แปลง')
        );
        
        const zoneIndex = headers.findIndex(h => 
            h.toLowerCase().includes('zone') || 
            h.toLowerCase().includes('โซน')
        );
        
        const areaIndex = headers.findIndex(h => 
            h.toLowerCase().includes('area') || 
            h.toLowerCase().includes('พื้นที่') || 
            h.toLowerCase().includes('ขนาด')
        );
        
        const ownerIndex = headers.findIndex(h => 
            h.toLowerCase().includes('owner') || 
            h.toLowerCase().includes('เจ้าของ')
        );
        
        const cropIndex = headers.findIndex(h => 
            h.toLowerCase().includes('crop') || 
            h.toLowerCase().includes('พืช') || 
            h.toLowerCase().includes('ประเภท')
        );
        
        // ตรวจสอบคอลัมน์ที่จำเป็น
        if (idIndex === -1 || zoneIndex === -1 || areaIndex === -1) {
            alert('ไฟล์ CSV ต้องมีคอลัมน์: รหัสแปลง, โซน, และพื้นที่');
            return;
        }
        
        // อ่านข้อมูล
        const newData = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length >= Math.max(idIndex, zoneIndex, areaIndex) + 1) {
                try {
                    const areaValue = parseFloat(values[areaIndex]);
                    if (isNaN(areaValue) || areaValue <= 0) {
                        errorCount++;
                        continue;
                    }
                    
                    const rowData = {
                        id: values[idIndex] || `แปลง${i}`,
                        zone: values[zoneIndex] || 'ไม่ระบุโซน',
                        areaSqm: areaValue,
                        owner: ownerIndex !== -1 ? values[ownerIndex] || 'ไม่ระบุ' : 'ไม่ระบุ',
                        crop: cropIndex !== -1 ? values[cropIndex] || 'ไม่ระบุ' : 'ไม่ระบุ'
                    };
                    
                    newData.push(rowData);
                    successCount++;
                } catch (e) {
                    errorCount++;
                }
            }
        }
        
        // เพิ่มข้อมูลใหม่ (แทนที่ข้อมูลเดิม)
        tableData = newData;
        
        // รีเซ็ต input
        document.getElementById('csvFile').value = '';
        document.getElementById('csvText').value = '';
        
        // อัปเดตตารางและสรุป
        renderTable();
        updateSummary();
        
        // แสดงผล
        showToast(`นำเข้าข้อมูลสำเร็จ ${successCount} แถว${errorCount > 0 ? `, ล้มเหลว ${errorCount} แถว` : ''}`, 'success');
        
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV: ' + error.message);
    }
}

// แสดงข้อมูลในตาราง
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (tableData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2">ไม่มีข้อมูลแปลง</p>
                        <p class="small">กรุณาเพิ่มข้อมูลหรืออัปโหลดไฟล์ CSV</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // เรียงข้อมูลตามโซนและรหัสแปลง
    const sortedData = [...tableData].sort((a, b) => {
        if (a.zone === b.zone) {
            return a.id.localeCompare(b.id);
        }
        return a.zone.localeCompare(b.zone);
    });
    
    // เพิ่มแถวข้อมูล
    sortedData.forEach((row, index) => {
        const areaRai = sqmToRai(row.areaSqm);
        const tr = document.createElement('tr');
        
        // สีของโซน
        const zoneColors = {
            'โซน A': 'primary',
            'โซน B': 'success',
            'โซน C': 'warning',
            'โซน D': 'danger',
            'โซน E': 'info'
        };
        
        const zoneColor = zoneColors[row.zone] || 'secondary';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${row.id}</strong></td>
            <td>
                <span class="badge bg-${zoneColor} zone-badge">${row.zone}</span>
            </td>
            <td>${formatNumber(row.areaSqm, 0)}</td>
            <td>${formatNumber(areaRai, 3)}</td>
            <td>${row.owner}</td>
            <td>${row.crop}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editRow('${row.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRow('${row.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// อัปเดตสรุปสถิติ
function updateSummary() {
    // คำนวณสรุปตามโซน
    zoneSummary = {};
    cropSummary = {};
    
    let totalAreaSqm = 0;
    let totalAreaRai = 0;
    let largestPlot = { areaRai: 0, id: '' };
    
    tableData.forEach(row => {
        const areaRai = sqmToRai(row.areaSqm);
        
        // สรุปตามโซน
        if (!zoneSummary[row.zone]) {
            zoneSummary[row.zone] = {
                count: 0,
                areaSqm: 0,
                areaRai: 0,
                crops: {}
            };
        }
        
        zoneSummary[row.zone].count++;
        zoneSummary[row.zone].areaSqm += row.areaSqm;
        zoneSummary[row.zone].areaRai += areaRai;
        
        // สรุปพืชในโซน
        if (!zoneSummary[row.zone].crops[row.crop]) {
            zoneSummary[row.zone].crops[row.crop] = 0;
        }
        zoneSummary[row.zone].crops[row.crop]++;
        
        // สรุปตามพืช
        if (!cropSummary[row.crop]) {
            cropSummary[row.crop] = {
                count: 0,
                areaRai: 0,
                zones: {}
            };
        }
        
        cropSummary[row.crop].count++;
        cropSummary[row.crop].areaRai += areaRai;
        
        if (!cropSummary[row.crop].zones[row.zone]) {
            cropSummary[row.crop].zones[row.zone] = 0;
        }
        cropSummary[row.crop].zones[row.zone]++;
        
        // คำนวณผลรวมทั้งหมด
        totalAreaSqm += row.areaSqm;
        totalAreaRai += areaRai;
        
        // หาแปลงที่ใหญ่ที่สุด
        if (areaRai > largestPlot.areaRai) {
            largestPlot = { areaRai, id: row.id };
        }
    });
    
    // อัปเดตสถิติสรุป
    document.getElementById('totalPlots').textContent = tableData.length.toLocaleString();
    document.getElementById('totalZones').textContent = Object.keys(zoneSummary).length;
    document.getElementById('totalAreaRai').textContent = formatNumber(totalAreaRai, 2);
    document.getElementById('avgArea').textContent = formatNumber(tableData.length > 0 ? totalAreaRai / tableData.length : 0, 3);
    
    // อัปเดตรายงานตามโซน
    updateZoneSummaryTable();
    
    // อัปเดตรายงานตามพืช
    updateCropSummaryTable();
    
    // อัปเดตการวิเคราะห์
    updateAnalysis();
    
    // อัปเดตรายละเอียด
    updateDetailTable();
    
    // อัปเดตกราฟ
    updateCharts();
    
    // อัปเดตตัวเลือกโซนในฟิลเตอร์
    updateZoneFilterOptions();
}

// อัปเดตตารางสรุปตามโซน
function updateZoneSummaryTable() {
    const tbody = document.getElementById('zoneSummaryTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    const zones = Object.keys(zoneSummary).sort();
    const totalAreaRai = zones.reduce((sum, zone) => sum + zoneSummary[zone].areaRai, 0);
    
    zones.forEach(zone => {
        const data = zoneSummary[zone];
        const percentage = totalAreaRai > 0 ? (data.areaRai / totalAreaRai) * 100 : 0;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${zone}</strong></td>
            <td>${data.count}</td>
            <td>${formatNumber(data.areaRai, 3)}</td>
            <td>${formatNumber(data.areaSqm, 0)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="progress-custom flex-grow-1 me-2">
                        <div class="progress-bar-custom" style="width: ${percentage}%"></div>
                    </div>
                    <span>${formatNumber(percentage, 1)}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// อัปเดตตารางสรุปตามพืช
function updateCropSummaryTable() {
    const tbody = document.getElementById('cropSummaryTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    const crops = Object.keys(cropSummary).sort();
    
    crops.forEach(crop => {
        const data = cropSummary[crop];
        
        // หาโซนหลัก (โซนที่มีพื้นที่นี้มากที่สุด)
        let mainZone = '';
        let maxZoneCount = 0;
        
        Object.keys(data.zones).forEach(zone => {
            if (data.zones[zone] > maxZoneCount) {
                maxZoneCount = data.zones[zone];
                mainZone = zone;
            }
        });
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${crop}</strong></td>
            <td>${data.count}</td>
            <td>${formatNumber(data.areaRai, 3)}</td>
            <td>${mainZone || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// อัปเดตการวิเคราะห์
function updateAnalysis() {
    // หาโซนที่มีพื้นที่มากที่สุด
    let maxZone = '';
    let maxZoneArea = 0;
    
    Object.keys(zoneSummary).forEach(zone => {
        if (zoneSummary[zone].areaRai > maxZoneArea) {
            maxZoneArea = zoneSummary[zone].areaRai;
            maxZone = zone;
        }
    });
    
    // หาพืชที่ปลูกมากที่สุด
    let maxCrop = '';
    let maxCropArea = 0;
    
    Object.keys(cropSummary).forEach(crop => {
        if (cropSummary[crop].areaRai > maxCropArea) {
            maxCropArea = cropSummary[crop].areaRai;
            maxCrop = crop;
        }
    });
    
    // หาแปลงที่ใหญ่ที่สุด
    let largestPlot = { areaRai: 0, id: '' };
    tableData.forEach(row => {
        const areaRai = sqmToRai(row.areaSqm);
        if (areaRai > largestPlot.areaRai) {
            largestPlot = { areaRai, id: row.id };
        }
    });
    
    // อัปเดตค่าสถิติ
    document.getElementById('maxZone').textContent = maxZone || '-';
    document.getElementById('maxCrop').textContent = maxCrop || '-';
    document.getElementById('largestPlot').textContent = largestPlot.id ? `${formatNumber(largestPlot.areaRai, 2)} (${largestPlot.id})` : '-';
    document.getElementById('zoneDiversity').textContent = Object.keys(zoneSummary).length;
}

// อัปเดตรายละเอียด
function updateDetailTable() {
    const tbody = document.getElementById('detailTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (tableData.length === 0) return;
    
    // คำนวณพื้นที่รวมแต่ละโซน
    const zoneTotalArea = {};
    tableData.forEach(row => {
        const areaRai = sqmToRai(row.areaSqm);
        if (!zoneTotalArea[row.zone]) {
            zoneTotalArea[row.zone] = 0;
        }
        zoneTotalArea[row.zone] += areaRai;
    });
    
    // เรียงข้อมูล
    const sortedData = [...tableData].sort((a, b) => {
        if (a.zone === b.zone) {
            return sqmToRai(b.areaSqm) - sqmToRai(a.areaSqm); // เรียงจากมากไปน้อย
        }
        return a.zone.localeCompare(b.zone);
    });
    
    // เพิ่มแถวข้อมูล
    sortedData.forEach(row => {
        const areaRai = sqmToRai(row.areaSqm);
        const percentage = zoneTotalArea[row.zone] > 0 ? (areaRai / zoneTotalArea[row.zone]) * 100 : 0;
        
        // หมายเหตุ
        let note = '';
        if (areaRai > 10) note = '<span class="badge bg-warning">แปลงใหญ่</span>';
        else if (areaRai < 1) note = '<span class="badge bg-info">แปลงเล็ก</span>';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.id}</strong></td>
            <td>${row.zone}</td>
            <td>${formatNumber(areaRai, 3)}</td>
            <td>${formatNumber(row.areaSqm, 0)}</td>
            <td>${row.owner}</td>
            <td>${row.crop}</td>
            <td>${formatNumber(percentage, 1)}%</td>
            <td>${note}</td>
        `;
        tbody.appendChild(tr);
    });
}

// อัปเดตตัวเลือกโซนในฟิลเตอร์
function updateZoneFilterOptions() {
    const filterSelect = document.getElementById('filterZoneDetail');
    filterSelect.innerHTML = '<option value="">ทั้งหมด (โซน)</option>';
    
    Object.keys(zoneSummary).sort().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        filterSelect.appendChild(option);
    });
}

// อัปเดตกราฟ
function updateCharts() {
    updateZoneChart();
    updateZonePieChart();
    updateZoneBarChart();
    updateCropBarChart();
}

// กราฟสรุปตามโซน
function updateZoneChart() {
    const ctx = document.getElementById('zoneChart').getContext('2d');
    
    // ลบกราฟเก่าถ้ามี
    if (chartInstances.zoneChart) {
        chartInstances.zoneChart.destroy();
    }
    
    const zones = Object.keys(zoneSummary).sort();
    const counts = zones.map(zone => zoneSummary[zone].count);
    const areas = zones.map(zone => zoneSummary[zone].areaRai);
    
    // สีสำหรับแต่ละโซน
    const backgroundColors = [
        'rgba(44, 120, 108, 0.7)',
        'rgba(0, 68, 69, 0.7)',
        'rgba(248, 180, 0, 0.7)',
        'rgba(220, 53, 69, 0.7)',
        'rgba(13, 110, 253, 0.7)',
        'rgba(102, 16, 242, 0.7)',
        'rgba(214, 51, 132, 0.7)'
    ];
    
    chartInstances.zoneChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [
                {
                    label: 'จำนวนแปลง',
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'พื้นที่รวม (ไร่)',
                    data: areas,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
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
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'พื้นที่ (ไร่)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y + ' แปลง';
                            } else {
                                label += formatNumber(context.parsed.y, 3) + ' ไร่';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// กราฟวงกลมแสดงสัดส่วนพื้นที่ตามโซน
function updateZonePieChart() {
    const ctx = document.getElementById('zonePieChart').getContext('2d');
    
    if (chartInstances.zonePieChart) {
        chartInstances.zonePieChart.destroy();
    }
    
    const zones = Object.keys(zoneSummary).sort();
    const areas = zones.map(zone => zoneSummary[zone].areaRai);
    
    const backgroundColors = [
        'rgba(44, 120, 108, 0.7)',
        'rgba(0, 68, 69, 0.7)',
        'rgba(248, 180, 0, 0.7)',
        'rgba(220, 53, 69, 0.7)',
        'rgba(13, 110, 253, 0.7)',
        'rgba(102, 16, 242, 0.7)',
        'rgba(214, 51, 132, 0.7)'
    ];
    
    chartInstances.zonePieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: zones,
            datasets: [{
                data: areas,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${formatNumber(value, 3)} ไร่ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// กราฟแท่งแสดงการกระจายพื้นที่ตามโซน
function updateZoneBarChart() {
    const ctx = document.getElementById('zoneBarChart').getContext('2d');
    
    if (chartInstances.zoneBarChart) {
        chartInstances.zoneBarChart.destroy();
    }
    
    const zones = Object.keys(zoneSummary).sort();
    const areas = zones.map(zone => zoneSummary[zone].areaRai);
    const avgAreas = zones.map(zone => zoneSummary[zone].areaRai / zoneSummary[zone].count);
    
    chartInstances.zoneBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [
                {
                    label: 'พื้นที่รวม (ไร่)',
                    data: areas,
                    backgroundColor: 'rgba(44, 120, 108, 0.7)',
                    borderColor: 'rgba(44, 120, 108, 1)',
                    borderWidth: 1
                },
                {
                    label: 'พื้นที่เฉลี่ย/แปลง (ไร่)',
                    data: avgAreas,
                    backgroundColor: 'rgba(248, 180, 0, 0.7)',
                    borderColor: 'rgba(248, 180, 0, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'พื้นที่ (ไร่)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatNumber(context.parsed.y, 3) + ' ไร่';
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// กราฟแท่งแสดงการกระจายพืชตามโซน
function updateCropBarChart() {
    const ctx = document.getElementById('cropBarChart').getContext('2d');
    
    if (chartInstances.cropBarChart) {
        chartInstances.cropBarChart.destroy();
    }
    
    const crops = Object.keys(cropSummary).sort();
    const cropAreas = crops.map(crop => cropSummary[crop].areaRai);
    
    // สีสำหรับพืชแต่ละประเภท
    const cropColors = {
        'ข้าว': 'rgba(44, 120, 108, 0.7)',
        'อ้อย': 'rgba(0, 68, 69, 0.7)',
        'มันสำปะหลัง': 'rgba(248, 180, 0, 0.7)',
        'ยางพารา': 'rgba(220, 53, 69, 0.7)',
        'ปาล์มน้ำมัน': 'rgba(13, 110, 253, 0.7)',
        'อื่นๆ': 'rgba(102, 16, 242, 0.7)',
        'ไม่ระบุ': 'rgba(108, 117, 125, 0.7)'
    };
    
    const backgroundColors = crops.map(crop => cropColors[crop] || 'rgba(108, 117, 125, 0.7)');
    
    chartInstances.cropBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: crops,
            datasets: [{
                label: 'พื้นที่ปลูก (ไร่)',
                data: cropAreas,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
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
                        text: 'พื้นที่ (ไร่)'
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
                            return `พื้นที่: ${formatNumber(context.parsed.y, 3)} ไร่`;
                        }
                    }
                }
            }
        }
    });
}

// สร้างรายงาน
function generateReport() {
    if (tableData.length === 0) {
        alert('ไม่มีข้อมูลที่จะสร้างรายงาน');
        return;
    }
    
    const now = new Date();
    const reportDate = now.toLocaleDateString('th-TH');
    const reportTime = now.toLocaleTimeString('th-TH');
    
    const totalAreaRai = tableData.reduce((sum, row) => sum + sqmToRai(row.areaSqm), 0);
    const zoneCount = Object.keys(zoneSummary).length;
    
    let reportHtml = `
        <html>
        <head>
            <title>รายงานสรุปข้อมูลแปลงตามโซน</title>
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
            </style>
        </head>
        <body>
            <h1>รายงานสรุปข้อมูลแปลงตามโซน</h1>
            <p><strong>วันที่สร้างรายงาน:</strong> ${reportDate} ${reportTime}</p>
            
            <div class="summary-box">
                <h3>สรุปภาพรวม</h3>
                <p><strong>จำนวนแปลงทั้งหมด:</strong> ${tableData.length} แปลง</p>
                <p><strong>จำนวนโซน:</strong> ${zoneCount} โซน</p>
                <p><strong>พื้นที่รวมทั้งหมด:</strong> ${formatNumber(totalAreaRai, 3)} ไร่ (${formatNumber(totalAreaRai * RAI_TO_SQM, 0)} ตร.ม.)</p>
                <p><strong>พื้นที่เฉลี่ยต่อแปลง:</strong> ${formatNumber(tableData.length > 0 ? totalAreaRai / tableData.length : 0, 3)} ไร่</p>
            </div>
            
            <h2>สรุปตามโซน</h2>
            <table>
                <tr>
                    <th>โซน</th>
                    <th>จำนวนแปลง</th>
                    <th>พื้นที่รวม (ไร่)</th>
                    <th>พื้นที่รวม (ตร.ม.)</th>
                    <th>ร้อยละ</th>
                </tr>
    `;
    
    const zones = Object.keys(zoneSummary).sort();
    zones.forEach(zone => {
        const data = zoneSummary[zone];
        const percentage = totalAreaRai > 0 ? (data.areaRai / totalAreaRai) * 100 : 0;
        reportHtml += `
            <tr>
                <td>${zone}</td>
                <td>${data.count}</td>
                <td>${formatNumber(data.areaRai, 3)}</td>
                <td>${formatNumber(data.areaSqm, 0)}</td>
                <td>${formatNumber(percentage, 1)}%</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </table>
            
            <h2>สรุปตามประเภทพืช</h2>
            <table>
                <tr>
                    <th>ประเภทพืช</th>
                    <th>จำนวนแปลง</th>
                    <th>พื้นที่รวม (ไร่)</th>
                    <th>โซนหลัก</th>
                </tr>
    `;
    
    const crops = Object.keys(cropSummary).sort();
    crops.forEach(crop => {
        const data = cropSummary[crop];
        
        // หาโซนหลัก
        let mainZone = '';
        let maxZoneCount = 0;
        Object.keys(data.zones).forEach(zone => {
            if (data.zones[zone] > maxZoneCount) {
                maxZoneCount = data.zones[zone];
                mainZone = zone;
            }
        });
        
        reportHtml += `
            <tr>
                <td>${crop}</td>
                <td>${data.count}</td>
                <td>${formatNumber(data.areaRai, 3)}</td>
                <td>${mainZone || '-'}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </table>
            
            <h2>ข้อมูลแปลงทั้งหมด</h2>
            <table>
                <tr>
                    <th>ลำดับ</th>
                    <th>รหัสแปลง</th>
                    <th>โซน</th>
                    <th>พื้นที่ (ไร่)</th>
                    <th>พื้นที่ (ตร.ม.)</th>
                    <th>เจ้าของ</th>
                    <th>ประเภทพืช</th>
                </tr>
    `;
    
    tableData.forEach((row, index) => {
        const areaRai = sqmToRai(row.areaSqm);
        reportHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${row.id}</td>
                <td>${row.zone}</td>
                <td>${formatNumber(areaRai, 3)}</td>
                <td>${formatNumber(row.areaSqm, 0)}</td>
                <td>${row.owner}</td>
                <td>${row.crop}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </table>
            
            <div class="footer">
                <p>ระบบสรุปข้อมูลจากตารางตามโซน | 1 ไร่ = 1600 ตารางเมตร</p>
                <p>รายงานนี้สร้างขึ้นอัตโนมัติโดยระบบ</p>
            </div>
        </body>
        </html>
    `;
    
    // เปิดหน้าต่างใหม่สำหรับรายงาน
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
}

// ส่งออกเป็น Excel
function exportToExcel() {
    if (tableData.length === 0) {
        alert('ไม่มีข้อมูลที่จะส่งออก');
        return;
    }
    
    let csvContent = "รหัสแปลง,โซน,พื้นที่ (ตร.ม.),พื้นที่ (ไร่),เจ้าของ,ประเภทพืช\n";
    
    tableData.forEach(row => {
        const areaRai = sqmToRai(row.areaSqm);
        csvContent += `${row.id},${row.zone},${row.areaSqm},${areaRai.toFixed(3)},${row.owner},${row.crop}\n`;
    });
    
    // เพิ่มสรุปตามโซน
    csvContent += "\n\nสรุปตามโซน\nโซน,จำนวนแปลง,พื้นที่รวม (ไร่),พื้นที่รวม (ตร.ม.)\n";
    
    Object.keys(zoneSummary).sort().forEach(zone => {
        const data = zoneSummary[zone];
        csvContent += `${zone},${data.count},${data.areaRai.toFixed(3)},${data.areaSqm}\n`;
    });
    
    // สร้างไฟล์
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ข้อมูลแปลง_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// แสดง Toast message
function showToast(message, type = 'info') {
    // สร้าง toast element
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-info-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // เพิ่ม toast ลงใน body
    const toastContainer = document.getElementById('toastContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    })();
    
    toastContainer.innerHTML += toastHtml;
    
    // แสดง toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // ลบ toast หลังจากซ่อน
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

// ฟังก์ชันค้นหาข้อมูลในรายละเอียด
function searchDetail() {
    const searchText = document.getElementById('searchDetail').value.toLowerCase();
    const filterZone = document.getElementById('filterZoneDetail').value;
    
    const rows = document.querySelectorAll('#detailTable tbody tr');
    
    rows.forEach(row => {
        const plotId = row.cells[0].textContent.toLowerCase();
        const zone = row.cells[1].textContent;
        const owner = row.cells[4].textContent.toLowerCase();
        
        const matchesSearch = searchText === '' || 
                             plotId.includes(searchText) || 
                             owner.includes(searchText);
        
        const matchesZone = filterZone === '' || zone === filterZone;
        
        row.style.display = (matchesSearch && matchesZone) ? '' : 'none';
    });
}

// ฟังก์ชันเคลียร์ข้อมูลทั้งหมด
function clearAllData() {
    if (confirm('ต้องการลบข้อมูลทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        tableData = [];
        renderTable();
        updateSummary();
        showToast('ล้างข้อมูลทั้งหมดสำเร็จ', 'warning');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Event Listeners
    document.getElementById('addRowBtn').addEventListener('click', addNewRow);
    document.getElementById('importCsvBtn').addEventListener('click', uploadCSV);
    document.getElementById('loadSampleData').addEventListener('click', loadSampleData);
    document.getElementById('clearTableBtn').addEventListener('click', clearAllData);
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('helpBtn').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('helpModal')).show();
    });
    
    // ฟังก์ชันค้นหา
    document.getElementById('searchDetail').addEventListener('input', searchDetail);
    document.getElementById('filterZoneDetail').addEventListener('change', searchDetail);
    
    // กด Enter ในฟอร์มเพื่อเพิ่มข้อมูล
    document.getElementById('plotId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewRow();
    });
    
    document.getElementById('zone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewRow();
    });
    
    document.getElementById('area').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewRow();
    });
    
    // ส่งออกเป็น PDF (จำลอง)
    document.getElementById('exportPdfBtn').addEventListener('click', function() {
        alert('สำหรับการส่งออกเป็น PDF แบบเต็มรูปแบบ ควรใช้ไลบรารีเฉพาะเช่น jsPDF\n\nขณะนี้ระบบจะสร้างรายงาน HTML แทน');
        generateReport();
    });
    
    // โหลดข้อมูลตัวอย่างเริ่มต้น
    loadSampleData();
    
    console.log('ระบบสรุปข้อมูลจากตารางตามโซน พร้อมใช้งาน');
});
