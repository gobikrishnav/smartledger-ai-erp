export interface User {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'Business_Owner' | 'Warehouse_Manager' | 'Cashier';
  branch_id: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Product {
  product_id: string;
  sku_code: string;
  barcode: string;
  product_name: string;
  category_id: string;
  base_price: number;
  cost_price: number;
  tax_rate_pct: number;
  reorder_level: number;
  stock_quantity: number;
  is_low_stock: boolean;
  expiry_date: string | null;
  batch_number: string;
  supplier_name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  cgst_amount: number;
  sgst_amount: number;
  line_total: number;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  discount_amount: number;
  grand_total: number;
  payment_status: 'PAID' | 'PENDING' | 'VOID';
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'SPLIT';
  customer_name?: string;
  cashier_name?: string;
  items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cgst_amount: number;
  sgst_amount: number;
  line_total: number;
}

export interface FraudAuditLog {
  audit_id: string;
  invoice_id: string;
  invoice_number: string;
  risk_score: number;
  anomaly_detected: boolean;
  feature_vector_json: number[];
  flag_level: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  review_status: 'PENDING' | 'OVERRIDDEN' | 'CONFIRMED';
  review_notes: string | null;
  created_at: string;
  grand_total: number;
}

export interface ExecutiveSummary {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_tax_collected: number;
  invoice_count: number;
  avg_invoice_value: number;
  cashflow_runway: number;
}

export interface FraudAlert {
  type: 'FRAUD_ALERT';
  audit_id: string;
  invoice_id: string;
  invoice_number: string;
  risk_score: number;
  flag_level: string;
  grand_total: number;
  timestamp: string;
}
