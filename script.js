// ตัวแปรเก็บข้อมูล CSV ที่อัปโหลด
let csvData = [];
let summaryData = {};
let currentPage = 1;
const recordsPerPage = 10;
let filteredData = [];

// องค์ประกอบ DOM
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const reportSection = document.getElementById('report-section');
const districtSummaryTable = document.getElementById('district-summary-table').getElementsByTagName('tbody')[0];
const detailsTable = document.getElementById('details-table');
const detailsTableBody = detailsTable.getElementsByTagName('tbody')[0];
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const totalDistrictsElement = document.getElementById('total-districts');
const totalRecordsElement = document.getElementById('total-records');
const avgValueElement = document.getElementById('avg-value');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// อีเวนต์เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // เพิ่มอีเวนต์ให้กับพื้นที่ลากและวาง
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('drag-over');
    }

    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }

    // จัดการไฟล์ที่วาง
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }

    // จัดการไฟล์ที่เลือก
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });

    // ฟังก์ชันจัดการไฟล์
    function handleFiles(files) {
        const file = files[0];
        
        // ตรวจสอบว่าเป็นไฟล์ CSV หรือไม่
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('กรุณาเลือกไฟล์ CSV เท่านั้น');
            return;
        }
        
        // แสดงชื่อไฟล์
        const fileName = file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
        dropArea.innerHTML = `<i class="fas fa-file-csv upload-icon"></i>
                             <h3>${fileName}</h3>
                             <p>กำลังประมวลผลข้อมูล...</p>`;
        
        // อ่านและประมวลผลไฟล์ CSV
        parseCSV(file);
    }

    // ฟังก์ชันสำหรับสลับแท็บ
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // เปลี่ยนแท็บที่ active
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // แสดงเนื้อหาของแท็บที่เลือก
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // หากเป็นแท็บรายละเอียด ให้แสดงข้อมูลหน้าแรก
            if (tabId === 'district-details') {
                currentPage = 1;
                displayDetailsPage();
            }
        });
    });

    // อีเวนต์สำหรับตัวกรอง
    districtFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayDetails();
    });

    searchInput.addEventListener('input', function() {
        currentPage = 1;
        filterAndDisplayDetails();
    });

    // อีเวนต์สำหรับปุ่มหน้า
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayDetailsPage();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredData.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayDetailsPage();
        }
    });

    // อีเวนต์สำหรับปุ่มดาวน์โหลดรายงาน
    downloadBtn.addEventListener('click', function() {
        downloadReport();
    });

    // อีเวนต์สำหรับปุ่มรีเซ็ต
    resetBtn.addEventListener('click', function() {
        resetApp();
    });
});

// ฟังก์ชันแยกวิเคราะห์ไฟล์ CSV
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data.length === 0) {
                alert('ไฟล์ CSV ไม่มีข้อมูลหรือรูปแบบไม่ถูกต้อง');
                resetUploadArea();
                return;
            }
            
            // เก็บข้อมูล CSV
            csvData = results.data;
            
            // สร้างรายงานสรุป
            createSummary();
            
            // แสดงส่วนรายงาน
            reportSection.style.display = 'block';
            
            // แสดงข้อมูลสรุป
            displaySummary();
            
            // เตรียมข้อมูลสำหรับแท็บรายละเอียด
            prepareDetailsTable();
            filterAndDisplayDetails();
            
            // แจ้งเตือนสำเร็จ
            dropArea.innerHTML = `<i class="fas fa-check-circle upload-icon" style="color: #4CAF50;"></i>
                                 <h3>อัปโหลดสำเร็จ!</h3>
                                 <p>พบข้อมูลทั้งหมด ${csvData.length} แถว</p>
                                 <p class="file-types">คุณสามารถอัปโหลดไฟล์ใหม่ได้ตลอดเวลา</p>`;
        },
        error: function(error) {
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
            resetUploadArea();
        }
    });
}

// รีเซ็ตพื้นที่อัปโหลด
function resetUploadArea() {
    dropArea.innerHTML = `<i class="fas fa-cloud-upload-alt upload-icon"></i>
                         <h3>ลากไฟล์ CSV มาวางที่นี่</h3>
                         <p>หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</p>
                         <input type="file" id="file-input" accept=".csv">
                         <p class="file-types">รองรับเฉพาะไฟล์ CSV (.csv)</p>`;
    
    // อีเวนต์สำหรับคลิกเพื่อเลือกไฟล์
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
}

// สร้างข้อมูลสรุปจากข้อมูล CSV
function createSummary() {
    summaryData = {};
    
    // สมมติว่าข้อมูล CSV มีคอลัมน์ "เขต" และ "มูลค่า"
    // แต่เราจะพยายามหาเขตข้อมูลอัตโนมัติ
    const firstRow = csvData[0];
    let districtColumn = null;
    let valueColumn = null;
    
    // หาชื่อคอลัมน์ที่อาจเป็นเขต
    const possibleDistrictColumns = ['เขต', 'อำเภอ', 'ตำบล', 'พื้นที่', 'district', 'area', 'region'];
    const possibleValueColumns = ['มูลค่า', 'ค่า', 'จำนวน', 'ยอด', 'value', 'amount', 'total'];
    
    for (const col in firstRow) {
        const colLower = col.toLowerCase();
        
        if (!districtColumn) {
            for (const possible of possibleDistrictColumns) {
                if (colLower.includes(possible.toLowerCase())) {
                    districtColumn = col;
                    break;
                }
            }
        }
        
        if (!valueColumn) {
            for (const possible of possibleValueColumns) {
                if (colLower.includes(possible.toLowerCase())) {
                    valueColumn = col;
                    break;
                }
            }
        }
    }
    
    // หากไม่พบคอลัมน์ที่คาดหวัง ให้ใช้คอลัมน์แรกเป็นเขตและคอลัมน์ที่สองเป็นค่า
    if (!districtColumn) {
        const columns = Object.keys(firstRow);
        districtColumn = columns[0];
        valueColumn = columns.length > 1 ? columns[1] : columns[0];
    }
    
    // เก็บชื่อคอลัมน์ที่ใช้
    window.districtColumn = districtColumn;
    window.valueColumn = valueColumn;
    
    // สรุปข้อมูลตามเขต
    csvData.forEach(row => {
        const district = row[districtColumn] || 'ไม่ระบุเขต';
        const value = parseFloat(row[valueColumn]) || 0;
        
        if (!summaryData[district]) {
            summaryData[district] = {
                count: 0,
                sum: 0,
                max: value,
                min: value,
                values: []
            };
        }
        
        summaryData[district].count++;
        summaryData[district].sum += value;
        summaryData[district].max = Math.max(summaryData[district].max, value);
        summaryData[district].min = Math.min(summaryData[district].min, value);
        summaryData[district].values.push(value);
    });
}

// แสดงข้อมูลสรุป
function displaySummary() {
    // ล้างตารางเก่า
    districtSummaryTable.innerHTML = '';
    
    const districts = Object.keys(summaryData);
    let totalRecords = 0;
    let totalSum = 0;
    
    // แสดงข้อมูลแต่ละเขต
    districts.forEach((district, index) => {
        const data = summaryData[district];
        totalRecords += data.count;
        totalSum += data.sum;
        
        const avg = data.sum / data.count;
        
        const row = districtSummaryTable.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${district}</td>
            <td>${data.count.toLocaleString()}</td>
            <td>${data.sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.min.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td><button class="action-btn view-details" data-district="${district}"><i class="fas fa-eye"></i> ดูรายละเอียด</button></td>
        `;
    });
    
    // แสดงสถิติสรุป
    totalDistrictsElement.textContent = districts.length;
    totalRecordsElement.textContent = totalRecords.toLocaleString();
    const overallAvg = districts.length > 0 ? totalSum / totalRecords : 0;
    avgValueElement.textContent = overallAvg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // เพิ่มอีเวนต์ให้ปุ่มดูรายละเอียด
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const district = this.getAttribute('data-district');
            // สลับไปแท็บรายละเอียดและกรองตามเขต
            document.querySelector('[data-tab="district-details"]').click();
            districtFilter.value = district;
            filterAndDisplayDetails();
        });
    });
}

// เตรียมตารางรายละเอียด
function prepareDetailsTable() {
    // ล้างตารางเก่า
    detailsTable.innerHTML = '';
    
    // สร้างหัวตาราง
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // เพิ่มคอลัมน์ลำดับ
    const thIndex = document.createElement('th');
    thIndex.textContent = 'ลำดับ';
    headerRow.appendChild(thIndex);
    
    // เพิ่มหัวคอลัมน์จากข้อมูล CSV
    if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
    }
    
    thead.appendChild(headerRow);
    detailsTable.appendChild(thead);
    
    // สร้าง tbody
    const tbody = document.createElement('tbody');
    detailsTable.appendChild(tbody);
    
    // เตรียมตัวเลือกเขตสำหรับตัวกรอง
    updateDistrictFilter();
}

// อัปเดตตัวเลือกในตัวกรองเขต
function updateDistrictFilter() {
    districtFilter.innerHTML = '<option value="all">ทั้งหมด</option>';
    
    const districts = Object.keys(summaryData).sort();
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });
}

// กรองและแสดงรายละเอียด
function filterAndDisplayDetails() {
    const selectedDistrict = districtFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // กรองข้อมูล
    filteredData = csvData.filter(row => {
        // กรองตามเขต
        if (selectedDistrict !== 'all' && row[window.districtColumn] !== selectedDistrict) {
            return false;
        }
        
        // กรองตามคำค้นหา
        if (searchTerm) {
            // ตรวจสอบทุกคอลัมน์สำหรับคำค้นหา
            const rowValues = Object.values(row).map(val => 
                val !== null ? val.toString().toLowerCase() : ''
            );
            
            const found = rowValues.some(val => val.includes(searchTerm));
            if (!found) return false;
        }
        
        return true;
    });
    
    // แสดงข้อมูลหน้าแรก
    currentPage = 1;
    displayDetailsPage();
}

// แสดงรายละเอียดตามหน้า
function displayDetailsPage() {
    // ล้างตารางเก่า
    detailsTableBody.innerHTML = '';
    
    // คำนวณข้อมูลหน้า
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // แสดงข้อมูลในตาราง
    pageData.forEach((row, index) => {
        const globalIndex = startIndex + index + 1;
        const tableRow = detailsTableBody.insertRow();
        
        // เซลล์ลำดับ
        const cellIndex = tableRow.insertCell();
        cellIndex.textContent = globalIndex;
        
        // เซลล์ข้อมูล
        for (const key in row) {
            const cell = tableRow.insertCell();
            let value = row[key];
            
            // จัดรูปแบบตัวเลข
            if (typeof value === 'number') {
                cell.textContent = value.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
                cell.style.textAlign = 'right';
            } else {
                cell.textContent = value !== null && value !== undefined ? value.toString() : '';
            }
        }
    });
    
    // อัปเดตการควบคุมหน้า
    updatePaginationControls();
}

// อัปเดตการควบคุมหน้า
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);
    
    // อัปเดตข้อมูลหน้า
    pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages}`;
    
    // ปุ่มก่อนหน้า
    prevPageBtn.disabled = currentPage <= 1;
    
    // ปุ่มถัดไป
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// ดาวน์โหลดรายงานสรุป
function downloadReport() {
    // สร้างเนื้อหารายงาน
    let reportContent = 'รายงานสรุปข้อมูลจากไฟล์ CSV\n\n';
    reportContent += 'สรุปรายเขต\n';
    reportContent += 'ลำดับ,เขต,จำนวนข้อมูล,ผลรวม,ค่าเฉลี่ย,ค่าสูงสุด,ค่าต่ำสุด\n';
    
    const districts = Object.keys(summaryData);
    districts.forEach((district, index) => {
        const data = summaryData[district];
        const avg = data.sum / data.count;
        
        reportContent += `${index + 1},${district},${data.count},${data.sum},${avg},${data.max},${data.min}\n`;
    });
    
    reportContent += '\n\nรายละเอียดข้อมูล\n';
    
    // หัวตารางรายละเอียด
    if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]);
        reportContent += 'ลำดับ,' + headers.join(',') + '\n';
        
        // ข้อมูลรายละเอียด
        csvData.forEach((row, index) => {
            reportContent += `${index + 1},`;
            reportContent += headers.map(header => row[header] !== null && row[header] !== undefined ? row[header] : '').join(',');
            reportContent += '\n';
        });
    }
    
    // สร้างไฟล์และดาวน์โหลด
    const blob = new Blob([reportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `csv_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// รีเซ็ตแอปพลิเคชัน
function resetApp() {
    // รีเซ็ตตัวแปร
    csvData = [];
    summaryData = {};
    currentPage = 1;
    filteredData = [];
    
    // รีเซ็ต UI
    reportSection.style.display = 'none';
    resetUploadArea();
    
    // รีเซ็ตแท็บ
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === 'district-summary') {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === 'district-summary') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // รีเซ็ตตัวกรอง
    districtFilter.innerHTML = '<option value="all">ทั้งหมด</option>';
    searchInput.value = '';
}
