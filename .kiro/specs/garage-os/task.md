# Garage OS Task List

Source: `.kiro/specs/garage-os/design.md`, `.kiro/specs/garage-os/requirements.md`

This task list is based on the Garage OS design. The current repository already contains an MVP using Hono, PostgreSQL, Drizzle ORM, Vite, React, Tailwind CSS, and shadcn-compatible UI components. The remaining work is organized by priority and product area.

## Status Legend

- `[x]` Implemented in the current MVP
- `[ ]` Not implemented or needs production hardening
- `P0` Required before expanding features
- `P1` Core garage workflow
- `P2` Scale, automation, and platform features
- `P3` Advanced or later-phase features

## Current Baseline

- [x] `P0` Backend is implemented with Hono.
- [x] `P0` Frontend is implemented with Vite and React.
- [x] `P0` Frontend styling uses Tailwind CSS and shadcn-compatible local UI components.
- [x] `P0` Database target is PostgreSQL.
- [x] `P0` ORM is Drizzle.
- [x] `P0` Multi-tenant tables and tenant-scoped access are present.
- [x] `P0` Basic JWT authentication and RBAC middleware are present.
- [x] `P1` Basic customers, vehicles, reservations, work orders, estimates, invoices, payments, parts, purchase orders, and KPI APIs are present.
- [x] `P1` Frontend screens are split by feature area.

## P0 Stabilization

- [x] Verify Drizzle schema, SQL schema, and seed data are fully aligned.
- [x] Add repeatable migration generation and migration execution commands.
- [x] Add PostgreSQL integration tests for tenant isolation.
- [x] Add PostgreSQL integration tests for row-level security policies.
- [x] Add API tests that verify tenant A cannot read or mutate tenant B resources.
- [ ] Add API tests for RBAC permissions by role: owner, manager, mechanic, receptionist, viewer.
- [ ] Remove or strictly guard any development-only tenant override behavior before production.
- [ ] Standardize API error response shape across all feature routes.
- [ ] Add request ID propagation and structured logging for all API requests.
- [ ] Add validation coverage for all create and update endpoints.
- [ ] Add frontend loading, empty, and error states for every split screen.
- [ ] Add frontend authentication persistence and logout behavior tests.
- [ ] Add CI commands for backend tests, backend build, frontend build, and linting.

## P1 Customer And Vehicle Management

- [ ] Add customer update and delete endpoints.
- [ ] Add vehicle update and delete endpoints.
- [ ] Add customer and vehicle search filters for phone number, plate number, VIN, model, and maker.
- [ ] Add vehicle mileage history.
- [ ] Add inspection history timeline per vehicle.
- [ ] Add reminder target extraction from vehicle inspection expiry dates.
- [ ] Add frontend customer detail view.
- [ ] Add frontend customer edit form.
- [ ] Add frontend vehicle detail and edit forms.
- [ ] Add duplicate detection for customers and vehicles.

## P1 Reservation Management

- [ ] Add available-slot calculation based on business hours, service type, mechanic capacity, and existing reservations.
- [ ] Add reservation reschedule endpoint.
- [ ] Add reservation cancellation endpoint with reason.
- [ ] Add reservation status transition history.
- [ ] Add calendar view with day, week, and month modes.
- [ ] Add mechanic workload view.
- [ ] Add service type management.
- [ ] Add business hours and holiday configuration.
- [ ] Add loaner vehicle CRUD.
- [ ] Add loaner vehicle availability checks.
- [ ] Add frontend reservation detail drawer or split pane.

## P1 Work Order Management

- [ ] Add work order detail endpoint with customer, vehicle, reservation, estimate, parts, media, checklist, and time entries.
- [ ] Add work order status history table and API.
- [ ] Add status transition validation.
- [ ] Add mechanic assignment and reassignment flow.
- [ ] Add checklist template CRUD.
- [ ] Add checklist execution records per work order.
- [ ] Add time entry start, pause, resume, and stop endpoints.
- [ ] Add work order note and internal comment support.
- [ ] Add frontend work order detail screen.
- [ ] Add frontend checklist execution UI.
- [ ] Add frontend time tracking controls.

## P1 Media And Inspection Records

- [ ] Add media upload abstraction for local development and S3 production.
- [ ] Add media metadata table with tenant, work order, vehicle, type, and uploader.
- [ ] Add image and video upload endpoints.
- [ ] Add media delete endpoint with authorization checks.
- [ ] Add media gallery for work orders.
- [ ] Add before/after photo grouping.
- [ ] Add inspection report generation from work order media and checklist results.

## P1 Estimates, Billing, And Payments

- [ ] Add editable estimate lines for labor, parts, discounts, and tax.
- [ ] Add estimate version history.
- [ ] Add estimate approval and rejection workflow.
- [ ] Add conversion from approved estimate to work order or invoice.
- [ ] Add invoice line item editing before finalization.
- [ ] Add invoice finalization and immutable invoice number assignment.
- [ ] Move payment records into a normalized payments table.
- [ ] Add partial payment support.
- [ ] Add payment method handling for cash, card, bank transfer, QR payment, and installment.
- [ ] Add payment gateway abstraction.
- [ ] Add PDF estimate and invoice output.
- [ ] Add frontend estimate editor.
- [ ] Add frontend invoice and payment screens.

## P1 Parts And Inventory

- [ ] Add supplier CRUD.
- [ ] Add part supplier mapping and supplier part number.
- [ ] Add part usage history by work order.
- [ ] Add stock reservation for scheduled work.
- [ ] Add stock consumption from work order completion.
- [ ] Add stock adjustment reason tracking.
- [ ] Add reorder rule configuration.
- [ ] Add purchase order approval flow.
- [ ] Add purchase order send, receive, and cancel states.
- [ ] Add low-stock notification events.
- [ ] Add frontend supplier and purchase order screens.

## P1 Notifications And Reminders

- [ ] Add notification preference table and API.
- [ ] Add notification history table and API.
- [ ] Add scheduled inspection reminder job.
- [ ] Add reservation confirmation notification.
- [ ] Add reservation reminder notification.
- [ ] Add estimate approval request notification.
- [ ] Add work completion notification.
- [ ] Add provider abstraction for email, SMS, LINE, and push notifications.
- [ ] Add duplicate prevention for scheduled notifications.
- [ ] Add frontend notification settings screen.

## P2 Analytics And Reporting

- [ ] Add KPI filtering by date range, tenant, mechanic, service type, and location.
- [ ] Add sales, gross profit, labor utilization, average repair time, repeat rate, and inspection renewal metrics.
- [ ] Add mechanic performance dashboard.
- [ ] Add inventory turnover report.
- [ ] Add customer retention report.
- [ ] Add estimate approval rate report.
- [ ] Add materialized views or aggregate tables for heavy reports.
- [ ] Add scheduled report generation.
- [ ] Add CSV, Excel, and PDF export.
- [ ] Add frontend report builder or report selection screen.

## P2 AI And Knowledge Features

- [ ] Replace mock AI estimate logic with a provider adapter.
- [ ] Add AI estimate input normalization from vehicle, symptoms, photos, and history.
- [ ] Add AI estimate confidence and explanation fields.
- [ ] Add failure prediction model integration.
- [ ] Add maintenance recommendation output from vehicle history.
- [ ] Add RAG knowledge base ingestion pipeline.
- [ ] Add semantic search API for manuals, procedures, and historical cases.
- [ ] Add photo analysis API for damage, wear, and part identification.
- [ ] Add human review workflow for AI suggestions.
- [ ] Add AI usage logging and tenant-level cost tracking.

## P2 Multi-Tenant Platform

- [ ] Add tenant settings for name, logo, locale, timezone, currency, tax rules, and business hours.
- [ ] Add tenant invitation flow.
- [ ] Add tenant member management UI.
- [ ] Add role assignment UI.
- [ ] Add audit log viewer.
- [ ] Add subscription plan table.
- [ ] Add plan limits for users, vehicles, storage, AI usage, and API calls.
- [ ] Add billing integration for tenant subscriptions.
- [ ] Add tenant-level feature flags.
- [ ] Add public API key management.
- [ ] Add public API rate limiting.
- [ ] Add public API audit logs.

## P2 Security, Reliability, And Operations

- [ ] Add password reset flow.
- [ ] Add email verification flow.
- [ ] Add MFA support.
- [ ] Add session revocation.
- [ ] Add audit logging for sensitive operations.
- [ ] Add database backup automation.
- [ ] Add restore procedure documentation.
- [ ] Add uptime and health check endpoints.
- [ ] Add application metrics and dashboards.
- [ ] Add alerting for errors, latency, queue failures, and storage failures.
- [ ] Add disaster recovery runbook.
- [ ] Add cost monitoring and budget alerts.

## P2 Infrastructure

- [ ] Define AWS infrastructure target architecture: ECS or Lambda, RDS PostgreSQL, S3, CloudFront, Cognito, CloudWatch.
- [ ] Add infrastructure as code.
- [ ] Add environment separation for local, staging, and production.
- [ ] Add secret management strategy.
- [ ] Add object storage bucket policies for media.
- [ ] Add CDN configuration for media delivery.
- [ ] Add production database migration workflow.
- [ ] Add blue-green or rolling deployment strategy.

## P3 Customer Portal

- [ ] Add customer-facing authentication.
- [ ] Add customer portal reservation request flow.
- [ ] Add customer vehicle list.
- [ ] Add customer work status tracking.
- [ ] Add customer estimate approval screen.
- [ ] Add customer invoice and payment history.
- [ ] Add customer notification preference screen.
- [ ] Add customer document download.

## P3 Mobile App And Offline Support

- [ ] Define mobile app technology choice.
- [ ] Add mobile mechanic work order list.
- [ ] Add mobile checklist execution.
- [ ] Add mobile photo and video upload.
- [ ] Add barcode or QR code scanning for parts.
- [ ] Add offline data cache.
- [ ] Add offline mutation queue.
- [ ] Add conflict resolution strategy.
- [ ] Add sync status UI.

## P3 Voice Input

- [ ] Add speech-to-text provider adapter.
- [ ] Add voice input endpoint for work notes.
- [ ] Add structured extraction from dictated work notes.
- [ ] Add review and correction UI.
- [ ] Add voice input support in mobile work order screens.

## Recommended Next Tasks

1. `P0` Add PostgreSQL integration tests for tenant isolation and RBAC.
2. `P0` Align Drizzle schema, raw SQL schema, seed data, and migration workflow.
3. `P1` Implement customer and vehicle update/detail flows.
4. `P1` Implement reservation available-slot calculation and calendar views.
5. `P1` Implement work order detail, status history, checklist, and time tracking.
6. `P1` Implement media upload abstraction and work order media gallery.
7. `P1` Implement suppliers and purchase order receiving flow.
8. `P1` Implement notification preferences and scheduled inspection reminders.
9. `P2` Add KPI filters and reporting aggregates.
10. `P2` Add payment gateway abstraction and normalized payment records.

## Acceptance Criteria For The Next Implementation Batch

- Backend tests cover tenant isolation, RBAC, and validation failures.
- Frontend screens have loading, empty, error, and success states.
- Every new API endpoint is tenant-scoped and validates request bodies.
- Every mutation that changes operational state writes an audit or history record where required by the design.
- The application builds successfully for both backend and frontend.
- Documentation is updated when new setup steps, environment variables, or operational behavior are introduced.
