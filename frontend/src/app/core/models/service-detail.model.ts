import { ClinicIconName } from '../../shared/components/clinic-icon/clinic-icon.component';

export interface ModernEquipment {
  name: string;
  manufacturer: string;
  origin: string; // e.g. "Hoa Kỳ - GE Healthcare", "Nhật Bản - Fujifilm"
  imageUrl: string;
  certifications: string[]; // e.g. ["FDA (Hoa Kỳ)", "CE Mark (Châu Âu)", "ISO 13485"]
  tagline: string;
  description: string;
  techSpecs: { label: string; value: string }[];
  patientBenefits: string[];
}

export interface ProcedureStep {
  stepNumber: number;
  title: string;
  duration: string;
  description: string;
  tips?: string;
}

export interface PreparationInstruction {
  title: string;
  icon: ClinicIconName;
  type: 'REQUIRED' | 'RECOMMENDED' | 'NOTE';
  details: string;
}

export interface AssignedDoctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  rating: number;
  availableDays: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceDetail {
  code: string;
  name: string;
  subtitle: string;
  category: 'KHÁM BỆNH' | 'CẬN LÂM SÀNG' | 'CHẨN ĐOÁN HÌNH ẢNH' | 'XÉT NGHIỆM';
  price: number;
  duration: string;
  room: string;
  icon: ClinicIconName;
  shortDescription: string;
  isPopular?: boolean;
  bannerImage: string;
  overviewHtml: string;
  clinicalIndications: string[];
  contraindications?: string[];
  equipment: ModernEquipment[];
  procedureSteps: ProcedureStep[];
  preparationInstructions: PreparationInstruction[];
  resultsTurnaroundTime: string;
  resultsFormat: string[];
  assignedDoctors: AssignedDoctor[];
  faqs: ServiceFaq[];
  qualityCommitments: { title: string; desc: string; icon: ClinicIconName }[];
}
