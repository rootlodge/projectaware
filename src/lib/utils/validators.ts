import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Invalid email address");

// Name validation
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(255, "Name must be less than 255 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes");

// Slug validation (for tenants)
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be less than 50 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
  .regex(/^[a-z]/, "Slug must start with a letter")
  .regex(/[a-z0-9]$/, "Slug must end with a letter or number");

// Tenant name validation
export const tenantNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

// Feedback message validation
export const feedbackMessageSchema = z
  .string()
  .min(10, "Message must be at least 10 characters")
  .max(5000, "Message must be less than 5000 characters");

// Rating validation (1-5 stars)
export const ratingSchema = z
  .number()
  .int("Rating must be a whole number")
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5");

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// URL validation
export const urlSchema = z.string().url("Invalid URL format");
