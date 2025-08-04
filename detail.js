// --- ‼️ กรุณากรอกข้อมูล Firebase ของคุณที่นี่ (ใช้ชุดเดียวกับ script.js) ‼️ ---
const firebaseConfig = {
    apiKey: "AIzaSyCad3vMEdmWQUcUDJA6BHYD6AZruzgqom4",
    authDomain: "testdirt-58ba4.firebaseapp.com",
    projectId: "testdirt-58ba4",
    storageBucket: "testdirt-58ba4.firebasestorage.app",
    messagingSenderId: "89792009820",
    appId: "1:89792009820:web:86ff41e9d3211f00997899"
};

// --- เริ่มต้นการเชื่อมต่อ Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- ฟังก์ชันสำหรับลบข้อมูล ---
async function deleteData(docId) {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้")) {
        return;
    }

    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = "กำลังลบข้อมูล...";

    try {
        // ลบข้อมูลจาก Firestore
        await db.collection("soil_tests").doc(docId).delete();
        
        alert("ลบข้อมูลเรียบร้อยแล้ว!");
        // กลับไปหน้า Home
        window.location.href = "index.html";

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลบข้อมูล: ", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง");
        
        // รีเซ็ตปุ่ม
        deleteBtn.disabled = false;
        deleteBtn.textContent = "🗑️ ลบข้อมูลนี้";
    }
}

// --- ฟังก์ชันสำหรับดึง ID จาก URL ---
function getIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// --- ฟังก์ชันสำหรับดึงและแสดงรายละเอียดข้อมูล ---
async function displayDetailData() {
    const container = document.getElementById('detail-container');
    const docId = getIdFromURL();

    if (!docId) {
        container.innerHTML = '<p class="loading">ไม่พบข้อมูลที่ต้องการ</p>';
        return;
    }

    container.innerHTML = '<p class="loading">กำลังโหลดข้อมูล...</p>';

    try {
        // ดึงข้อมูลเฉพาะ document ที่ต้องการ
        const doc = await db.collection("soil_tests").doc(docId).get();

        if (!doc.exists) {
            container.innerHTML = '<p class="loading">ไม่พบข้อมูลที่ต้องการ</p>';
            return;
        }

        const data = doc.data();
        
        // จัดรูปแบบวันที่
        const testDate = new Date(data.testDate).toLocaleDateString('th-TH', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });

        // สร้าง HTML สำหรับรูปภาพ
        let imagesHTML = '';
        if (data.files && data.files.length > 0) {
            const imageItems = data.files.map(url => `
                <div class="image-item">
                    <img src="${url}" alt="รูปภาพดิน" onclick="window.open('${url}', '_blank')">
                </div>
            `).join('');
            
            imagesHTML = `
                <div class="images-section">
                    <h5>รูปภาพประกอบ</h5>
                    <div class="images-grid">${imageItems}</div>
                </div>
            `;
        } else {
            imagesHTML = `
                <div class="images-section">
                    <h5>รูปภาพประกอบ</h5>
                    <div class="no-images">ไม่มีรูปภาพ</div>
                </div>
            `;
        }

        // สร้าง HTML ทั้งหมด
        container.innerHTML = `
            <div class="detail-card">
                <div class="card-header">
                    ${data.location} (${data.mountain})
                </div>
                
                <div class="card-body">
                    <div class="info-item">
                        <span class="info-label">ช่วงอายุของกาแฟ</span>
                        <span class="info-value">${data.coffeeAge || 'ไม่มีข้อมูล'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">วันที่ทดสอบ</span>
                        <span class="info-value">${testDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ผลทดสอบที่</span>
                        <span class="info-value">${data.testNumber}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">pH</span>
                        <span class="info-value">${data.ph}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">อินทรียวัตถุ (OM)</span>
                        <span class="info-value">${data.om}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ไนโตรเจน (Total-N)</span>
                        <span class="info-value">${data.n} mg/kg</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ฟอสฟอรัส (Avail.P)</span>
                        <span class="info-value">${data.p} mg/kg</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">โพแทสเซียม (Exch.K)</span>
                        <span class="info-value">${data.k} mg/kg</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">EC</span>
                        <span class="info-value">${data.ec} mS/cm</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ความชื้น</span>
                        <span class="info-value">${data.moisture}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">อุณหภูมิ</span>
                        <span class="info-value">${data.temperature}°C</span>
                    </div>
                    
                    ${imagesHTML}
                </div>
            </div>
        `;

        // แสดงปุ่มลบและเพิ่ม event listener
        const deleteBtn = document.getElementById('deleteBtn');
        deleteBtn.style.display = 'inline-block';
        deleteBtn.addEventListener('click', () => deleteData(docId));

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล: ", error);
        container.innerHTML = '<p class="loading">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>';
    }
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = displayDetailData;
