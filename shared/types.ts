// Shared types between client and server

export type UserRole = "RETAILER_LT" | "VENDOR_USER" | "VENDOR";
export type PortalType = "FULL" | "PORTAL";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vendorId?: string | null;
  vendorName?: string | null;
  portalType?: PortalType | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type EconomicModel = "MARKETPLACE" | "WHOLESALE";
export type VendorLocation = "DOMESTIC_US" | "INTERNATIONAL";
export type IntegrationType = "SHOPIFY" | "API" | "MAGENTO" | "CSV";
export type ShippingModel = "DTC_A" | "DTC_B" | "B2B_A" | "B2B_B";
export type Currency = "USD" | "EUR" | "GBP" | "CHF" | "SEK" | "DKK" | "NOK" | "CAD" | "AUD";
export type PayoutCycle = "NEXT_DAY" | "NET_14" | "NET_30";

export type ProductStatus =
  | "PENDING_REVIEW" | "APPROVED" | "QUALIFIED" | "NEEDS_REVIEW"
  | "PUSHED" | "REJECTED" | "ARCHIVED" | "DELETED_BY_VENDOR";

export type OrderStatus =
  | "PLACED" | "SPLIT" | "VENDOR_ACCEPT" | "FRAUD_HOLD" | "VENDOR_REJECTED"
  | "GENERATE_LABEL" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "SETTLED"
  | "CANCELLED" | "RETURN_INITIATED" | "RETURN_RECEIVED" | "RETURN_COMPLETED";

export type ShipmentStatus =
  | "LABEL_CREATED" | "LABEL_VOIDED" | "PICKED_UP" | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION" | "RETURNED";

export type ReturnStatus =
  | "INITIATED" | "LABEL_GENERATED" | "IN_TRANSIT" | "RECEIVED_WAREHOUSE"
  | "INSPECTING" | "APPROVED" | "REJECTED" | "REFUNDED" | "FORWARDED_TO_VENDOR" | "COMPLETED";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "ON_HOLD";

export type SettlementStatus =
  | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  | "PARTIALLY_PAID" | "DISPUTED" | "CANCELLED";

export type MessageDepartment = "OPS" | "RMS" | "CX" | "CATALOG_BUYER" | "VENDOR_SUPPORT";
export type MessagePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type MessageStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

export type PricingStrategy =
  | "PREMIUM_POSITIONING" | "COMPETITIVE_PRICING" | "DYNAMIC_PRICING"
  | "CLEARANCE_PRICING" | "EVENT_PRICING";

export type Carrier = "FEDEX" | "DHL" | "UPS";

export type OnboardingStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

// Dashboard KPIs
export interface DashboardKPIs {
  totalOrders: number;
  totalProducts: number;
  totalVendors: number;
  activeVendors: number;
  totalRevenue: number;
  totalCommissions: number;
  totalShipments: number;
  totalReturns: number;
  pendingReview: number;
  actionRequired: {
    fraudHold: number;
    pendingAcceptance: number;
    pendingShipment: number;
    inTransit: number;
    exceptions: number;
    openMessages: number;
    pendingPayouts: number;
  };
}
