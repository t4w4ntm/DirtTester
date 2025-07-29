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

// --- ฟังก์ชันสำหรับดึงและแสดงข้อมูล ---
async function displayData() {
    const container = document.getElementById('data-container');
    container.innerHTML = '<p>กำลังโหลดข้อมูล...</p>'; // แสดงสถานะกำลังโหลด

    try {
        // ดึงข้อมูลทั้งหมดจาก collection 'soil_tests' โดยเรียงจากใหม่ไปเก่า
        const snapshot = await db.collection("soil_tests").orderBy("createdAt", "desc").get();

        if (snapshot.empty) {
            container.innerHTML = '<p>ยังไม่มีข้อมูลที่บันทึกไว้</p>';
            return;
        }

        container.innerHTML = ''; // ล้างข้อความ "กำลังโหลด"

        // วนลูปเพื่อสร้าง Card แสดงผลสำหรับแต่ละข้อมูล
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';

            // จัดรูปแบบวันที่
            const testDate = new Date(data.testDate).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            let imagesHTML = '';
            if (data.files && data.files.length > 0) {
                 imagesHTML = data.files.map(url => `
                    <div class="col-6 mb-2">
                        <img src="${url}" class="card-img-top" alt="Soil Image" onclick="window.open('${url}', '_blank')">
                    </div>
                `).join('');
            }

            card.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        สถานที่: ${data.location} (ดอย ${data.mountain})
                    </div>
                    <div class="card-body">
                        <p class="card-text"><strong>วันที่ทดสอบ:</strong> ${testDate}</p>
                        <p class="card-text"><strong>ผลทดสอบที่:</strong> ${data.testNumber}</p>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">pH: ${data.ph.value} (ระดับ: ${data.ph.level})</li>
                            <li class="list-group-item">OM: ${data.om.value}% (ระดับ: ${data.om.level})</li>
                            <li class="list-group-item">Total-N: ${data.n.value} mg/kg (ระดับ: ${data.n.level})</li>
                            <li class="list-group-item">Avail.P: ${data.p.value} mg/kg (ระดับ: ${data.p.level})</li>
                            <li class="list-group-item">Exch.K: ${data.k.value} mg/kg (ระดับ: ${data.k.level})</li>
                            <li class="list-group-item">EC: ${data.ec.value} mS/cm (ระดับ: ${data.ec.level})</li>
                             <li class="list-group-item">Moisture: ${data.moisture.value}% (ระดับ: ${data.moisture.level})</li>
                              <li class="list-group-item">Temperature: ${data.temperature.value}°C (ระดับ: ${data.temperature.level})</li>
                        </ul>
                        <h6 class="mt-3">รูปภาพประกอบ:</h6>
                        <div class="row">${imagesHTML || '<p>ไม่มีรูปภาพ</p>'}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล: ", error);
        container.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>';
    }
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = displayData;