// =========================
// 🔧 ตั้งค่า Firebase & Cloudinary
// =========================

// --- ‼️ กรอกค่าของโปรเจกต์คุณให้ถูกต้องก่อนใช้งาน ‼️ ---
const firebaseConfig = {
  apiKey: "AIzaSyCad3vMEdmWQUcUDJA6BHYD6AZruzgqom4",
  authDomain: "testdirt-58ba4.firebaseapp.com",
  projectId: "testdirt-58ba4",
  storageBucket: "testdirt-58ba4.firebasestorage.app",
  messagingSenderId: "89792009820",
  appId: "1:89792009820:web:86ff41e9d3211f00997899"
};

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfix1lo9q/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "soil_test_uploads";

// --- เริ่มต้นการเชื่อมต่อ Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// =========================
// 📎 ส่วนจัดการไฟล์แนบ (ภาพ/วิดีโอ)
// =========================

// เก็บไฟล์ที่ผู้ใช้เลือกสะสมข้ามการเลือกหลายครั้ง
const selectedFiles = [];
const selectedFileKeys = new Set();
function addToSelectedFiles(fileList){
  Array.from(fileList || []).forEach(f => {
    const key = `${f.name}|${f.size}|${f.lastModified}`;
    if (!selectedFileKeys.has(key)) {
      selectedFileKeys.add(key);
      selectedFiles.push(f);
    }
  });
}

function createFileInput() {
  const row = document.createElement("div");
  row.classList.add("file-row");

  const input = document.createElement("input");
  input.type = "file";
  input.name = "mediaFiles[]";
  input.accept = ".jpg,.jpeg,.png";
  input.multiple = true;
  // เมื่อเลือกไฟล์ ให้สะสมไฟล์ไว้ เพื่อให้เลือกหลายรอบได้จริง
  input.addEventListener("change", () => {
    addToSelectedFiles(input.files);
    // ล้างค่าใน input เพื่อให้สามารถเลือกไฟล์เดิมอีกรอบได้ถ้าต้องการ และป้องกันการแทนที่ไฟล์ก่อนหน้า
    input.value = "";
  });

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "ลบ";
  removeBtn.classList.add("remove-btn");
  removeBtn.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(removeBtn);
  return row;
}

document.getElementById("addFileBtn").addEventListener("click", () => {
  document.getElementById("fileInputs").appendChild(createFileInput());
});

// เพิ่ม input แรกให้อัตโนมัติ เพื่อให้ผู้ใช้เลือกไฟล์หลายรอบโดยไม่ถูกแทนที่ไฟล์เดิม
(function ensureInitialFileInput(){
  const wrap = document.getElementById("fileInputs");
  if (wrap && !wrap.querySelector("input[type='file']")) {
    wrap.appendChild(createFileInput());
  }
})();

// =========================
/*  🧾 Submit Form:
    1) อัปโหลดไฟล์ไป Cloudinary
    2) รวมข้อมูลจากฟอร์ม
    3) บันทึกลง Firestore
*/
// =========================

document.getElementById("soilForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const saveBtn = e.target.querySelector(".btn-save");
  saveBtn.disabled = true;
  saveBtn.textContent = "กำลังอัปโหลดไฟล์...";

  try {
    // --- 1) อัปโหลดไฟล์ทั้งหมดขึ้น Cloudinary ---
    // ใช้ไฟล์ที่สะสมไว้ ถ้าไม่มี ให้ fallback ไปดึงจาก input ปัจจุบันทั้งหมด
    let filesToUpload = selectedFiles.slice();
    if (filesToUpload.length === 0) {
      const fileInputs = document.querySelectorAll("input[name='mediaFiles[]']");
      fileInputs.forEach(input => Array.from(input.files || []).forEach(file => filesToUpload.push(file)));
    }

    const uploadPromises = filesToUpload.map(file => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      return fetch(CLOUDINARY_URL, { method: "POST", body: formData }).then(res => res.json());
    });

    const uploadedResponses = await Promise.all(uploadPromises);
    const fileURLs = uploadedResponses
      .filter(res => res && res.secure_url)
      .map(res => res.secure_url);

    saveBtn.textContent = "กำลังบันทึกข้อมูล...";

    // --- 2) รวมข้อมูลจากฟอร์ม (ดึงจากทุก ID ที่มี) ---
    const value = id => {
      const el = document.getElementById(id);
      return el ? (el.value ?? '') : '';
    };

    const num = id => {
      const v = value(id);
      if (v === '' || v === null || v === undefined) return null;
      const parsed = Number(v);
      if (isNaN(parsed)) return null;
      const positiveOnlyFields = ['age', 'coffee_experience', 'planting_area', 'fertilizer_frequency', 
                                 'fertilizer_amount', 'yield_per_tree', 'fertilizer_cost', 'labor_cost', 
                                 'other_costs', 'coffee_height', 'coffee_circumference'];
      if (positiveOnlyFields.includes(id) && parsed < 0) {
        return null;
      }
      return parsed;
    };

    const formDataForFirebase = {
      // ข้อมูลแปลง
      mountain: value("mountain"),
      plot_number: value("plot_number"),

      // ทะเบียนเกษตรกร
      farmer_name: value("farmer_name"),
      age: num("age"),
      coffee_experience: num("coffee_experience"),
      planting_area: num("planting_area"),
      address: value("address"),
      gps_coordinates: value("gps_coordinates"),
      water_system: value("water_system"),
      fertilizer_type: value("fertilizer_type"),
      fertilizer_formula: value("fertilizer_formula"),
      fertilizer_frequency: num("fertilizer_frequency"),
      fertilizer_amount: num("fertilizer_amount"),
      soil_problems: value("soil_problems"),
      yield_problems: value("yield_problems"),
      internet_access: value("internet_access"),
      yield_per_tree: num("yield_per_tree"),
      cupping_experience: value("cupping_experience"),
      fertilizer_cost: num("fertilizer_cost"),
      labor_cost: num("labor_cost"),
      other_costs: num("other_costs"),

      // วัดค่าดินแบบพกพา
      n_portable: num("n_portable"),
      ph_portable: num("ph_portable"),
      p_portable: num("p_portable"),
      om_portable: num("om_portable"),
      k_portable: num("k_portable"),
      moisture_portable: num("moisture_portable"),
      ec_portable: num("ec_portable"),
      temp_portable: num("temp_portable"),

      // ติดตามการเจริญเติบโต
      coffee_height: num("coffee_height"),
      coffee_circumference: num("coffee_circumference"),
      flowering: value("flowering"),
      fruiting: value("fruiting"),
      disease_problem: value("disease_problem"),
      insect_problem: value("insect_problem"),
      worm_problem: value("worm_problem"),

      // ไฟล์แนบ
      files: fileURLs,

      // เมตา
      createdAt: new Date()
    };

    // ตรวจสอบข้อมูลก่อนบันทึก
    const validationErrors = validateFormData(formDataForFirebase);
    if (validationErrors.length > 0) {
      alert('พบข้อผิดพลาด:\n' + validationErrors.join('\n'));
      saveBtn.disabled = false;
      saveBtn.textContent = "บันทึกข้อมูล";
      return;
    }

    // --- 3) บันทึกลง Firestore ---
    // หน้าฟอร์มสร้างข้อมูลใหม่เท่านั้น ไม่อัปเดตข้อมูลเก่า
    await db.collection("soil_tests_new").add(formDataForFirebase);
    
    alert("บันทึกข้อมูลใหม่เรียบร้อยแล้ว!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    
    // แสดง error ที่ละเอียดมากขึ้น
    let errorMessage = "เกิดข้อผิดพลาดในการบันทึกข้อมูล: ";
    if (error.code) {
      errorMessage += `\nรหัสข้อผิดพลาด: ${error.code}`;
    }
    if (error.message) {
      errorMessage += `\nรายละเอียด: ${error.message}`;
    }
    
    alert(errorMessage);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "บันทึกข้อมูล";
  }
});

// เพิ่มฟังก์ชันตรวจสอบข้อมูลก่อนบันทึก
function validateFormData(data) {
  const errors = [];
  
  // ตรวจสอบค่าที่ไม่ควรเป็นลบ
  const positiveFields = {
    'age': 'อายุ',
    'coffee_experience': 'ประสบการณ์ปลูกกาแฟ',
    'planting_area': 'พื้นที่เพาะปลูก',
    'fertilizer_cost': 'ต้นทุนปุ๋ย',
    'labor_cost': 'ค่าแรงงาน',
    'other_costs': 'ค่าใช้จ่ายอื่นๆ',
    'coffee_height': 'ความสูงต้น',
    'coffee_circumference': 'เส้นรอบวง'
  };
  
  Object.keys(positiveFields).forEach(field => {
    if (data[field] !== null && data[field] < 0) {
      errors.push(`${positiveFields[field]} ไม่ควรเป็นค่าลบ`);
    }
  });
  
  return errors;
}


// =========================
// 🧭 Google Map + Geolocation
// =========================

let map;
let marker;
const defaultPosition = { lat: 19.0333, lng: 99.8333 }; // ภาคเหนือไทย (สำรอง)

function initMap(startPosOverride) {
  const gpsInput = document.getElementById('gps_coordinates');
  const existingCoords = gpsInput.value.split(',').map(Number);

  const startPosition =
    startPosOverride
      ? startPosOverride
      : (existingCoords.length === 2 && !isNaN(existingCoords[0]) && !isNaN(existingCoords[1]))
        ? { lat: existingCoords[0], lng: existingCoords[1] }
        : defaultPosition;

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: startPosition,
  });

  marker = new google.maps.Marker({
    position: startPosition,
    map: map,
    draggable: true
  });

  map.addListener("click", (e) => {
    marker.setPosition(e.latLng);
  });
}

// ให้ callback=initMap ในสคริปต์ Google Maps เรียกเจอ
window.initMap = initMap;

// ตรวจ permission ของ geolocation (ถ้าใช้ได้ จะได้ 'granted' | 'prompt' | 'denied')
const ensureGeoPermission = async () => {
  try {
    if (!('permissions' in navigator) || !('geolocation' in navigator)) return 'unsupported';
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
};

const showGeoHint = (state) => {
  const hintId = 'geo-hint';
  let hint = document.getElementById(hintId);
  if (!hint) {
    hint = document.createElement('div');
    hint.id = hintId;
    hint.style.margin = '0 0 10px';
    hint.style.color = '#5a4a37';
    hint.style.fontSize = '0.95rem';
    const modalContent = document.querySelector('#mapModal .modal-content');
    if (modalContent) modalContent.prepend(hint);
  }
  if (state === 'denied') {
    hint.innerHTML = 'เบราว์เซอร์ปิดสิทธิ์ตำแหน่งไว้ — ไปที่ไอคอนกุญแจบนแถบที่อยู่ → Site settings → Location: <b>Allow</b> แล้วรีโหลดหน้า';
  } else if (state === 'unsupported') {
    hint.textContent = 'เบราว์เซอร์ไม่รองรับ geolocation หรือไม่ได้รันบน HTTPS/localhost';
  } else if (state === 'unknown') {
    hint.textContent = 'ไม่สามารถตรวจสอบสิทธิ์ตำแหน่งได้ (อาจมาจากนโยบายเบราว์เซอร์)';
  } else {
    hint.textContent = '';
  }
};


// =========================
// 🧩 UI: Modal แผนที่ + ตัวเลือกแปลง + ปักหมุดปัจจุบัน + auto-format ปุ๋ย
// =========================

document.addEventListener('DOMContentLoaded', function() {
  // --- จัดการ Modal แผนที่ ---
  const modal = document.getElementById('mapModal');
  const mapBtn = document.getElementById('mapBtn');
  const closeBtn = document.querySelector('.close-btn');
  const confirmBtn = document.getElementById('confirmLocationBtn');
  const gpsInput = document.getElementById('gps_coordinates');
  const locateMeBtn = document.getElementById('locateMeBtn'); // ปุ่ม 📍 ปักหมุดที่ตำแหน่งปัจจุบัน

  // --- ปุ่มเลือกจากแผนที่ ---
  mapBtn.onclick = async function() {
    modal.style.display = "block";

    // ตรวจสถานะ permission แล้วขึ้นคำแนะนำ
    const state = await ensureGeoPermission();
    showGeoHint(state);

    // ฟังก์ชันขอพิกัดผู้ใช้ แล้ว init/อัปเดตแผนที่
    const startWithGeo = () => {
      if (!navigator.geolocation) {
        if (!map) initMap();
        return;
      }
      const options = { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 };
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (map) {
            map.setCenter(current);
            marker.setPosition(current);
          } else {
            initMap(current);
          }
        },
        (_err) => {
          // ผู้ใช้ปฏิเสธ/หาไม่เจอ → fallback และแสดงคำแนะนำ
          showGeoHint('denied');
          if (!map) initMap();
        },
        options
      );
    };

    // ถ้า Google Maps โหลดแล้วค่อยเริ่มด้วย geolocation
    if (typeof google === 'object' && typeof google.maps === 'object') {
      if (!map) startWithGeo();
      else google.maps.event.trigger(map, "resize");
    } else {
      // รอสคริปต์โหลดสั้น ๆ แล้วลองอีกครั้ง
      setTimeout(() => {
        if (!map && typeof google === 'object' && typeof google.maps === 'object') {
          startWithGeo();
        }
      }, 300);
    }
  };

  // --- ปุ่มปักหมุดที่ตำแหน่งปัจจุบัน ---
  if (locateMeBtn) {
    locateMeBtn.onclick = function() {
      if (!navigator.geolocation) {
        alert("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
        return;
      }
      locateMeBtn.textContent = "กำลังค้นหาตำแหน่ง...";
      locateMeBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (map && marker) {
            map.setCenter(current);
            marker.setPosition(current);
          } else if (typeof google === 'object' && typeof google.maps === 'object') {
            initMap(current);
          }
          locateMeBtn.textContent = "📍 ปักหมุดที่ตำแหน่งปัจจุบัน";
          locateMeBtn.disabled = false;
        },
        (err) => {
          alert("ไม่สามารถระบุตำแหน่งได้: " + err.message);
          locateMeBtn.textContent = "📍 ปักหมุดที่ตำแหน่งปัจจุบัน";
          locateMeBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    };
  }

  // --- ปุ่มยืนยันพิกัด ---
  confirmBtn.onclick = function() {
    if (!marker) return;
    const currentPos = marker.getPosition();
    gpsInput.value = `${currentPos.lat().toFixed(6)}, ${currentPos.lng().toFixed(6)}`;
    modal.style.display = "none";
  };

  // --- ปิด modal ---
  closeBtn.onclick = function() {
    modal.style.display = "none";
  };
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  // --- ตัวเลือก "แปลงหมายเลข" ตามดอยที่เลือก ---
  const mountainSelect = document.getElementById('mountain');
  const plotSelect = document.getElementById('plot_number');

  mountainSelect.addEventListener('change', function() {
    plotSelect.innerHTML = '<option value="" disabled selected>-- โปรดเลือกแปลง --</option>';
    const selectedMountain = this.value;

    if (selectedMountain === 'ดอยช้าง') {
      for (let i = 1; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = `DC${i}`;
        option.textContent = `DC${i}`;
        plotSelect.appendChild(option);
      }
    } else if (selectedMountain === 'ดอยแม่สลอง') {
      for (let i = 1; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = `MSL${i}`;
        option.textContent = `MSL${i}`;
        plotSelect.appendChild(option);
      }
    }
  });

  // --- Auto-format: เบอร์ปุ๋ยที่ใส่ (เช่น 15-15-15) ---
  const fertInput = document.getElementById('fertilizer_formula');
  if (fertInput) {
    fertInput.addEventListener('input', function() {
      let val = this.value.replace(/[^0-9]/g, ''); // เอาเฉพาะตัวเลข
      if (val.length > 1 && val.length <= 3) {
        val = val.slice(0, 2) + '-' + val.slice(2);
      } else if (val.length > 3 && val.length <= 5) {
        val = val.slice(0, 2) + '-' + val.slice(2, 4) + '-' + val.slice(4);
      } else if (val.length > 5) {
        val = val.slice(0, 2) + '-' + val.slice(2, 4) + '-' + val.slice(4, 6);
      }
      this.value = val;
    });

    // กันพิมพ์เกินรูปแบบ 15-15-15
    fertInput.addEventListener('keypress', function(e) {
      const raw = this.value.replace(/[^0-9]/g, '');
      if (raw.length >= 6 && /[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });

    // วาง (paste) ก็เคลียร์ให้เป็นรูปแบบที่ถูกต้อง
    fertInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const digits = (text || '').replace(/[^0-9]/g, '').slice(0, 6);
      let val = digits;
      if (val.length > 2 && val.length <= 4) {
        val = val.slice(0, 2) + '-' + val.slice(2);
      } else if (val.length > 4) {
        val = val.slice(0, 2) + '-' + val.slice(2, 4) + '-' + val.slice(4);
      }
      fertInput.value = val;
    });
  }
});

// ---------- Prefill "ทะเบียนเกษตรกร" เมื่อเลือก ดอย + แปลง ----------
function setVal(id, v){ 
  const el = document.getElementById(id);
  if(!el) return;
  
  // ตรวจสอบค่าที่จะกรอก
  let valueToSet = v ?? '';
  
  // ถ้าเป็นตัวเลขและเป็นค่าลบในฟิลด์ที่ไม่ควรติดลบ
  if (typeof v === 'number' && !isNaN(v)) {
    const positiveOnlyFields = ['age', 'coffee_experience', 'planting_area', 'fertilizer_frequency', 
                               'fertilizer_amount', 'yield_per_tree', 'fertilizer_cost', 'labor_cost', 
                               'other_costs', 'coffee_height', 'coffee_circumference'];
    
    if (positiveOnlyFields.includes(id) && v < 0) {
      valueToSet = ''; // ถ้าเป็นค่าลบให้เซ็ตเป็นค่าว่าง
    } else {
      valueToSet = v.toString();
    }
  }
  
  if (el.tagName === 'SELECT') {
    el.value = valueToSet;
  } else {
    el.value = valueToSet;
  }
}

async function prefillFarmerSection() {
  const mountain = document.getElementById('mountain').value;
  const plot = document.getElementById('plot_number').value;
  if (!mountain || !plot) {
    clearFormFields(); // ล้างค่าและปลดล็อคเมื่อไม่มีการเลือก
    return;
  }

  // helper: fallback query ที่ไม่ใช้ orderBy (ไม่ต้องมี index)
  const fallbackQuery = async () => {
    const fb = await db.collection('soil_tests_new')
      .where('mountain','==', mountain)
      .where('plot_number','==', plot)
      .get();
    const docs = [];
    fb.forEach(d => docs.push({id:d.id, ...d.data()}));
    if (!docs.length) return null;
    // sort เอาใหม่สุดเอง
    docs.sort((a,b)=>{
      const ta = a.createdAt?.seconds ? a.createdAt.seconds*1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tb = b.createdAt?.seconds ? b.createdAt.seconds*1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tb - ta;
    });
    return docs[0];
  };

  try {
    const snap = await db.collection('soil_tests_new')
      .where('mountain','==', mountain)
      .where('plot_number','==', plot)
      .orderBy('createdAt','desc')
      .limit(1)
      .get();

    let data = null;
    if (!snap.empty) data = snap.docs[0].data();
    else data = await fallbackQuery();

    if (!data) {
      clearFormFields(); // ล้างค่าเมื่อไม่พบข้อมูล
      return;
    }
    fillFormFromDoc(data);
    toast('โหลดข้อมูลเก่าสำเร็จ');
  } catch (err) {
    // ถ้าไม่มี index ให้ fallback อัตโนมัติ
    if (err?.code === 'failed-precondition') {
      const data = await fallbackQuery();
      if (data) {
        fillFormFromDoc(data);
        toast('โหลดข้อมูลเก่าสำเร็จ');
      } else {
        clearFormFields(); // ล้างค่าเมื่อไม่พบข้อมูล
      }
    } else {
      console.warn('prefill error:', err);
    }
  }
}

function fillFormFromDoc(d){
  // ฟิลด์ที่จะถูกล็อค
  const fieldsToLock = [
    'farmer_name', 'age', 'coffee_experience', 'planting_area', 'address', 
    'gps_coordinates', 'water_system', 'fertilizer_type', 'fertilizer_formula',
    'fertilizer_frequency', 'fertilizer_amount', 'soil_problems', 'yield_problems',
    'internet_access', 'yield_per_tree', 'cupping_experience', 'fertilizer_cost',
    'labor_cost', 'other_costs'
  ];

  setVal('farmer_name', d.farmer_name);
  setVal('age', d.age);
  setVal('coffee_experience', d.coffee_experience);
  setVal('planting_area', d.planting_area);
  setVal('address', d.address);
  setVal('gps_coordinates', d.gps_coordinates);
  setVal('water_system', d.water_system);
  setVal('fertilizer_type', d.fertilizer_type);
  setVal('fertilizer_formula', d.fertilizer_formula);
  setVal('fertilizer_frequency', d.fertilizer_frequency);
  setVal('fertilizer_amount', d.fertilizer_amount);
  setVal('soil_problems', d.soil_problems);
  setVal('yield_problems', d.yield_problems);
  setVal('internet_access', d.internet_access);
  setVal('yield_per_tree', d.yield_per_tree);
  setVal('cupping_experience', d.cupping_experience);
  setVal('fertilizer_cost', d.fertilizer_cost);
  setVal('labor_cost', d.labor_cost);
  setVal('other_costs', d.other_costs);

  // ล็อคฟิลด์และเปลี่ยนสี
  fieldsToLock.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.disabled = true;
      element.parentElement.classList.add('locked-field');
    }
  });

  // ซ่อนปุ่มแผนที่เมื่อ GPS ถูกล็อค
  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) {
    mapBtn.style.display = 'none';
  }
}

function unlockAllFields() {
  const fieldsToUnlock = [
    'farmer_name', 'age', 'coffee_experience', 'planting_area', 'address', 
    'gps_coordinates', 'water_system', 'fertilizer_type', 'fertilizer_formula',
    'fertilizer_frequency', 'fertilizer_amount', 'soil_problems', 'yield_problems',
    'internet_access', 'yield_per_tree', 'cupping_experience', 'fertilizer_cost',
    'labor_cost', 'other_costs'
  ];

  fieldsToUnlock.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.disabled = false;
      element.parentElement.classList.remove('locked-field');
    }
  });
}

function clearFormFields() {
  const fieldsToClear = [
    'farmer_name', 'age', 'coffee_experience', 'planting_area', 'address', 
    'gps_coordinates', 'water_system', 'fertilizer_type', 'fertilizer_formula',
    'fertilizer_frequency', 'fertilizer_amount', 'soil_problems', 'yield_problems',
    'internet_access', 'yield_per_tree', 'cupping_experience', 'fertilizer_cost',
    'labor_cost', 'other_costs'
  ];

  // ล้างค่าและปลดล็อค
  fieldsToClear.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.value = '';
      element.disabled = false;
      element.parentElement.classList.remove('locked-field');
    }
  });

  // แสดงปุ่มแผนที่กลับมาเมื่อล้างฟอร์ม
  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) {
    mapBtn.style.display = 'inline-block';
  }
}

// hook: ให้ prefill ทำงานแน่นอนหลังผู้ใช้เลือกแปลง
document.addEventListener('DOMContentLoaded', () => {
  const mountainSelect = document.getElementById('mountain');
  const plotSelect = document.getElementById('plot_number');

  mountainSelect.addEventListener('change', function() {
    clearFormFields(); // ล้างค่าและปลดล็อคเมื่อเปลี่ยนดอย
    // สร้าง options ตามดอย (โค้ดเดิมของคุณทำอยู่แล้ว)
    // หลังสร้างเสร็จ ถ้ามีค่า plot อยู่แล้วก็ลอง prefill อีกครั้ง
    setTimeout(prefillFarmerSection, 0);
  });

  plotSelect.addEventListener('change', prefillFarmerSection);
});

// =========================
// 🔒 ป้องกัน Input Number เปลี่ยนค่าจากลูกกลิ้งเมาส์
// =========================

// ป้องกันการเปลี่ยนค่า input number เมื่อเลื่อนลูกกลิ้งเมาส์
function preventNumberInputScroll() {
  const numberInputs = document.querySelectorAll('input[type="number"]');
  
  numberInputs.forEach(function(input) {
    // ป้องกันการเปลี่ยนค่าเฉพาะเมื่อ input ถูก focus
    input.addEventListener('wheel', function(e) {
      // ถ้า input นี้กำลังถูก focus อยู่ ให้ป้องกันการเปลี่ยนค่า
      if (document.activeElement === this) {
        e.preventDefault();
      }
      // ถ้าไม่ได้ focus ก็ให้เลื่อนหน้าได้ปกติ
    });
  });
}

// เรียกใช้ฟังก์ชันเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', preventNumberInputScroll);
