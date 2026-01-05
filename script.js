// ตัวแปรเก็บข้อมูล
let csvData = [];
let summaryData = {};
let filteredDetails = [];
let currentPage = 1;
let recordsPerPage = 10;
let chartInstance = null;

// องค์ประกอบ DOM
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const reportSection = document.getElementById('report-section');
const districtSummaryTable = document.getElementById('district-summary-table').getElementsByTagName('tbody')[0];
const summaryTotalRow = document.getElementById('summary-total');
const detailsTable = document.getElementById('details-table');
const detailsTableBody = detailsTable.getElementsByTagName('tbody')[0];
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const pageSizeSelect = document.getElementById('page-size');
const totalDistrictsElement = document.getElementById('total-districts');
const totalPlotsElement = document.getElementById('total-plots');
const totalAreaElement = document.getElementById('total-area');
const avgAreaPerPlotElement = document.getElementById('avg-area-per-plot');
const downloadSummaryBtn = document.getElementById('download-summary-btn');
const downloadDetailsBtn = document.getElementById('download-details-btn');
const resetBtn = document.getElementById('reset-btn');

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

    // อีเวนต์สำหรับตัวกรองและค้นหา
    districtFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayDetails();
    });

    searchBtn.addEventListener('click', function() {
        currentPage = 1;
        filterAndDisplayDetails();
    });

    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            currentPage = 1;
            filterAndDisplayDetails();
        }
    });

    // อีเวนต์สำหรับปุ่มหน้า
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayDetailsPage();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredDetails.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayDetailsPage();
        }
    });

    pageSizeSelect.addEventListener('change', function() {
        recordsPerPage = parseInt(this.value);
        currentPage = 1;
        displayDetailsPage();
    });

    // อีเวนต์สำหรับปุ่มดาวน์โหลด
    downloadSummaryBtn.addEventListener('click', function() {
        downloadSummaryReport();
    });

    downloadDetailsBtn.addEventListener('click', function() {
        downloadDetailsReport();
    });

    // อีเวนต์สำหรับปุ่มรีเซ็ต
    resetBtn.addEventListener('click', function() {
        resetApp();
    });
});

// ฟังก์ชันจัดการไฟล์
function handleFiles(files) {
    const file = files[0];
    
    // ตรวจสอบว่าเป็นไฟล์ CSV หรือไม่
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('กรุณาเลือกไฟล์ CSV เท่านั้น');
        return;
    }
    
    // แสดงสถานะการอัปโหลด
    const fileName = file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
    dropArea.innerHTML = `<i class="fas fa-file-csv upload-icon"></i>
                         <h3>${fileName}</h3>
                         <p>กำลังประมวลผลข้อมูล...</p>
                         <div class="loading-bar">
                            <div class="loading-progress"></div>
                         </div>`;
    
    // อ่านและประมวลผลไฟล์ CSV
    parseCSV(file);
}

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
            
            // สร้างกราฟ
            createChart();
            
            // เตรียมข้อมูลสำหรับแท็บรายละเอียด
            prepareDetailsTable();
            filterAndDisplayDetails();
            
            // แจ้งเตือนสำเร็จ
            dropArea.innerHTML = `<i class="fas fa-check-circle upload-icon" style="color: #27ae60;"></i>
                                 <h3>อัปโหลดสำเร็จ!</h3>
                                 <p>พบข้อมูลทั้งหมด ${csvData.length} แถว</p>
                                 <p>สรุปข้อมูลเป็น ${Object.keys(summaryData).length} เขต</p>
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
    
    // สมมติว่าข้อมูล CSV มีคอลัมน์ "เขต", "แปลง" และ "ไร่"
    // แต่เราจะพยายามหาเขตข้อมูลอัตโนมัติจากคอลัมน์ที่มีอยู่
    const firstRow = csvData[0];
    let districtColumn = null;
    let plotColumn = null;
    let areaColumn = null;
    
    // หาชื่อคอลัมน์ที่อาจเป็นเขต
    const possibleDistrictColumns = ['เขต', 'อำเภอ', 'ตำบล', 'พื้นที่', 'district', 'area', 'region', 'เขค', 'เขคต'];
    const possiblePlotColumns = ['แปลง', 'เลขที่', 'หมายเลข', 'plot', 'no', 'number'];
    const possibleAreaColumns = ['ไร่', 'พื้นที่', 'ไร่่', 'area', 'size', 'ขนาด'];
    
    for (const col in firstRow) {
        const colLower = col.toLowerCase().trim();
        
        // หาคอลัมน์เขต
        if (!districtColumn) {
            for (const possible of possibleDistrictColumns) {
                if (colLower.includes(possible.toLowerCase())) {
                    districtColumn = col;
                    break;
                }
            }
        }
        
        // หาคอลัมน์แปลง
        if (!plotColumn) {
            for (const possible of possiblePlotColumns) {
                if (colLower.includes(possible.toLowerCase())) {
                    plotColumn = col;
                    break;
                }
            }
        }
        
        // หาคอลัมน์พื้นที่ (ไร่)
        if (!areaColumn) {
            for (const possible of possibleAreaColumns) {
                if (colLower.includes(possible.toLowerCase())) {
                    areaColumn = col;
                    break;
                }
            }
        }
    }
    
    // หากไม่พบคอลัมน์ที่คาดหวัง ให้ใช้คอลัมน์แรกที่มีข้อมูลที่เหมาะสม
    if (!districtColumn || !plotColumn || !areaColumn) {
        const columns = Object.keys(firstRow);
        
        if (!districtColumn) districtColumn = columns[0] || 'เขต';
        if (!plotColumn) plotColumn = columns.length > 1 ? columns[1] : 'แปลง';
        if (!areaColumn) areaColumn = columns.length > 2 ? columns[2] : 'ไร่';
    }
    
    // เก็บชื่อคอลัมน์ที่ใช้
    window.districtColumn = districtColumn;
    window.plotColumn = plotColumn;
    window.areaColumn = areaColumn;
    
    // สรุปข้อมูลตามเขต
    csvData.forEach(row => {
        const district = row[districtColumn];
        
        // ตรวจสอบว่าข้อมูลเขตมีค่าหรือไม่
        if (district === null || district === undefined || district === '') {
            console.warn('พบแถวที่ไม่มีข้อมูลเขต:', row);
            return;
        }
        
        const plot = row[plotColumn];
        const area = parseFloat(row[areaColumn]) || 0;
        
        if (!summaryData[district]) {
            summaryData[district] = {
                plots: new Set(), // ใช้ Set เพื่อป้องกันแปลงซ้ำ
                totalArea: 0,
                rowCount: 0
            };
        }
        
        // เพิ่มแปลง (ถ้ามีข้อมูลแปลง)
        if (plot !== null && plot !== undefined && plot !== '') {
            summaryData[district].plots.add(plot);
        }
        
        // รวมพื้นที่
        summaryData[district].totalArea += area;
        summaryData[district].rowCount++;
    });
}

// แสดงข้อมูลสรุป
function displaySummary() {
    // ล้างตารางเก่า
    districtSummaryTable.innerHTML = '';
    
    const districts = Object.keys(summaryData);
    let totalPlotsAll = 0;
    let totalAreaAll = 0;
    let totalRowsAll = 0;
    
    // เรียงลำดับเขตตามจำนวนแปลง (จากมากไปน้อย)
    const sortedDistricts = districts.sort((a, b) => {
        return summaryData[b].plots.size - summaryData[a].plots.size;
    });
    
    // แสดงข้อมูลแต่ละเขต
    sortedDistricts.forEach((district, index) => {
        const data = summaryData[district];
        const plotCount = data.plots.size;
        const area = data.totalArea;
        const avgAreaPerPlot = plotCount > 0 ? area / plotCount : 0;
        
        totalPlotsAll += plotCount;
        totalAreaAll += area;
        totalRowsAll += data.rowCount;
        
        const row = districtSummaryTable.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${district}</strong></td>
            <td>${plotCount.toLocaleString()}</td>
            <td>${area.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${avgAreaPerPlot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <button class="action-btn view-district" data-district="${district}" title="ดูรายละเอียดเขต ${district}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn highlight-district" data-district="${district}" title="ไฮไลต์เขต ${district} บนกราฟ">
                    <i class="fas fa-chart-line"></i>
                </button>
            </td>
        `;
    });
    
    // แสดงแถวรวมทั้งหมด
    const avgAreaAll = totalPlotsAll > 0 ? totalAreaAll / totalPlotsAll : 0;
    summaryTotalRow.innerHTML = `
        <td colspan="2"><strong>รวมทั้งหมด</strong></td>
        <td><strong>${totalPlotsAll.toLocaleString()}</strong></td>
        <td><strong>${totalAreaAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        <td><strong>${avgAreaAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        <td></td>
    `;
    
    // แสดงสถิติสรุป
    totalDistrictsElement.textContent = districts.length.toLocaleString();
    totalPlotsElement.textContent = totalPlotsAll.toLocaleString();
    totalAreaElement.textContent = totalAreaAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    avgAreaPerPlotElement.textContent = avgAreaAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // เพิ่มอีเวนต์ให้ปุ่มดูรายละเอียดเขต
    document.querySelectorAll('.view-district').forEach(button => {
        button.addEventListener('click', function() {
            const district = this.getAttribute('data-district');
            // กรองแสดงเฉพาะเขตที่เลือก
            districtFilter.value = district;
            currentPage = 1;
            filterAndDisplayDetails();
            
            // เลื่อนไปยังส่วนรายละเอียด
            document.querySelector('.details-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // เพิ่มอีเวนต์ให้ปุ่มไฮไลต์บนกราฟ
    document.querySelectorAll('.highlight-district').forEach(button => {
        button.addEventListener('click', function() {
            const district = this.getAttribute('data-district');
            highlightDistrictOnChart(district);
        });
    });
    
    // อัปเดตตัวเลือกเขตสำหรับตัวกรอง
    updateDistrictFilter();
}

// อัปเดตตัวเลือกในตัวกรองเขต
function updateDistrictFilter() {
    districtFilter.innerHTML = '<option value="all">แสดงทั้งหมด</option>';
    
    const districts = Object.keys(summaryData).sort();
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = `${district} (${summaryData[district].plots.size} แปลง)`;
        districtFilter.appendChild(option);
    });
}

// สร้างกราฟแสดงข้อมูล
function createChart() {
    const districts = Object.keys(summaryData);
    
    // เรียงลำดับเขตตามจำนวนแปลง (จากมากไปน้อย) แต่แสดงเฉพาะ 10 อันดับแรกเพื่อความชัดเจน
    const sortedDistricts = districts.sort((a, b) => {
        return summaryData[b].plots.size - summaryData[a].plots.size;
    }).slice(0, 10);
    
    const labels = sortedDistricts;
    const plotData = sortedDistricts.map(district => summaryData[district].plots.size);
    const areaData = sortedDistricts.map(district => summaryData[district].totalArea);
    
    const ctx = document.getElementById('district-chart').getContext('2d');
    
    // ถ้ามีกราฟเก่าอยู่ ให้ทำลายก่อนสร้างใหม่
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'จำนวนแปลง',
                    data: plotData,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'พื้นที่รวม (ไร่)',
                    data: areaData,
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '10 อันดับเขตที่มีแปลงที่ดินมากที่สุด'
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'จำนวนแปลง'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'พื้นที่รวม (ไร่)'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    // สร้างคำอธิบายกราฟ
    updateChartLegend(sortedDistricts);
}

// อัปเดตคำอธิบายกราฟ
function updateChartLegend(districts) {
    const legendContainer = document.getElementById('chart-legend');
    let legendHTML = '';
    
    districts.forEach(district => {
        const data = summaryData[district];
        legendHTML += `
            <div class="legend-item">
                <span class="legend-color" style="background-color: #3498db;"></span>
                <span class="legend-label">${district}:</span>
                <span class="legend-value">${data.plots.size} แปลง, ${data.totalArea.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ไร่</span>
            </div>
        `;
    });
    
    legendContainer.innerHTML = legendHTML;
    
    // เพิ่มสไตล์ให้คำอธิบายกราฟ
    const style = document.createElement('style');
    style.textContent = `
        .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 5px 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            margin: 2px;
        }
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }
        .legend-label {
            font-weight: 600;
            color: #2c3e50;
        }
        .legend-value {
            color: #555;
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(style);
}

// ไฮไลต์เขตบนกราฟ
function highlightDistrictOnChart(district) {
    if (!chartInstance) return;
    
    // หาดัชนีของเขตในกราฟ
    const index = chartInstance.data.labels.indexOf(district);
    
    if (index !== -1) {
        // เปลี่ยนสีของแถบกราฟ
        const originalColor = chartInstance.data.datasets[0].backgroundColor[index];
        chartInstance.data.datasets[0].backgroundColor[index] = '#e74c3c';
        chartInstance.data.datasets[1].backgroundColor[index] = '#e74c3c';
        
        chartInstance.update();
        
        // คืนสีเดิมหลังจาก 2 วินาที
        setTimeout(() => {
            chartInstance.data.datasets[0].backgroundColor[index] = originalColor;
            chartInstance.data.datasets[1].backgroundColor[index] = '#2ecc71';
            chartInstance.update();
        }, 2000);
    }
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
}

// กรองและแสดงรายละเอียด
function filterAndDisplayDetails() {
    const selectedDistrict = districtFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // กรองข้อมูล
    filteredDetails = csvData.filter(row => {
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
    const endIndex = Math.min(startIndex + recordsPerPage, filteredDetails.length);
    const pageData = filteredDetails.slice(startIndex, endIndex);
    
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
                if (key === window.areaColumn) {
                    cell.textContent = value.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    });
                    cell.style.fontWeight = '600';
                } else {
                    cell.textContent = value.toLocaleString();
                }
                cell.style.textAlign = 'right';
            } else {
                cell.textContent = value !== null && value !== undefined ? value.toString() : '';
                
                // เน้นข้อมูลเขต
                if (key === window.districtColumn) {
                    cell.style.fontWeight = '600';
                    cell.style.color = '#2c3e50';
                }
            }
        }
    });
    
    // อัปเดตการควบคุมหน้า
    updatePaginationControls();
}

// อัปเดตการควบคุมหน้า
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredDetails.length / recordsPerPage);
    
    // อัปเดตข้อมูลหน้า
    pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages} (ทั้งหมด ${filteredDetails.length} แถว)`;
    
    // ปุ่มก่อนหน้า
    prevPageBtn.disabled = currentPage <= 1;
    
    // ปุ่มถัดไป
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// ดาวน์โหลดรายงานสรุป
function downloadSummaryReport() {
    // สร้างเนื้อหารายงานสรุป
    let reportContent = 'รายงานสรุปข้อมูลแปลงที่ดินตามเขต\n\n';
    reportContent += 'ลำดับ,เขต,จำนวนแปลง,พื้นที่รวม (ไร่),พื้นที่เฉลี่ยต่อแปลง (ไร่)\n';
    
    const districts = Object.keys(summaryData);
    
    // เรียงลำดับเขตตามจำนวนแปลง (จากมากไปน้อย)
    const sortedDistricts = districts.sort((a, b) => {
        return summaryData[b].plots.size - summaryData[a].plots.size;
    });
    
    sortedDistricts.forEach((district, index) => {
        const data = summaryData[district];
        const plotCount = data.plots.size;
        const area = data.totalArea;
        const avgAreaPerPlot = plotCount > 0 ? area / plotCount : 0;
        
        reportContent += `${index + 1},${district},${plotCount},${area.toFixed(2)},${avgAreaPerPlot.toFixed(2)}\n`;
    });
    
    // คำนวณรวมทั้งหมด
    const totalPlotsAll = sortedDistricts.reduce((sum, district) => sum + summaryData[district].plots.size, 0);
    const totalAreaAll = sortedDistricts.reduce((sum, district) => sum + summaryData[district].totalArea, 0);
    const avgAreaAll = totalPlotsAll > 0 ? totalAreaAll / totalPlotsAll : 0;
    
    reportContent += `\nรวมทั้งหมด,,${totalPlotsAll},${totalAreaAll.toFixed(2)},${avgAreaAll.toFixed(2)}\n`;
    
    // สร้างไฟล์และดาวน์โหลด
    downloadCSV(reportContent, `สรุปแปลงที่ดินตามเขต_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ดาวน์โหลดรายงานรายละเอียด
function downloadDetailsReport() {
    if (csvData.length === 0) return;
    
    // สร้างเนื้อหารายงานรายละเอียด
    const headers = Object.keys(csvData[0]);
    let reportContent = 'ลำดับ,' + headers.join(',') + '\n';
    
    csvData.forEach((row, index) => {
        reportContent += `${index + 1},`;
        reportContent += headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') {
                if (header === window.areaColumn) {
                    return value.toFixed(2);
                }
                return value.toString();
            }
            return value;
        }).join(',');
        reportContent += '\n';
    });
    
    // สร้างไฟล์และดาวน์โหลด
    downloadCSV(reportContent, `รายละเอียดแปลงที่ดิน_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ฟังก์ชันดาวน์โหลดไฟล์ CSV
function downloadCSV(content, filename) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// รีเซ็ตแอปพลิเคชัน
function resetApp() {
    // ยืนยันการรีเซ็ต
    if (!confirm('คุณต้องการล้างข้อมูลทั้งหมดและเริ่มใหม่ใช่หรือไม่?')) {
        return;
    }
    
    // รีเซ็ตตัวแปร
    csvData = [];
    summaryData = {};
    filteredDetails = [];
    currentPage = 1;
    recordsPerPage = 10;
    
    // รีเซ็ต UI
    reportSection.style.display = 'none';
    resetUploadArea();
    
    // รีเซ็ตตัวกรอง
    districtFilter.innerHTML = '<option value="all">แสดงทั้งหมด</option>';
    searchInput.value = '';
    pageSizeSelect.value = '10';
    
    // ลบกราฟเก่า
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    // ล้างคำอธิบายกราฟ
    document.getElementById('chart-legend').innerHTML = '';
}
