/**
 * Zod Validation Schemas
 * ======================
 * Phase 1 Security Foundation
 * 
 * Centralized request body validation for all API endpoints.
 * Using Zod v4 for type-safe runtime validation.
 */

import { z } from "zod";
import type { FastifyRequest, FastifyReply } from "fastify";

// ============================================================
// Auth Schemas
// ============================================================

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ============================================================
// Vendor Schemas
// ============================================================

export const CreateVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  economicModel: z.enum(["MARKETPLACE", "WHOLESALE"]),
  location: z.enum(["DOMESTIC_US", "INTERNATIONAL"]),
  country: z.string().min(2).max(3).default("US"),
  city: z.string().max(100).optional(),
  integrationType: z.enum(["SHOPIFY", "API", "MAGENTO", "CSV"]),
  brandStructure: z.enum(["UNI_BRAND", "MULTI_BRAND"]),
  currency: z.enum(["USD", "EUR", "GBP", "CHF", "SEK", "DKK", "NOK", "CAD", "AUD"]).default("USD"),
  shippingModel: z.enum(["DTC_A", "DTC_B", "B2B_A", "B2B_B"]),
  commissionRate: z.number().min(0).max(100).optional(),
  payoutCycle: z.enum(["NEXT_DAY", "NET_14", "NET_30"]).default("NET_30"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  taxId: z.string().max(50).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

// ============================================================
// Product Schemas
// ============================================================

export const CreateProductSchema = z.object({
  vendorId: z.string().cuid("Invalid vendor ID"),
  title: z.string().min(1, "Product title is required").max(500),
  description: z.string().max(10000).optional(),
  bodyHtml: z.string().max(50000).optional(),
  productType: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  subcategory: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  compareAtPrice: z.number().min(0).optional(),
  salesPrice: z.number().min(0).optional(),
  retailerCost: z.number().min(0).optional(),
  vendorCost: z.number().min(0).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CHF", "SEK", "DKK", "NOK", "CAD", "AUD"]).default("USD"),
  hsCode: z.string().max(20).optional(),
  countryOfOrigin: z.string().max(3).optional(),
  shipsFrom: z.string().max(100).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({ vendorId: true });

export const UpdateProductStatusSchema = z.object({
  status: z.enum([
    "PENDING_REVIEW",
    "APPROVED",
    "QUALIFIED",
    "NEEDS_REVIEW",
    "PUSHED",
    "REJECTED",
    "ARCHIVED",
    "DELETED_BY_VENDOR",
  ]),
});

// ============================================================
// Order Schemas
// ============================================================

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "PLACED",
    "SPLIT",
    "VENDOR_ACCEPT",
    "FRAUD_HOLD",
    "VENDOR_REJECTED",
    "GENERATE_LABEL",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "SETTLED",
    "CANCELLED",
    "RETURN_INITIATED",
    "RETURN_RECEIVED",
    "RETURN_COMPLETED",
  ]),
  notes: z.string().max(2000).optional(),
});

// ============================================================
// Shipment Schemas
// ============================================================

export const CreateShipmentSchema = z.object({
  subOrderId: z.string().cuid("Invalid sub-order ID"),
  vendorId: z.string().cuid("Invalid vendor ID"),
  shippingModel: z.enum(["DTC_A", "DTC_B", "B2B_A", "B2B_B"]),
  carrier: z.enum(["FEDEX", "DHL", "UPS"]).optional(),
  leg: z.enum(["LEG_1", "LEG_2", "DIRECT"]).default("DIRECT"),
  serviceType: z.string().max(100).optional(),
  weight: z.number().min(0).optional(),
  weightUnit: z.string().max(10).default("kg"),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  dimensionUnit: z.string().max(10).default("cm"),
});

// ============================================================
// Return Schemas
// ============================================================

export const CreateReturnSchema = z.object({
  subOrderId: z.string().cuid("Invalid sub-order ID"),
  vendorId: z.string().cuid("Invalid vendor ID"),
  reason: z.string().min(1, "Return reason is required").max(2000),
  customerNotes: z.string().max(5000).optional(),
});

export const UpdateReturnStatusSchema = z.object({
  status: z.enum([
    "INITIATED",
    "LABEL_GENERATED",
    "IN_TRANSIT",
    "RECEIVED_WAREHOUSE",
    "INSPECTING",
    "APPROVED",
    "REJECTED",
    "REFUNDED",
    "FORWARDED_TO_VENDOR",
    "COMPLETED",
  ]),
  inspectionNotes: z.string().max(5000).optional(),
  refundAmount: z.number().min(0).optional(),
});

// ============================================================
// Message Schemas
// ============================================================

export const CreateMessageThreadSchema = z.object({
  vendorId: z.string().cuid("Invalid vendor ID"),
  subject: z.string().min(1, "Subject is required").max(500),
  department: z.enum(["OPS", "RMS", "CX", "CATALOG_BUYER", "VENDOR_SUPPORT"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().max(100).optional(),
  message: z.string().min(1, "Message content is required").max(10000),
});

export const CreateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000),
  isInternal: z.boolean().default(false),
});

// ============================================================
// Finance Schemas
// ============================================================

export const CreatePayoutSchema = z.object({
  vendorId: z.string().cuid("Invalid vendor ID"),
  amount: z.number().min(0.01, "Amount must be positive"),
  currency: z.enum(["USD", "EUR", "GBP", "CHF", "SEK", "DKK", "NOK", "CAD", "AUD"]),
  payoutCycle: z.enum(["NEXT_DAY", "NET_14", "NET_30"]),
  notes: z.string().max(2000).optional(),
});

// ============================================================
// Query Parameter Schemas
// ============================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const VendorFilterSchema = PaginationSchema.extend({
  economicModel: z.enum(["MARKETPLACE", "WHOLESALE"]).optional(),
  location: z.enum(["DOMESTIC_US", "INTERNATIONAL"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const ProductFilterSchema = PaginationSchema.extend({
  vendorId: z.string().optional(),
  status: z.enum([
    "PENDING_REVIEW", "APPROVED", "QUALIFIED", "NEEDS_REVIEW",
    "PUSHED", "REJECTED", "ARCHIVED", "DELETED_BY_VENDOR",
  ]).optional(),
  category: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
});

export const OrderFilterSchema = PaginationSchema.extend({
  vendorId: z.string().optional(),
  status: z.enum([
    "PLACED", "SPLIT", "VENDOR_ACCEPT", "FRAUD_HOLD", "VENDOR_REJECTED",
    "GENERATE_LABEL", "SHIPPED", "IN_TRANSIT", "DELIVERED", "SETTLED",
    "CANCELLED", "RETURN_INITIATED", "RETURN_RECEIVED", "RETURN_COMPLETED",
  ]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================================
// Validation Helper
// ============================================================

/**
 * Validates request body against a Zod schema.
 * Returns parsed data on success, or sends 400 error on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: "Validation Error",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    // Attach parsed/validated body
    (request as any).validatedBody = result.data;
  };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        error: "Validation Error",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    (request as any).validatedQuery = result.data;
  };
}

