// ตัวแปรเก็บข้อมูล
let csvData = [];
let columns = [];
let results = {
    zones: {},
    totalAreaRai: 0,
    totalAreaSqm: 0,
    totalPlots: 0,
    plotDetails: []
};

// ค่าคงที่แปลงหน่วย
const RAI_TO_SQM = 1600; // 1 ไร่ = 1600 ตารางเมตร

// อัปโหลดไฟล์ CSV
document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const content = event.target.result;
            parseCSV(content);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
});

// แปลงข้อมูล CSV
function parseCSV(content) {
    // แยกบรรทัด
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        alert('ไฟล์ CSV ว่างเปล่าหรือรูปแบบไม่ถูกต้อง');
        return;
    }
    
    // แยกคอลัมน์ (รองรับทั้ง CSV ที่ใช้ , และ ;)
    let delimiter = ',';
    if (lines[0].includes(';') && !lines[0].includes(',')) {
        delimiter = ';';
    }
    
    // ดึงคอลัมน์จากบรรทัดแรก
    columns = lines[0].split(delimiter).map(col => col.trim());
    
    // ดึงข้อมูล
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(val => val.trim());
        if (values.length === columns.length) {
            const row = {};
            columns.forEach((col, index) => {
                row[col] = values[index];
            });
            csvData.push(row);
        }
    }
    
    // อัปเดต dropdowns
    updateColumnDropdowns();
    
    // แสดงตัวอย่างข้อมูล
    showPreview();
    
    console.log('อัปโหลดไฟล์สำเร็จ:', csvData.length, 'แถว');
}

// อัปเดต dropdown สำหรับเลือกคอลัมน์
function updateColumnDropdowns() {
    const zoneColumnSelect = document.getElementById('zoneColumn');
    const areaColumnSelect = document.getElementById('areaColumn');
    
    // ล้าง options เก่า
    zoneColumnSelect.innerHTML = '<option value="">เลือกคอลัมน์โซน</option>';
    areaColumnSelect.innerHTML = '<option value="">เลือกคอลัมน์พื้นที่</option>';
    
    // เพิ่ม options ใหม่
    columns.forEach(column => {
        const zoneOption = document.createElement('option');
        zoneOption.value = column;
        zoneOption.textContent = column;
        zoneColumnSelect.appendChild(zoneOption);
        
        const areaOption = document.createElement('option');
        areaOption.value = column;
        areaOption.textContent = column;
        areaColumnSelect.appendChild(areaOption);
    });
    
    // พยายามเลือกคอลัมน์ที่เกี่ยวข้องกับโซนและพื้นที่อัตโนมัติ
    autoSelectColumns();
}

// เลือกคอลัมน์อัตโนมัติจากชื่อ
function autoSelectColumns() {
    const zoneColumnSelect = document.getElementById('zoneColumn');
    const areaColumnSelect = document.getElementById('areaColumn');
    
    // ค้นหาคอลัมน์ที่มีคำว่า "โซน", "zone", "พื้นที่", "area" ฯลฯ
    const zoneKeywords = ['โซน', 'zone', 'zones', 'zon', 'พื้นที่'];
    const areaKeywords = ['พื้นที่', 'area', 'ขนาด', 'ตร.ม.', 'ไร่', 'sqm', 'rai'];
    
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i].toLowerCase();
        
        // ค้นหาโซน
        if (zoneKeywords.some(keyword => col.includes(keyword.toLowerCase()))) {
            if (!zoneColumnSelect.value) {
                zoneColumnSelect.value = columns[i];
            }
        }
        
        // ค้นหาพื้นที่
        if (areaKeywords.some(keyword => col.includes(keyword.toLowerCase()))) {
            if (!areaColumnSelect.value) {
                areaColumnSelect.value = columns[i];
            }
        }
    }
}

// แสดงตัวอย่างข้อมูล
function showPreview() {
    const previewTable = document.getElementById('previewTable');
    
    // อัปเดต header
    const thead = previewTable.querySelector('thead tr');
    thead.innerHTML = '';
    columns.slice(0, 4).forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        thead.appendChild(th);
    });
    
    // อัปเดต body (แสดงสูงสุด 5 แถว)
    const tbody = previewTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    const rowCount = Math.min(csvData.length, 5);
    for (let i = 0; i < rowCount; i++) {
        const row = csvData[i];
        const tr = document.createElement('tr');
        
        columns.slice(0, 4).forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    }
}

// คำนวณพื้นที่
document.getElementById('calculateBtn').addEventListener('click', function() {
    const zoneColumn = document.getElementById('zoneColumn').value;
    const areaColumn = document.getElementById('areaColumn').value;
    const areaUnit = document.querySelector('input[name="areaUnit"]:checked').value;
    
    // ตรวจสอบข้อมูล
    if (!zoneColumn || !areaColumn) {
        alert('กรุณาเลือกคอลัมน์โซนและคอลัมน์พื้นที่');
        return;
    }
    
    if (csvData.length === 0) {
        alert('กรุณาอัปโหลดไฟล์ CSV ก่อน');
        return;
    }
    
    // แสดง progress bar
    const progressBar = document.getElementById('progressBar');
    const progressBarInner = progressBar.querySelector('.progress-bar');
    progressBar.style.display = 'block';
    progressBarInner.style.width = '0%';
    
    // คำนวณ (จำลองการโหลด)
    setTimeout(() => {
        calculateAreas(zoneColumn, areaColumn, areaUnit);
        progressBarInner.style.width = '100%';
        
        // ซ่อน progress bar หลังจากเสร็จสิ้น
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 500);
    }, 500);
});

// ฟังก์ชันคำนวณพื้นที่
function calculateAreas(zoneColumn, areaColumn, areaUnit) {
    // รีเซ็ตผลลัพธ์
    results = {
        zones: {},
        totalAreaRai: 0,
        totalAreaSqm: 0,
        totalPlots: 0,
        plotDetails: []
    };
    
    // ตัวนับสำหรับรหัสแปลง (ถ้าไม่มีคอลัมน์รหัส)
    let plotCounter = 1;
    
    // วิเคราะห์ข้อมูล
    csvData.forEach((row, index) => {
        const zone = row[zoneColumn];
        let areaValue = parseFloat(row[areaColumn]);
        
        // ตรวจสอบค่าพื้นที่
        if (isNaN(areaValue) || areaValue <= 0) {
            console.warn(`แถวที่ ${index + 1}: ค่าพื้นที่ไม่ถูกต้อง, ใช้ค่า 0 แทน`);
            areaValue = 0;
        }
        
        // แปลงหน่วยถ้าจำเป็น
        let areaSqm, areaRai;
        if (areaUnit === 'rai') {
            // ถ้าหน่วยเป็นไร่ ให้แปลงเป็นตารางเมตร
            areaRai = areaValue;
            areaSqm = areaValue * RAI_TO_SQM;
        } else {
            // ถ้าหน่วยเป็นตารางเมตร ให้แปลงเป็นไร่
            areaSqm = areaValue;
            areaRai = areaValue / RAI_TO_SQM;
        }
        
        // ค้นหารหัสแปลง (ใช้คอลัมน์แรกถ้าไม่มีคอลัมน์รหัส)
        const plotId = row[columns[0]] || `แปลงที่ ${plotCounter}`;
        
        // เพิ่มข้อมูลแปลง
        results.plotDetails.push({
            id: plotId,
            zone: zone,
            areaRai: areaRai,
            areaSqm: areaSqm,
            rowData: row
        });
        
        // อัปเดตข้อมูลโซน
        if (!results.zones[zone]) {
            results.zones[zone] = {
                totalAreaRai: 0,
                totalAreaSqm: 0,
                plotCount: 0
            };
        }
        
        results.zones[zone].totalAreaRai += areaRai;
        results.zones[zone].totalAreaSqm += areaSqm;
        results.zones[zone].plotCount++;
        
        // อัปเดตผลรวมทั้งหมด
        results.totalAreaRai += areaRai;
        results.totalAreaSqm += areaSqm;
        results.totalPlots++;
        
        plotCounter++;
    });
    
    // แสดงผลลัพธ์
    displayResults();
}

// แสดงผลลัพธ์
function displayResults() {
    // แสดงส่วนผลลัพธ์
    document.getElementById('resultsSection').style.display = 'block';
    
    // อัปเดตสรุปผล
    document.getElementById('totalPlots').textContent = results.totalPlots.toLocaleString();
    document.getElementById('totalArea').textContent = results.totalAreaRai.toFixed(2);
    document.getElementById('totalZones').textContent = Object.keys(results.zones).length;
    
    // สรุปตามโซน
    const zoneSummaryTable = document.getElementById('zoneSummaryTable').querySelector('tbody');
    zoneSummaryTable.innerHTML = '';
    
    // เรียงลำดับโซนตามตัวอักษร
    const sortedZones = Object.keys(results.zones).sort();
    
    sortedZones.forEach(zone => {
        const zoneData = results.zones[zone];
        const percentage = (zoneData.totalAreaRai / results.totalAreaRai) * 100;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-primary zone-badge">${zone}</span></td>
            <td>${zoneData.plotCount.toLocaleString()}</td>
            <td>${zoneData.totalAreaRai.toFixed(2)}</td>
            <td>${zoneData.totalAreaSqm.toFixed(2)}</td>
            <td>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" style="width: ${percentage}%"></div>
                </div>
                ${percentage.toFixed(1)}%
            </td>
        `;
        zoneSummaryTable.appendChild(row);
    });
    
    // รายละเอียดแปลงทั้งหมด
    const plotDetailsTable = document.getElementById('plotDetailsTable').querySelector('tbody');
    plotDetailsTable.innerHTML = '';
    
    results.plotDetails.forEach((plot, index) => {
        const row = document.createElement('tr');
        
        // ตรวจสอบว่าพื้นที่เป็น 0 หรือไม่
        const note = plot.areaRai === 0 ? '<span class="badge bg-warning text-dark">พื้นที่เป็น 0</span>' : '';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${plot.id}</td>
            <td>${plot.zone}</td>
            <td>${plot.areaRai.toFixed(3)}</td>
            <td>${plot.areaSqm.toFixed(2)}</td>
            <td>${note}</td>
        `;
        plotDetailsTable.appendChild(row);
    });
    
    // เลื่อนหน้าไปยังผลลัพธ์
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// รีเซ็ตฟอร์ม
document.getElementById('resetBtn').addEventListener('click', function() {
    // รีเซ็ตฟอร์ม
    document.getElementById('csvFile').value = '';
    document.getElementById('zoneColumn').selectedIndex = 0;
    document.getElementById('areaColumn').selectedIndex = 0;
    document.getElementById('unitSqm').checked = true;
    
    // ซ่อนผลลัพธ์
    document.getElementById('resultsSection').style.display = 'none';
    
    // รีเซ็ตข้อมูล
    csvData = [];
    columns = [];
    results = {
        zones: {},
        totalAreaRai: 0,
        totalAreaSqm: 0,
        totalPlots: 0,
        plotDetails: []
    };
    
    // รีเซ็ตตัวอย่าง
    showPreview();
});

// ดาวน์โหลดผลลัพธ์เป็น CSV
document.getElementById('exportCsvBtn').addEventListener('click', function() {
    if (results.plotDetails.length === 0) {
        alert('ยังไม่มีข้อมูลที่จะส่งออก');
        return;
    }
    
    // สร้างเนื้อหา CSV
    let csvContent = "ลำดับ,รหัสแปลง,โซน,พื้นที่(ไร่),พื้นที่(ตร.ม.)\n";
    
    results.plotDetails.forEach((plot, index) => {
        csvContent += `${index + 1},${plot.id},${plot.zone},${plot.areaRai.toFixed(3)},${plot.areaSqm.toFixed(2)}\n`;
    });
    
    // เพิ่มสรุปโซน
    csvContent += "\n\nสรุปตามโซน\nโซน,จำนวนแปลง,พื้นที่รวม(ไร่),พื้นที่รวม(ตร.ม.)\n";
    
    Object.keys(results.zones).sort().forEach(zone => {
        const zoneData = results.zones[zone];
        csvContent += `${zone},${zoneData.plotCount},${zoneData.totalAreaRai.toFixed(2)},${zoneData.totalAreaSqm.toFixed(2)}\n`;
    });
    
    // เพิ่มสรุปทั้งหมด
    csvContent += `\nสรุปทั้งหมด\nจำนวนแปลงทั้งหมด,${results.totalPlots}\nพื้นที่รวมทั้งหมด(ไร่),${results.totalAreaRai.toFixed(2)}\nพื้นที่รวมทั้งหมด(ตร.ม.),${results.totalAreaSqm.toFixed(2)}\n`;
    
    // สร้างลิงก์ดาวน์โหลด
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ผลการคำนวณพื้นที่_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// พิมพ์รายงาน
document.getElementById('printBtn').addEventListener('click', function() {
    window.print();
});

// โค้ดเริ่มต้น: แสดงตัวอย่างข้อมูลเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    // สร้างข้อมูลตัวอย่าง
    const sampleData = [
        {รหัสแปลง: 'A001', โซน: 'โซน A', พื้นที่_ตรม: '1600', เจ้าของ: 'สมชาย'},
        {รหัสแปลง: 'A002', โซน: 'โซน A', พื้นที่_ตรม: '2400', เจ้าของ: 'สมหญิง'},
        {รหัสแปลง: 'B001', โซน: 'โซน B', พื้นที่_ตรม: '3200', เจ้าของ: 'สมหมาย'},
        {รหัสแปลง: 'B002', โซน: 'โซน B', พื้นที่_ตรม: '800', เจ้าของ: 'สมทรง'},
        {รหัสแปลง: 'C001', โซน: 'โซน C', พื้นที่_ตรม: '4000', เจ้าของ: 'สมปอง'},
        {รหัสแปลง: 'C002', โซน: 'โซน C', พื้นที่_ตรม: '1200', เจ้าของ: 'สมใจ'}
    ];
    
    // แปลงเป็น CSV
    const columnsSample = ['รหัสแปลง', 'โซน', 'พื้นที่_ตรม', 'เจ้าของ'];
    let csvContentSample = columnsSample.join(',') + '\n';
    sampleData.forEach(row => {
        csvContentSample += `${row.รหัสแปลง},${row.โซน},${row.พื้นที่_ตรม},${row.เจ้าของ}\n`;
    });
    
    // ตั้งค่าข้อมูลตัวอย่าง
    csvData = sampleData;
    columns = columnsSample;
    
    // อัปเดต dropdowns และแสดงตัวอย่าง
    updateColumnDropdowns();
    showPreview();
    
    console.log('ระบบคำนวณพื้นที่แปลงดินพร้อมใช้งาน');
});
