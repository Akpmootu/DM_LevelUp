export interface OfficialHistory {
  id?: string;
  timestamp: number;
  date: string;
  salary: number;
  movement: string; 
  positionAndDept: string;
  positionNumber: string;
  type: string;
  level: string;
  referenceDoc: string;
}

export interface TrainingHistory {
  id?: string;
  timestamp: number;
  year: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  courseName: string;
  organizer: string;
}

export interface WorkExperience {
  id?: string;
  timestamp: number;
  role: string;
  department: string;
  duration: string;
}

export interface UserProfile {
  id?: string;
  avatarUrl?: string;
  username?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  englishName?: string;
  nickname?: string;
  birthDate?: string;
  idCard?: string;
  maritalStatus?: string;
  religion?: string;
  ethnicity?: string;
  nationality?: string;
  gender?: string;
  bloodType?: string;
  height?: string;
  weight?: string;
  phone?: string;
  email?: string;
  facebook?: string;

  // Career
  jobGroup?: string;
  jobSubGroup?: string;
  department?: string;
  startDate?: string;
  appointDate?: string;
  licenseNumber?: string;
  licenseDate?: string;
  position?: string;
  positionNumber?: string;
  level?: string;
  currentStatus?: string;
  govType?: string;
  govSubType?: string;
  personnelGroup?: string;
  affiliation?: string;
  salary?: string;
  positionSalary?: string;

  // Current Address
  c_houseNumber?: string;
  c_village?: string;
  c_road?: string;
  c_soi?: string;
  c_subdistrict?: string;
  c_district?: string;
  c_province?: string;
  c_zip?: string;

  // Registered Address
  sameAsCurrentAddress?: boolean;
  r_houseNumber?: string;
  r_village?: string;
  r_road?: string;
  r_soi?: string;
  r_subdistrict?: string;
  r_district?: string;
  r_province?: string;
  r_zip?: string;

  // Bank Info
  salaryBankName?: string;
  salaryBankAccount?: string;
  salaryAccountName?: string;
  salaryBankBranch?: string;
  otBankName?: string;
  otBankAccount?: string;
  otAccountName?: string;
  otBankBranch?: string;
}

