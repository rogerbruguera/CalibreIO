export interface Field {
  id: string;
  name: string;
  polygon?: string;
  parcel?: string;
  area?: number;
  row_width?: number;
  plantation_frame?: string;
  tree_type?: string;
  variety?: string;
  specific_variety?: string;
  rootstock?: string;
  planting_year?: number;
  irrigation_type?: string;
  user_id?: string;
  created_at?: string;
}

export interface SizeControl {
  id: string;
  field_id: string;
  user_id: string;
  date: string;
  formatted_date?: string;
  average_size: number;
  sample_size: number;
  notes?: string;
  measurements?: any;
  zone?: string;
  created_at?: string;
}
