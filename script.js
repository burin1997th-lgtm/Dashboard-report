// ข้อมูลตัวอย่างจากภาพ (รายงานสถานะอ้อยนำส่ง ปี 68/69)
const sugarCaneData = [
    { zone: 1, farmers: 572, plots: 2112, area: 17756, production: 188795, deliveryFarmers: 184, deliveryPercentage: 32, deliveryTons: 25030, measuredBrix: 67, notMeasuredBrix: 117, deliveryPlots: 902, remainingPlots: 250 },
    { zone: 2, farmers: 424, plots: 1974, area: 20595, production: 221803, deliveryFarmers: 132, deliveryPercentage: 31, deliveryTons: 34766, measuredBrix: 79, notMeasuredBrix: 53, deliveryPlots: 1023, remainingPlots: 565 },
    { zone: 3, farmers: 420, plots: 1419, area: 13814, production: 152045, deliveryFarmers: 124, deliveryPercentage: 30, deliveryTons: 28790, measuredBrix: 51, notMeasuredBrix: 73, deliveryPlots: 1787, remainingPlots: 707 },
    { zone: 4, farmers: 339, plots: 1180, area: 14034, production: 144176, deliveryFarmers: 49, deliveryPercentage: 14, deliveryTons: 10183, measuredBrix: 21, notMeasuredBrix: 28, deliveryPlots: 148, remainingPlots: 60 },
    { zone: 5, farmers: 597, plots: 2206, area: 23177, production: 234672, deliveryFarmers: 136, deliveryPercentage: 23, deliveryTons: 27033, measuredBrix: 68, notMeasuredBrix: 108, deliveryPlots: 1366, remainingPlots: 525 },
    { zone: 6, farmers: 629, plots: 2121, area: 21256, production: 234437, deliveryFarmers: 106, deliveryPercentage: 17, deliveryTons: 26463, measuredBrix: 53, notMeasuredBrix: 54, deliveryPlots: 663, remainingPlots: 326 },
    { zone: 7, farmers: 508, plots: 2040, area: 21202, production: 219029, deliveryFarmers: 104, deliveryPercentage: 20, deliveryTons: 31176, measuredBrix: 71, notMeasuredBrix: 33, deliveryPlots: 1160, remainingPlots: 755 },
    { zone: 8, farmers: 379, plots: 1470, area: 11882, production: 116713, deliveryFarmers: 32, deliveryPercentage: 8, deliveryTons: 5896, measuredBrix: 15, notMeasuredBrix: 17, deliveryPlots: 645, remainingPlots: 297 },
    { zone: 10, farmers: 289, plots: 1294, area: 12726, production: 128952, deliveryFarmers: 74, deliveryPercentage: 26, deliveryTons: 14601, measuredBrix: 52, notMeasuredBrix: 22, deliveryPlots: 550, remainingPlots: 234 },
    { zone: 11, farmers: 183, plots: 858, area: 11099, production: 94681, deliveryFarmers: 37, deliveryPercentage: 20, deliveryTons: 11554, measuredBrix: 21, notMeasuredBrix: 16, deliveryPlots: 584, remainingPlots: 314 },
    { zone: 12, farmers: 56, plots: 168, area: 2022, production: 25854, deliveryFarmers: 8, deliveryPercentage: 14, deliveryTons: 3775, measuredBrix: 4, notMeasuredBrix: 4, deliveryPlots: 70, remainingPlots: 70 },
    { zone: 21, farmers: 202, plots: 987, area: 9037, production: 96541, deliveryFarmers: 49, deliveryPercentage: 24, deliveryTons: 11884, measuredBrix: 25, notMeasuredBrix: 24, deliveryPlots: 486, remainingPlots: 130 }
];

// ตัวแปร global สำหรับกราฟ
let zoneBarChart = null;
let percentagePieChart = null;

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    console.log('ระบบวิเคราะห์ข้อมูลอ้อยนำส่งพร้อมใช้งาน');
    
    // โหลดข้อมูลและแสดงผล
    loadData();
    
    // สร้างกราฟ
    createCharts();
    
    // เพิ่มข้อมูลลงตาราง
    populateTable();
    
    // ตั้งค่าอีเวนต์
    setupEventListeners();
    
    // แสดงผลการวิเคราะห์เริ่มต้น
    updateAnalysis();
});

// โหลดข้อมูลและคำนวณสรุป
function loadData() {
    // อัปเดตข้อมูลสรุป
    updateSummaryStats();
}

// อัปเดตข้อมูลสรุป
function updateSummaryStats() {
    // คำนวณยอดรวม
    const totalFarmers = sugarCaneData.reduce((sum, zone) => sum + zone.farmers, 0);
    const totalPlots = sugarCaneData.reduce((sum, zone) => sum + zone.plots, 0);
    const totalArea = sugarCaneData.reduce((sum, zone) => sum + zone.area, 0);
    const totalProduction = sugarCaneData.reduce((sum, zone) => sum + zone.production, 0);
    const totalDeliveryTons = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryTons, 0);
    const totalDeliveryFarmers = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryFarmers, 0);
    const totalMeasuredBrix = sugarCaneData.reduce((sum, zone) => sum + zone.measuredBrix, 0);
    const totalNotMeasuredBrix = sugarCaneData.reduce((sum, zone) => sum + zone.notMeasuredBrix, 0);
    
    // คำนวณค่าเฉลี่ย
    const avgDeliveryPercentage = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryPercentage, 0) / sugarCaneData.length;
    const avgDeliveryPerZone = totalDeliveryTons / sugarCaneData.length;
    
    // อัปเดตตัวเลขใน header
    document.querySelector('.header-stats .stat-card:nth-child(2) h3').textContent = totalFarmers.toLocaleString();
    
    // อัปเดตข้อมูลสรุป
    document.querySelector('.summary-item:nth-child(1) h3').textContent = avgDeliveryPercentage.toFixed(1) + '%';
    document.querySelector('.summary-item:nth-child(2) h3').textContent = (totalDeliveryTons / 1000).toFixed(1) + ' พันตัน';
    document.querySelector('.summary-item:nth-child(3) h3').textContent = totalArea.toLocaleString();
    document.querySelector('.summary-item:nth-child(4) h3').textContent = totalDeliveryFarmers.toLocaleString();
    
    // อัปเดตข้อมูลในตารางสรุป
    document.querySelector('.table-total td:nth-child(2)').textContent = totalFarmers.toLocaleString();
    document.querySelector('.table-total td:nth-child(3)').textContent = totalPlots.toLocaleString();
    document.querySelector('.table-total td:nth-child(4)').textContent = totalArea.toLocaleString();
    document.querySelector('.table-total td:nth-child(5)').textContent = totalProduction.toLocaleString();
    document.querySelector('.table-total td:nth-child(6)').textContent = totalDeliveryFarmers.toLocaleString();
    document.querySelector('.table-total td:nth-child(7)').textContent = ((totalDeliveryFarmers / totalFarmers) * 100).toFixed(1) + '%';
    document.querySelector('.table-total td:nth-child(8)').textContent = totalDeliveryTons.toLocaleString();
    document.querySelector('.table-total td:nth-child(9)').textContent = totalMeasuredBrix.toLocaleString();
    document.querySelector('.table-total td:nth-child(10)').textContent = totalNotMeasuredBrix.toLocaleString();
}

// สร้างกราฟ
function createCharts() {
    // กราฟแท่งเปรียบเทียบตามเขต
    const zoneCtx = document.getElementById('zoneBarChart').getContext('2d');
    
    // เตรียมข้อมูลสำหรับกราฟแท่ง
    const zoneLabels = sugarCaneData.map(zone => `เขต ${zone.zone}`);
    const deliveryPercentages = sugarCaneData.map(zone => zone.deliveryPercentage);
    const deliveryTons = sugarCaneData.map(zone => zone.deliveryTons / 1000); // แปลงเป็นพันตัน
    
    // ลบกราฟเก่าหากมี
    if (zoneBarChart) {
        zoneBarChart.destroy();
    }
    
    zoneBarChart = new Chart(zoneCtx, {
        type: 'bar',
        data: {
            labels: zoneLabels,
            datasets: [
                {
                    label: 'อ้อยนำส่ง (%)',
                    data: deliveryPercentages,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'ปริมาณนำส่ง (พันตัน)',
                    data: deliveryTons,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'อ้อยนำส่ง (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    min: 0,
                    max: 35
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'ปริมาณนำส่ง (พันตัน)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    min: 0
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y + '%';
                            } else {
                                label += context.parsed.y.toFixed(1) + ' พันตัน';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // กราฟวงกลมแสดงสัดส่วน
    const pieCtx = document.getElementById('percentagePieChart').getContext('2d');
    
    // คำนวณสัดส่วนการนำส่ง
    const totalDelivery = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryTons, 0);
    const highDelivery = sugarCaneData.filter(zone => zone.deliveryPercentage >= 25).reduce((sum, zone) => sum + zone.deliveryTons, 0);
    const mediumDelivery = sugarCaneData.filter(zone => zone.deliveryPercentage >= 15 && zone.deliveryPercentage < 25).reduce((sum, zone) => sum + zone.deliveryTons, 0);
    const lowDelivery = sugarCaneData.filter(zone => zone.deliveryPercentage < 15).reduce((sum, zone) => sum + zone.deliveryTons, 0);
    
    // ลบกราฟเก่าหากมี
    if (percentagePieChart) {
        percentagePieChart.destroy();
    }
    
    percentagePieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['นำส่งสูง (≥25%)', 'นำส่งปานกลาง (15-24%)', 'นำส่งต่ำ (<15%)'],
            datasets: [{
                data: [highDelivery, mediumDelivery, lowDelivery],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalDelivery) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} ตัน (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// เพิ่มข้อมูลลงตาราง
function populateTable() {
    const tableBody = document.getElementById('zone-table-body');
    tableBody.innerHTML = '';
    
    sugarCaneData.forEach(zone => {
        const row = document.createElement('tr');
        row.className = 'zone-row';
        row.dataset.zone = zone.zone;
        
        // กำหนดสถานะตามเปอร์เซ็นต์การนำส่ง
        let statusClass = 'status-medium';
        let statusText = 'ปานกลาง';
        
        if (zone.deliveryPercentage >= 25) {
            statusClass = 'status-high';
            statusText = 'สูง';
        } else if (zone.deliveryPercentage < 15) {
            statusClass = 'status-low';
            statusText = 'ต่ำ';
        }
        
        row.innerHTML = `
            <td><strong>เขต ${zone.zone}</strong></td>
            <td>${zone.farmers.toLocaleString()}</td>
            <td>${zone.plots.toLocaleString()}</td>
            <td>${zone.area.toLocaleString()}</td>
            <td>${zone.production.toLocaleString()}</td>
            <td>${zone.deliveryFarmers.toLocaleString()}</td>
            <td><strong>${zone.deliveryPercentage}%</strong></td>
            <td>${zone.deliveryTons.toLocaleString()}</td>
            <td>${zone.measuredBrix.toLocaleString()}</td>
            <td>${zone.notMeasuredBrix.toLocaleString()}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // เพิ่มอีเวนต์คลิกที่แถว
    document.querySelectorAll('.zone-row').forEach(row => {
        row.addEventListener('click', function() {
            const zoneNumber = this.dataset.zone;
            showZoneDetails(zoneNumber);
        });
    });
}

// แสดงรายละเอียดเขต
function showZoneDetails(zoneNumber) {
    const zone = sugarCaneData.find(z => z.zone == zoneNumber);
    if (!zone) return;
    
    // คำนวณข้อมูลเพิ่มเติม
    const remainingFarmers = zone.farmers - zone.deliveryFarmers;
    const remainingPercentage = ((remainingFarmers / zone.farmers) * 100).toFixed(1);
    const avgTonsPerFarmer = (zone.deliveryTons / zone.deliveryFarmers).toFixed(1);
    const brixPercentage = ((zone.measuredBrix / (zone.measuredBrix + zone.notMeasuredBrix)) * 100).toFixed(1);
    
    // อัปเดต modal
    document.getElementById('modal-zone-number').textContent = zone.zone;
    
    document.getElementById('zone-detail-content').innerHTML = `
        <div class="zone-detail-grid">
            <div class="detail-card">
                <h4><i class="fas fa-users"></i> ข้อมูลผู้ปลูก</h4>
                <div class="detail-item">
                    <span>ผู้ปลูกทั้งหมด:</span>
                    <strong>${zone.farmers.toLocaleString()} ราย</strong>
                </div>
                <div class="detail-item">
                    <span>นำส่งแล้ว:</span>
                    <strong>${zone.deliveryFarmers.toLocaleString()} ราย (${zone.deliveryPercentage}%)</strong>
                </div>
                <div class="detail-item">
                    <span>ยังไม่ได้นำส่ง:</span>
                    <strong>${remainingFarmers.toLocaleString()} ราย (${remainingPercentage}%)</strong>
                </div>
            </div>
            
            <div class="detail-card">
                <h4><i class="fas fa-weight-hanging"></i> ข้อมูลผลผลิต</h4>
                <div class="detail-item">
                    <span>ผลผลิตทั้งหมด:</span>
                    <strong>${zone.production.toLocaleString()} ตัน</strong>
                </div>
                <div class="detail-item">
                    <span>นำส่งแล้ว:</span>
                    <strong>${zone.deliveryTons.toLocaleString()} ตัน (${((zone.deliveryTons / zone.production) * 100).toFixed(1)}%)</strong>
                </div>
                <div class="detail-item">
                    <span>เฉลี่ยต่อผู้ปลูก:</span>
                    <strong>${avgTonsPerFarmer} ตัน/ราย</strong>
                </div>
            </div>
            
            <div class="detail-card">
                <h4><i class="fas fa-map-marked-alt"></i> ข้อมูลพื้นที่</h4>
                <div class="detail-item">
                    <span>พื้นที่ปลูก:</span>
                    <strong>${zone.area.toLocaleString()} ไร่</strong>
                </div>
                <div class="detail-item">
                    <span>แปลงทั้งหมด:</span>
                    <strong>${zone.plots.toLocaleString()} แปลง</strong>
                </div>
                <div class="detail-item">
                    <span>แปลงที่นำส่งแล้ว:</span>
                    <strong>${zone.deliveryPlots.toLocaleString()} แปลง</strong>
                </div>
            </div>
            
            <div class="detail-card">
                <h4><i class="fas fa-flask"></i> ข้อมูลคุณภาพ</h4>
                <div class="detail-item">
                    <span>วัดค่า Brix:</span>
                    <strong>${zone.measuredBrix.toLocaleString()} ราย</strong>
                </div>
                <div class="detail-item">
                    <span>ไม่วัดค่า Brix:</span>
                    <strong>${zone.notMeasuredBrix.toLocaleString()} ราย</strong>
                </div>
                <div class="detail-item">
                    <span>สัดส่วนการวัด:</span>
                    <strong>${brixPercentage}%</strong>
                </div>
            </div>
        </div>
        
        <div class="zone-analysis">
            <h4><i class="fas fa-chart-line"></i> การวิเคราะห์เขต ${zone.zone}</h4>
            <p>เขต ${zone.zone} มีอัตราการนำส่งอ้อยอยู่ที่ <strong>${zone.deliveryPercentage}%</strong> ซึ่งอยู่ในระดับ${zone.deliveryPercentage >= 25 ? 'สูง' : zone.deliveryPercentage < 15 ? 'ต่ำ' : 'ปานกลาง'}</p>
            <p>ปริมาณอ้อยนำส่ง ${zone.deliveryTons.toLocaleString()} ตัน คิดเป็น ${((zone.deliveryTons / zone.production) * 100).toFixed(1)}% ของผลผลิตทั้งหมดในเขต</p>
            ${zone.deliveryPercentage < 20 ? 
                '<p class="warning-text"><i class="fas fa-exclamation-circle"></i> เขตนี้มีอัตราการนำส่งต่ำกว่าค่าเฉลี่ย ควรพิจารณาสนับสนุนเพิ่มเติม</p>' : 
                ''}
        </div>
    `;
    
    // แสดง modal
    document.getElementById('zone-detail-modal').classList.remove('hidden');
}

// อัปเดตการวิเคราะห์
function updateAnalysis() {
    // หาเขตที่มีประสิทธิภาพสูงสุดและต่ำสุด
    const maxPercentageZone = [...sugarCaneData].sort((a, b) => b.deliveryPercentage - a.deliveryPercentage)[0];
    const minPercentageZone = [...sugarCaneData].sort((a, b) => a.deliveryPercentage - b.deliveryPercentage)[0];
    
    const maxTonsZone = [...sugarCaneData].sort((a, b) => b.deliveryTons - a.deliveryTons)[0];
    
    // คำนวณค่าเฉลี่ย
    const avgPercentage = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryPercentage, 0) / sugarCaneData.length;
    const avgTons = sugarCaneData.reduce((sum, zone) => sum + zone.deliveryTons, 0) / sugarCaneData.length;
    
    // คำนวณสัดส่วน Brix
    const totalMeasured = sugarCaneData.reduce((sum, zone) => sum + zone.measuredBrix, 0);
    const totalNotMeasured = sugarCaneData.reduce((sum, zone) => sum + zone.notMeasuredBrix, 0);
    const brixPercentage = (totalMeasured / (totalMeasured + totalNotMeasured) * 100).toFixed(1);
    
    // อัปเดตข้อมูลในส่วนการวิเคราะห์
    document.querySelector('.analysis-card:nth-child(1) .analysis-content').innerHTML = `
        <p><strong>เขต ${maxPercentageZone.zone}</strong> มีอัตรานำส่งสูงสุดที่ <span class="highlight">${maxPercentageZone.deliveryPercentage}%</span> ด้วยปริมาณนำส่ง ${maxPercentageZone.deliveryTons.toLocaleString()} ตัน</p>
        <p><strong>เขต ${maxTonsZone.zone}</strong> มีปริมาณนำส่งมากสุดที่ <span class="highlight">${maxTonsZone.deliveryTons.toLocaleString()} ตัน</span> (${((maxTonsZone.deliveryTons / maxTonsZone.production) * 100).toFixed(1)}% ของผลผลิตเขต)</p>
    `;
    
    document.querySelector('.analysis-card:nth-child(2) .analysis-content').innerHTML = `
        <p><strong>เขต ${minPercentageZone.zone}</strong> มีอัตรานำส่งต่ำสุดที่ <span class="highlight">${minPercentageZone.deliveryPercentage}%</span> เท่านั้น</p>
        <p><strong>เขต 4</strong> มีอัตรานำส่งเพียง <span class="highlight">14%</span> และปริมาณนำส่ง ${sugarCaneData.find(z => z.zone === 4).deliveryTons.toLocaleString()} ตัน</p>
    `;
    
    document.querySelector('.analysis-card:nth-child(3) .analysis-content').innerHTML = `
        <p>อัตราการนำส่งเฉลี่ยทั่วทุกเขต: <span class="highlight">${avgPercentage.toFixed(1)}%</span></p>
        <p>ปริมาณนำส่งเฉลี่ยต่อเขต: <span class="highlight">${(avgTons / 1000).toFixed(1)} พันตัน</span></p>
        <p>อ้อยที่วัด Brix: <span class="highlight">${brixPercentage}%</span> ของทั้งหมด</p>
    `;
}

// ตั้งค่าอีเวนต์
function setupEventListeners() {
    // ปุ่มวิเคราะห์ข้อมูล
    document.getElementById('analyze-btn').addEventListener('click', function() {
        const selectedZone = document.getElementById('zone-filter').value;
        const selectedMetric = document.getElementById('metric-select').value;
        
        filterAndUpdate(selectedZone, selectedMetric);
    });
    
    // ปุ่มส่งออก CSV
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // ปุ่มส่งออก PDF (จำลอง)
    document.getElementById('export-pdf').addEventListener('click', function() {
        alert('ฟังก์ชันส่งออก PDF อยู่ในระหว่างการพัฒนา');
    });
    
    // ปิด modal
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('zone-detail-modal').classList.add('hidden');
        });
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่
    document.getElementById('zone-detail-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });
}

// กรองและอัปเดตข้อมูล
function filterAndUpdate(zoneFilter, metric) {
    let filteredData = sugarCaneData;
    
    // กรองตามเขต
    if (zoneFilter !== 'all') {
        filteredData = sugarCaneData.filter(zone => zone.zone == zoneFilter);
    }
    
    // อัปเดตตาราง
    updateTableWithFilter(filteredData);
    
    // อัปเดตกราฟ
    updateChartsWithFilter(filteredData, metric);
    
    // แสดงข้อความ
    if (zoneFilter === 'all') {
        showMessage(`แสดงข้อมูลทั้งหมด ${filteredData.length} เขต`, 'info');
    } else {
        showMessage(`แสดงข้อมูลเขต ${zoneFilter}`, 'info');
    }
}

// อัปเดตตารางด้วยข้อมูลที่กรอง
function updateTableWithFilter(filteredData) {
    const tableBody = document.getElementById('zone-table-body');
    tableBody.innerHTML = '';
    
    filteredData.forEach(zone => {
        const row = document.createElement('tr');
        row.className = 'zone-row';
        row.dataset.zone = zone.zone;
        
        let statusClass = 'status-medium';
        let statusText = 'ปานกลาง';
        
        if (zone.deliveryPercentage >= 25) {
            statusClass = 'status-high';
            statusText = 'สูง';
        } else if (zone.deliveryPercentage < 15) {
            statusClass = 'status-low';
            statusText = 'ต่ำ';
        }
        
        row.innerHTML = `
            <td><strong>เขต ${zone.zone}</strong></td>
            <td>${zone.farmers.toLocaleString()}</td>
            <td>${zone.plots.toLocaleString()}</td>
            <td>${zone.area.toLocaleString()}</td>
            <td>${zone.production.toLocaleString()}</td>
            <td>${zone.deliveryFarmers.toLocaleString()}</td>
            <td><strong>${zone.deliveryPercentage}%</strong></td>
            <td>${zone.deliveryTons.toLocaleString()}</td>
            <td>${zone.measuredBrix.toLocaleString()}</td>
            <td>${zone.notMeasuredBrix.toLocaleString()}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // อัปเดตข้อมูลสรุป
    if (filteredData.length === 1) {
        const zone = filteredData[0];
        document.querySelector('.table-total').style.display = 'none';
        
        // อัปเดตข้อมูลส่วนล่างของตาราง
        document.querySelector('.table-info p').textContent = `แสดงข้อมูลเขต ${zone.zone}`;
    } else {
        document.querySelector('.table-total').style.display = '';
        document.querySelector('.table-info p').textContent = `แสดงข้อมูล ${filteredData.length} เขต จากทั้งหมด ${sugarCaneData.length} เขต`;
    }
    
    // เพิ่มอีเวนต์คลิกใหม่
    document.querySelectorAll('.zone-row').forEach(row => {
        row.addEventListener('click', function() {
            const zoneNumber = this.dataset.zone;
            showZoneDetails(zoneNumber);
        });
    });
}

// อัปเดตกราฟด้วยข้อมูลที่กรอง
function updateChartsWithFilter(filteredData, metric) {
    // อัปเดตกราฟแท่ง
    const zoneLabels = filteredData.map(zone => `เขต ${zone.zone}`);
    const deliveryPercentages = filteredData.map(zone => zone.deliveryPercentage);
    const deliveryTons = filteredData.map(zone => zone.deliveryTons / 1000);
    
    zoneBarChart.data.labels = zoneLabels;
    zoneBarChart.data.datasets[0].data = deliveryPercentages;
    zoneBarChart.data.datasets[1].data = deliveryTons;
    
    // ปรับช่วงแกน Y
    if (filteredData.length === 1) {
        zoneBarChart.options.scales.y.max = Math.max(filteredData[0].deliveryPercentage * 1.5, 50);
    } else {
        zoneBarChart.options.scales.y.max = 35;
    }
    
    zoneBarChart.update();
    
    // อัปเดตกราฟวงกลมตาม metric ที่เลือก
    if (metric === 'percentage') {
        // กราฟแสดงสัดส่วนตามเปอร์เซ็นต์การนำส่ง
        const high = filteredData.filter(zone => zone.deliveryPercentage >= 25).length;
        const medium = filteredData.filter(zone => zone.deliveryPercentage >= 15 && zone.deliveryPercentage < 25).length;
        const low = filteredData.filter(zone => zone.deliveryPercentage < 15).length;
        
        percentagePieChart.data.labels = ['นำส่งสูง (≥25%)', 'นำส่งปานกลาง (15-24%)', 'นำส่งต่ำ (<15%)'];
        percentagePieChart.data.datasets[0].data = [high, medium, low];
        percentagePieChart.options.plugins.tooltip.callbacks.label = function(context) {
            const total = high + medium + low;
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} เขต (${percentage}%)`;
        };
    } else if (metric === 'tonnage') {
        // กราฟแสดงสัดส่วนตามปริมาณการนำส่ง
        const totalDelivery = filteredData.reduce((sum, zone) => sum + zone.deliveryTons, 0);
        const high = filteredData.filter(zone => zone.deliveryTons >= 20000).reduce((sum, zone) => sum + zone.deliveryTons, 0);
        const medium = filteredData.filter(zone => zone.deliveryTons >= 10000 && zone.deliveryTons < 20000).reduce((sum, zone) => sum + zone.deliveryTons, 0);
        const low = filteredData.filter(zone => zone.deliveryTons < 10000).reduce((sum, zone) => sum + zone.deliveryTons, 0);
        
        percentagePieChart.data.labels = ['นำส่งสูง (≥20,000 ตัน)', 'นำส่งปานกลาง (10,000-19,999 ตัน)', 'นำส่งต่ำ (<10,000 ตัน)'];
        percentagePieChart.data.datasets[0].data = [high, medium, low];
        percentagePieChart.options.plugins.tooltip.callbacks.label = function(context) {
            const percentage = ((context.raw / totalDelivery) * 100).toFixed(1);
            return `${context.label}: ${context.raw.toLocaleString()} ตัน (${percentage}%)`;
        };
    }
    
    percentagePieChart.update();
}

// ส่งออกข้อมูลเป็น CSV
function exportToCSV() {
    // สร้างหัวตาราง CSV
    let csvContent = "เขต,ผู้ปลูกทั้งหมด,แปลงทั้งหมด,พื้นที่(ไร่),ผลผลิต(ตัน),ผู้ปลูกนำส่ง,อ้อยนำส่ง(%),ปริมาณนำส่ง(ตัน),วัดBrix,ไม่วัดBrix,สถานะ\n";
    
    // เพิ่มข้อมูลแต่ละเขต
    sugarCaneData.forEach(zone => {
        let status = 'ปานกลาง';
        if (zone.deliveryPercentage >= 25) status = 'สูง';
        else if (zone.deliveryPercentage < 15) status = 'ต่ำ';
        
        csvContent += `เขต ${zone.zone},${zone.farmers},${zone.plots},${zone.area},${zone.production},${zone.deliveryFarmers},${zone.deliveryPercentage},${zone.deliveryTons},${zone.measuredBrix},${zone.notMeasuredBrix},${status}\n`;
    });
    
    // สร้าง Blob และดาวน์โหลด
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.download = `อ้อยนำส่ง_ปี6869_${timestamp}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // คืนทรัพยากร
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showMessage('ส่งออกข้อมูลเป็น CSV สำเร็จ', 'success');
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
    
    // ลบข้อความหลังจาก 4 วินาที
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// เพิ่ม CSS สำหรับ modal details
const detailStyle = document.createElement('style');
detailStyle.textContent = `
    .zone-detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .detail-card {
        background: #f8fafc;
        border-radius: 8px;
        padding: 15px;
        border-left: 4px solid #3498db;
    }
    
    .detail-card h4 {
        color: #2c3e50;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px dashed #dee2e6;
    }
    
    .detail-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .detail-item span {
        color: #6c757d;
    }
    
    .detail-item strong {
        color: #2c3e50;
    }
    
    .zone-analysis {
        background: #e6f7ff;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid #2ecc71;
    }
    
    .zone-analysis h4 {
        color: #2c3e50;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .zone-analysis p {
        margin-bottom: 8px;
        line-height: 1.5;
    }
    
    .warning-text {
        color: #e74c3c;
        background: #f8d7da;
        padding: 10px;
        border-radius: 6px;
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(detailStyle);
