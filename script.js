// ตัวแปรเก็บข้อมูล
let csvData = [];
let summaryByZone = {};
let summaryByDistrict = {};
let summaryByZoneDistrict = {};
let filteredDetails = [];
let currentPage = 1;
let recordsPerPage = 25;
let zoneChartInstance = null;
let districtChartInstance = null;

// องค์ประกอบ DOM
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const reportSection = document.getElementById('report-section');
const zoneSummaryTable = document.getElementById('zone-summary-table').getElementsByTagName('tbody')[0];
const zoneSummaryTotalRow = document.getElementById('zone-summary-total');
const districtSummaryTable = document.getElementById('district-summary-table').getElementsByTagName('tbody')[0];
const districtSummaryTotalRow = document.getElementById('district-summary-total');
const zoneDistrictSummaryTable = document.getElementById('zone-district-summary-table').getElementsByTagName('tbody')[0];
const detailsTable = document.getElementById('details-table');
const detailsTableBody = detailsTable.getElementsByTagName('tbody')[0];
const zoneFilter = document.getElementById('zone-filter');
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const pageSizeSelect = document.getElementById('page-size');
const totalZonesElement = document.getElementById('total-zones');
const totalDistrictsElement = document.getElementById('total-districts');
const totalPlotsElement = document.getElementById('total-plots');
const totalAreaElement = document.getElementById('total-area');
const downloadSummaryBtn = document.getElementById('download-summary-btn');
const downloadDetailsBtn = document.getElementById('download-details-btn');
const resetBtn = document.getElementById('reset-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
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

    // อีเวนต์สำหรับแท็บ
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
        });
    });

    // อีเวนต์สำหรับตัวกรองและค้นหา
    zoneFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayDetails();
        updateDistrictFilterOptions();
    });

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
       
