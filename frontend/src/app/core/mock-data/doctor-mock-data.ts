import {
  Icd10Item,
  MedicineItem,
  DrugInteractionWarning,
  ClinicalServiceOrder,
  VitalHistoryPoint,
  MedicalRecord,
} from '../models/medical-record.model';

export const MOCK_ICD10_LIST: Icd10Item[] = [
  { code: 'I10', nameVi: 'Tăng huyết áp vô căn (nguyên phát)', nameEn: 'Essential (primary) hypertension', chapter: 'Bệnh hệ tuần hoàn' },
  { code: 'E11', nameVi: 'Đái tháo đường không phụ thuộc insulin (Type 2)', nameEn: 'Type 2 diabetes mellitus', chapter: 'Bệnh nội tiết, dinh dưỡng và chuyển hóa' },
  { code: 'E11.9', nameVi: 'Đái tháo đường type 2 không có biến chứng', nameEn: 'Type 2 diabetes mellitus without complications', chapter: 'Bệnh nội tiết, dinh dưỡng và chuyển hóa' },
  { code: 'I25.1', nameVi: 'Bệnh tim do xơ vữa động mạch', nameEn: 'Atherosclerotic heart disease', chapter: 'Bệnh hệ tuần hoàn' },
  { code: 'J00', nameVi: 'Viêm mũi họng cấp tính (Cảm thường)', nameEn: 'Acute nasopharyngitis [common cold]', chapter: 'Bệnh hệ hô hấp' },
  { code: 'J02.9', nameVi: 'Viêm họng cấp, không đặc hiệu', nameEn: 'Acute pharyngitis, unspecified', chapter: 'Bệnh hệ hô hấp' },
  { code: 'J06.9', nameVi: 'Nhiễm trùng đường hô hấp trên cấp tính, không xác định', nameEn: 'Acute upper respiratory infection, unspecified', chapter: 'Bệnh hệ hô hấp' },
  { code: 'J20.9', nameVi: 'Viêm phế quản cấp, không đặc hiệu', nameEn: 'Acute bronchitis, unspecified', chapter: 'Bệnh hệ hô hấp' },
  { code: 'K21.0', nameVi: 'Bệnh trào ngược dạ dày - thực quản có viêm thực quản', nameEn: 'Gastro-esophageal reflux disease with oesophagitis', chapter: 'Bệnh hệ tiêu hóa' },
  { code: 'K29.7', nameVi: 'Viêm dạ dày, không đặc hiệu', nameEn: 'Gastritis, unspecified', chapter: 'Bệnh hệ tiêu hóa' },
  { code: 'K25.9', nameVi: 'Loét dạ dày, không xác định cấp hay mãn tính', nameEn: 'Gastric ulcer, unspecified', chapter: 'Bệnh hệ tiêu hóa' },
  { code: 'M54.5', nameVi: 'Đau vùng lưng dưới (Đau thắt lưng)', nameEn: 'Low back pain', chapter: 'Bệnh hệ cơ xương khớp và mô liên kết' },
  { code: 'M17.9', nameVi: 'Thoái hóa khớp gối, không xác định', nameEn: 'Gonarthrosis, unspecified', chapter: 'Bệnh hệ cơ xương khớp và mô liên kết' },
  { code: 'N39.0', nameVi: 'Nhiễm trùng đường tiết niệu, vị trí không xác định', nameEn: 'Urinary tract infection, site not specified', chapter: 'Bệnh hệ sinh dục - tiết niệu' },
  { code: 'R51', nameVi: 'Nhức đầu', nameEn: 'Headache', chapter: 'Triệu chứng, dấu hiệu và kết quả bất thường' },
  { code: 'G43.9', nameVi: 'Đau nửa đầu (Migraine), không đặc hiệu', nameEn: 'Migraine, unspecified', chapter: 'Bệnh hệ thần kinh' },
  { code: 'E78.0', nameVi: 'Tăng cholesterol máu thuần túy', nameEn: 'Pure hypercholesterolaemia', chapter: 'Bệnh nội tiết, dinh dưỡng và chuyển hóa' },
  { code: 'E78.2', nameVi: 'Tăng lipid máu hỗn hợp', nameEn: 'Mixed hyperlipidaemia', chapter: 'Bệnh nội tiết, dinh dưỡng và chuyển hóa' },
];

export const MOCK_MEDICINES: MedicineItem[] = [
  { id: 'MED-01', code: 'ASP100', name: 'Aspirin pH8', activeIngredient: 'Aspirin', strength: '100mg', unit: 'Viên', defaultDosage: '1 viên/ngày (sau ăn sáng)', defaultUsage: 'Kháng kết tập tiểu cầu' },
  { id: 'MED-02', code: 'WAR02', name: 'Sintrom (Warfarin)', activeIngredient: 'Warfarin', strength: '2mg', unit: 'Viên', defaultDosage: '1/2 - 1 viên/ngày (chiều tối)', defaultUsage: 'Chống đông máu' },
  { id: 'MED-03', code: 'CLO75', name: 'Plavix (Clopidogrel)', activeIngredient: 'Clopidogrel', strength: '75mg', unit: 'Viên', defaultDosage: '1 viên/ngày', defaultUsage: 'Phòng ngừa huyết khối' },
  { id: 'MED-04', code: 'OME20', name: 'Nexium (Omeprazole)', activeIngredient: 'Omeprazole', strength: '20mg', unit: 'Viên', defaultDosage: '1 viên/ngày trước ăn sáng 30p', defaultUsage: 'Ức chế bơm proton' },
  { id: 'MED-05', code: 'CIP500', name: 'Cifran (Ciprofloxacin)', activeIngredient: 'Ciprofloxacin', strength: '500mg', unit: 'Viên', defaultDosage: '1 viên x 2 lần/ngày', defaultUsage: 'Kháng sinh quinolone' },
  { id: 'MED-06', code: 'THE100', name: 'Theostat (Theophylline)', activeIngredient: 'Theophylline', strength: '100mg', unit: 'Viên', defaultDosage: '1 viên x 2 lần/ngày', defaultUsage: 'Giãn phế quản' },
  { id: 'MED-07', code: 'AML05', name: 'Amlor (Amlodipine)', activeIngredient: 'Amlodipine', strength: '5mg', unit: 'Viên', defaultDosage: '1 viên/ngày (sáng)', defaultUsage: 'Hạ huyết áp' },
  { id: 'MED-08', code: 'SIM20', name: 'Zocor (Simvastatin)', activeIngredient: 'Simvastatin', strength: '20mg', unit: 'Viên', defaultDosage: '1 viên/ngày (tối trước ngủ)', defaultUsage: 'Hạ mỡ máu' },
  { id: 'MED-09', code: 'PAR500', name: 'Panadol Extra', activeIngredient: 'Paracetamol', strength: '500mg', unit: 'Viên', defaultDosage: '1 viên khi sốt > 38.5°C hoặc đau', defaultUsage: 'Giảm đau hạ sốt' },
  { id: 'MED-10', code: 'AMX500', name: 'Amoxicillin STELLA', activeIngredient: 'Amoxicillin', strength: '500mg', unit: 'Viên', defaultDosage: '1 viên x 3 lần/ngày', defaultUsage: 'Kháng sinh Penicillin' },
  { id: 'MED-11', code: 'MET850', name: 'Glucophage (Metformin)', activeIngredient: 'Metformin', strength: '850mg', unit: 'Viên', defaultDosage: '1 viên x 2 lần/ngày cùng bữa ăn', defaultUsage: 'Hạ đường huyết' },
  { id: 'MED-12', code: 'LOS50', name: 'Cozaar (Losartan)', activeIngredient: 'Losartan potassium', strength: '50mg', unit: 'Viên', defaultDosage: '1 viên/ngày buổi sáng', defaultUsage: 'Hạ huyết áp' },
];

export const MOCK_DRUG_INTERACTIONS: DrugInteractionWarning[] = [
  {
    id: 'DDI-01',
    drugA: 'Aspirin',
    drugB: 'Warfarin',
    severity: 'CRITICAL',
    title: 'Nguy cơ xuất huyết nội tạng nghiêm trọng',
    mechanism: 'Cả hai thuốc đều làm suy giảm đông máu qua các cơ chế phối hợp (kháng đông + ức chế kết tập tiểu cầu).',
    clinicalEffect: 'Tăng vọt thời gian chảy máu, xuất huyết tiêu hóa ồ ạt, chảy máu nội sọ đe dọa tính mạng.',
    recommendation: 'Tránh dùng đồng thời trừ khi có chỉ định tim mạch đặc biệt (van cơ học). Cần theo dõi INR và phân tích đông máu nghiêm ngặt.'
  },
  {
    id: 'DDI-02',
    drugA: 'Clopidogrel',
    drugB: 'Omeprazole',
    severity: 'MAJOR',
    title: 'Giảm tác dụng kháng tiểu cầu của Clopidogrel',
    mechanism: 'Omeprazole ức chế mạnh isoenzyme CYP2C19 ở gan, ngăn cản chuyển hóa Clopidogrel thành dạng có hoạt tính sinh học.',
    clinicalEffect: 'Làm mất tác dụng bảo vệ tim mạch của Clopidogrel, tăng nguy cơ tái phát nhồi máu cơ tim hoặc đột quỵ.',
    recommendation: 'Cân nhắc chuyển sang thuốc ức chế bơm proton ít ảnh hưởng CYP2C19 như Pantoprazole hoặc Rabeprazole.'
  },
  {
    id: 'DDI-03',
    drugA: 'Ciprofloxacin',
    drugB: 'Theophylline',
    severity: 'MAJOR',
    title: 'Độc tính Theophylline do tăng nồng độ máu',
    mechanism: 'Ciprofloxacin ức chế chuyển hóa Theophylline qua enzym gan CYP1A2, làm giảm độ thanh thải Theophylline từ 30% đến 50%.',
    clinicalEffect: 'Nôn nao, nhịp nhanh xoang, rung thất, co giật và nguy cơ tử vong do ngộ độc Theophylline.',
    recommendation: 'Giảm 50% liều Theophylline và theo dõi nồng độ thuốc trong huyết tương, hoặc chọn kháng sinh khác (Levofloxacin ít ảnh hưởng hơn).'
  },
  {
    id: 'DDI-04',
    drugA: 'Amlodipine',
    drugB: 'Simvastatin',
    severity: 'MODERATE',
    title: 'Tăng nồng độ Simvastatin và nguy cơ tiêu cơ vân',
    mechanism: 'Amlodipine ức chế nhẹ CYP3A4 làm tăng nồng độ Simvastatin trong huyết thanh.',
    clinicalEffect: 'Đau mỏi cơ, tăng men CPK, nguy cơ tiêu cơ vân cấp (Rhabdomyolysis) dẫn đến suy thận cấp.',
    recommendation: 'Không dùng liều Simvastatin vượt quá 20mg/ngày khi dùng chung với Amlodipine, hoặc chuyển sang Atorvastatin/Rosuvastatin.'
  }
];

export const MOCK_AVAILABLE_SERVICES: ClinicalServiceOrder[] = [
  { id: 'SRV-01', serviceCode: 'ECG01', serviceName: 'Điện tâm đồ vi tính 12 chuyển đạo (ECG)', category: 'CẬN LÂM SÀNG', price: 100000, status: 'ORDERED' },
  { id: 'SRV-02', serviceCode: 'US01', serviceName: 'Siêu âm ổ bụng tổng quát màu Doppler', category: 'CHẨN ĐOÁN HÌNH ẢNH', price: 250000, status: 'ORDERED' },
  { id: 'SRV-03', serviceCode: 'CBC01', serviceName: 'Tổng phân tích tế bào máu ngoại vi (24 thông số)', category: 'XÉT NGHIỆM', price: 120000, status: 'ORDERED' },
  { id: 'SRV-04', serviceCode: 'GLU01', serviceName: 'Định lượng Glucose máu mao mạch/tĩnh mạch', category: 'XÉT NGHIỆM', price: 50000, status: 'ORDERED' },
  { id: 'SRV-05', serviceCode: 'XR01', serviceName: 'X-quang ngực thẳng kỹ thuật số (DR)', category: 'CHẨN ĐOÁN HÌNH ẢNH', price: 150000, status: 'ORDERED' },
  { id: 'SRV-06', serviceCode: 'LIP01', serviceName: 'Bộ mỡ máu toàn phần (Cholesterol, Triglyceride, HDL, LDL)', category: 'XÉT NGHIỆM', price: 200000, status: 'ORDERED' },
  { id: 'SRV-07', serviceCode: 'URN01', serviceName: 'Tổng phân tích nước tiểu 10 thông số', category: 'XÉT NGHIỆM', price: 60000, status: 'ORDERED' },
  { id: 'SRV-08', serviceCode: 'THY01', serviceName: 'Siêu âm tuyến giáp Doppler màu', category: 'CHẨN ĐOÁN HÌNH ẢNH', price: 200000, status: 'ORDERED' },
];

export const MOCK_VITAL_HISTORY: Record<string, VitalHistoryPoint[]> = {
  'PAT-2026-0001': [
    { date: '10/01/2026', systolic: 150, diastolic: 95, heartRate: 88, temperature: 36.6, bmi: 24.2, weight: 70 },
    { date: '25/01/2026', systolic: 142, diastolic: 90, heartRate: 84, temperature: 36.7, bmi: 23.9, weight: 69 },
    { date: '15/02/2026', systolic: 138, diastolic: 88, heartRate: 80, temperature: 36.8, bmi: 23.5, weight: 68 },
    { date: '02/03/2026', systolic: 135, diastolic: 85, heartRate: 78, temperature: 36.5, bmi: 23.5, weight: 68 },
    { date: '20/03/2026', systolic: 145, diastolic: 92, heartRate: 82, temperature: 36.8, bmi: 23.4, weight: 67.5 },
  ],
  'PAT-2026-0002': [
    { date: '05/11/2025', systolic: 120, diastolic: 80, heartRate: 74, temperature: 36.5, bmi: 21.3, weight: 52 },
    { date: '18/12/2025', systolic: 118, diastolic: 78, heartRate: 72, temperature: 36.6, bmi: 21.5, weight: 52.5 },
    { date: '14/01/2026', systolic: 122, diastolic: 82, heartRate: 76, temperature: 36.8, bmi: 21.5, weight: 52.5 },
    { date: '05/03/2026', systolic: 125, diastolic: 80, heartRate: 78, temperature: 37.0, bmi: 21.7, weight: 53 },
  ]
};

export const INITIAL_ACTIVE_RECORD: MedicalRecord = {
  id: 'EMR-2026-0012',
  visitId: 'VISIT-0012',
  patientId: 'PAT-2026-0001',
  patientName: 'Nguyễn Văn Hùng',
  patientDob: '15/05/1982',
  patientGender: 'MALE',
  patientCode: 'BN-2026-0891',
  ticketNumber: 'A-012',
  doctorId: 'DOC-01',
  doctorName: 'TS.BS Trần Minh Hoàng',
  department: 'Nội tổng quát',
  roomName: 'Phòng khám Nội 101',
  visitDate: '2026-10-05 08:30',
  chiefComplaint: 'Đau đầu âm ỉ vùng chẩm, chóng mặt nhẹ khi thay đổi tư thế, mệt mỏi về chiều.',
  clinicalSymptoms: 'Bệnh nhân có tiền sử tăng huyết áp 3 năm, dùng thuốc không đều đặn. Gần đây xuất hiện đau đầu vùng sau gáy, không buồn nôn, tim đập nhanh hồi hộp khi leo cầu thang. Không sốt, không ho, không đau ngực dữ dội.',
  allergies: ['Penicillin', 'Aspirin (gây phát ban và khó thở nhẹ)'],
  vitals: {
    temperature: 36.8,
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 95,
    heartRate: 82,
    respiratoryRate: 18,
    weight: 68,
    height: 170,
    bmi: 23.53,
    spo2: 98,
    measuredAt: '2026-10-05T08:15:00',
  },
  preliminaryDiagnosis: 'Theo dõi Tăng huyết áp độ 1 / Rối loạn lipid máu',
  diagnoses: [
    { code: 'I10', nameVi: 'Tăng huyết áp vô căn (nguyên phát)', isPrimary: true, chapter: 'Bệnh hệ tuần hoàn' },
    { code: 'E78.2', nameVi: 'Tăng lipid máu hỗn hợp', isPrimary: false, chapter: 'Bệnh nội tiết, dinh dưỡng và chuyển hóa' },
  ],
  services: [
    {
      id: 'SRV-REC-01',
      serviceCode: 'ECG01',
      serviceName: 'Điện tâm đồ vi tính 12 chuyển đạo (ECG)',
      category: 'CẬN LÂM SÀNG',
      price: 100000,
      status: 'COMPLETED',
      resultSummary: 'Nhịp xoang đều 80ck/p, trục trung gian. Dày thất trái nhẹ theo tiêu chuẩn Sokolow-Lyon.',
      completedAt: '08:45',
      performedBy: 'KTV. Lê Thu Hằng'
    },
    {
      id: 'SRV-REC-02',
      serviceCode: 'LIP01',
      serviceName: 'Bộ mỡ máu toàn phần (Cholesterol, Triglyceride, HDL, LDL)',
      category: 'XÉT NGHIỆM',
      price: 200000,
      status: 'COMPLETED',
      resultSummary: 'Cholesterol toàn phần: 6.2 mmol/L (Cao), Triglyceride: 2.8 mmol/L (Cao), LDL-C: 4.1 mmol/L (Cao), HDL-C: 1.0 mmol/L.',
      completedAt: '09:00',
      performedBy: 'ThS. Nguyễn Văn Bình'
    }
  ],
  prescriptions: [
    {
      id: 'RX-01',
      medicineId: 'MED-07',
      medicineCode: 'AML05',
      medicineName: 'Amlor (Amlodipine)',
      activeIngredient: 'Amlodipine',
      strength: '5mg',
      unit: 'Viên',
      dosage: '1 viên/ngày',
      durationDays: 30,
      totalQuantity: 30,
      instructions: 'Uống vào 8h sáng sau ăn. Theo dõi huyết áp tại nhà.'
    }
  ],
  doctorAdvice: 'Uống thuốc đều đặn vào mỗi buổi sáng, không tự ý ngưng thuốc. Giảm muối trong khẩu phần ăn (<5g/ngày), hạn chế thức ăn nhiều dầu mỡ mỡ động vật. Thể dục nhẹ nhàng 30 phút/ngày.',
  followUpDays: 30,
  isLocked: false,
  status: 'IN_PROGRESS',
  version: 1,
  amendments: [],
};
