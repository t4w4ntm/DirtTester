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

// --- ฟังก์ชันสำหรับดึงและแสดงรายการข้อมูล ---
async function displayDataList() {
    const container = document.getElementById('data-list');
    container.innerHTML = '<p class="loading">กำลังโหลดข้อมูล...</p>';

    try {
        // ดึงข้อมูลทั้งหมดจาก collection 'soil_tests' โดยเรียงจากใหม่ไปเก่า
        const snapshot = await db.collection("soil_tests").orderBy("createdAt", "desc").get();

        if (snapshot.empty) {
            container.innerHTML = '<p class="empty-state">ยังไม่มีข้อมูลที่บันทึกไว้<br>กดปุ่ม + เพื่อเพิ่มข้อมูลใหม่</p>';
            return;
        }

        container.innerHTML = ''; // ล้างข้อความ "กำลังโหลด"

        // วนลูปเพื่อสร้างรายการข้อมูล
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // จัดรูปแบบวันที่
            const testDate = new Date(data.testDate).toLocaleDateString('th-TH', {
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });

            // สร้าง element สำหรับแต่ละรายการ
            const item = document.createElement('a');
            item.className = 'data-item';
            item.href = `detail.html?id=${doc.id}`; // ส่ง ID ไปยังหน้า detail
            
            item.innerHTML = `
                <div class="item-title">${data.location}</div>
                <div class="item-subtitle">${data.mountain}</div>
                <div class="item-date">${testDate}</div>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล: ", error);
        container.innerHTML = '<p class="loading">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>';
    }
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = displayDataList;
