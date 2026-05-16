# Requirements Document

## Introduction

整備工場OS（Garage OS）は、整備工場向けの業務統合SaaSシステムです。予約管理、入庫管理、見積作成、作業進捗、部品管理、顧客管理、請求管理を一元化し、「職人依存」「電話/FAX中心運営」「紙・Excel管理」を削減します。

本システムは、街の整備工場、車検工場、板金工場、中古車販売併設工場、EV整備工場を対象とし、3〜50名程度の規模の工場を想定しています。

## Glossary

- **Garage_OS**: 整備工場向け業務統合SaaSシステム
- **Customer**: 整備工場の顧客（車両所有者）
- **Vehicle**: 顧客が所有する車両
- **Mechanic**: 整備士
- **Service_Advisor**: フロント担当者（受付・顧客対応）
- **Administrator**: システム管理者
- **Manager**: 経営者・管理職
- **Reservation**: 整備・車検の予約
- **Work_Order**: 作業指示書
- **Estimate**: 見積書
- **Invoice**: 請求書
- **Part**: 部品
- **Inventory**: 在庫
- **Work_Status**: 作業ステータス（予約済み、入庫、作業中、完了、引渡し済み）
- **AI_Estimator**: AI見積機能
- **KPI_Dashboard**: 経営指標ダッシュボード
- **Web_Booking**: Web予約システム
- **Reminder**: リマインド通知（車検期限、点検時期など）
- **Inspection_History**: 整備履歴
- **Loaner_Vehicle**: 代車
- **Payment_Gateway**: 決済ゲートウェイ
- **RAG_System**: 検索拡張生成システム（整備ナレッジ検索用）
- **Photo_Analysis_AI**: 写真解析AI
- **Voice_Input**: 音声入力機能

## Requirements

### Requirement 1: 顧客情報管理

**User Story:** As a Service_Advisor, I want to manage customer information, so that I can track customer details and vehicle ownership.

#### Acceptance Criteria

1. THE Garage_OS SHALL store Customer information including name, contact details, address, and email
2. THE Garage_OS SHALL associate one or more Vehicles with each Customer
3. WHEN a Customer record is created, THE Garage_OS SHALL assign a unique customer identifier
4. THE Garage_OS SHALL allow Service_Advisor to search Customers by name, phone number, or vehicle registration number
5. THE Garage_OS SHALL display all Vehicles associated with a Customer when viewing the Customer record

### Requirement 2: 車両情報管理

**User Story:** As a Service_Advisor, I want to manage vehicle information, so that I can track vehicle specifications and maintenance history.

#### Acceptance Criteria

1. THE Garage_OS SHALL store Vehicle information including make, model, year, registration number, VIN, and mileage
2. THE Garage_OS SHALL store vehicle inspection expiration date and insurance expiration date for each Vehicle
3. WHEN a Vehicle record is created, THE Garage_OS SHALL assign a unique vehicle identifier
4. THE Garage_OS SHALL allow Service_Advisor to update Vehicle mileage
5. THE Garage_OS SHALL display Inspection_History for each Vehicle

### Requirement 3: 車検期限リマインド

**User Story:** As a Service_Advisor, I want to send automatic reminders for vehicle inspection expiration, so that customers return for inspection services.

#### Acceptance Criteria

1. WHEN a Vehicle inspection expiration date is within 60 days, THE Garage_OS SHALL generate a Reminder
2. THE Garage_OS SHALL send Reminder notifications via email or SMS to the Customer
3. THE Garage_OS SHALL allow Administrator to configure Reminder timing (30 days, 60 days, 90 days before expiration)
4. THE Garage_OS SHALL record when a Reminder was sent to prevent duplicate notifications
5. WHERE LINE integration is enabled, THE Garage_OS SHALL send Reminder via LINE message

### Requirement 4: Web予約受付

**User Story:** As a Customer, I want to book service appointments online, so that I can schedule service without calling during business hours.

#### Acceptance Criteria

1. THE Web_Booking SHALL display available appointment slots based on Mechanic availability
2. WHEN a Customer selects an appointment slot, THE Web_Booking SHALL create a Reservation
3. THE Web_Booking SHALL allow Customer to specify service type (inspection, repair, maintenance)
4. WHEN a Reservation is created, THE Garage_OS SHALL send confirmation notification to the Customer
5. THE Web_Booking SHALL prevent double-booking of appointment slots
6. WHERE Loaner_Vehicle is requested, THE Web_Booking SHALL check Loaner_Vehicle availability

### Requirement 5: 予約カレンダー管理

**User Story:** As a Service_Advisor, I want to manage appointments on a calendar, so that I can visualize daily workload and mechanic assignments.

#### Acceptance Criteria

1. THE Garage_OS SHALL display Reservations on a calendar view by day, week, and month
2. THE Garage_OS SHALL allow Service_Advisor to assign a Mechanic to each Reservation
3. THE Garage_OS SHALL allow Service_Advisor to drag and drop Reservations to reschedule
4. THE Garage_OS SHALL display Mechanic workload for each day
5. WHEN a Reservation is rescheduled, THE Garage_OS SHALL send notification to the Customer

### Requirement 6: 整備士アサイン管理

**User Story:** As a Service_Advisor, I want to assign mechanics to work orders, so that I can balance workload and track mechanic utilization.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Service_Advisor to assign one or more Mechanics to a Work_Order
2. THE Garage_OS SHALL display current workload for each Mechanic
3. THE Garage_OS SHALL calculate estimated completion time based on assigned work hours
4. WHEN a Mechanic is assigned to a Work_Order, THE Garage_OS SHALL update the Mechanic workload
5. THE Garage_OS SHALL allow Service_Advisor to reassign Mechanics to different Work_Orders

### Requirement 7: 代車予約管理

**User Story:** As a Service_Advisor, I want to manage loaner vehicle reservations, so that customers can use loaner vehicles during service.

#### Acceptance Criteria

1. THE Garage_OS SHALL maintain a list of available Loaner_Vehicles
2. WHEN a Customer requests a Loaner_Vehicle, THE Garage_OS SHALL check availability for the requested dates
3. THE Garage_OS SHALL allow Service_Advisor to assign a Loaner_Vehicle to a Reservation
4. THE Garage_OS SHALL track Loaner_Vehicle status (available, reserved, in use, maintenance)
5. WHEN a Loaner_Vehicle is returned, THE Garage_OS SHALL update the Loaner_Vehicle status to available

### Requirement 8: AI見積生成

**User Story:** As a Service_Advisor, I want to generate estimates using AI, so that I can quickly provide accurate estimates without deep technical knowledge.

#### Acceptance Criteria

1. WHEN a Service_Advisor inputs vehicle make, model, year, mileage, symptoms, and error codes, THE AI_Estimator SHALL generate repair candidates
2. THE AI_Estimator SHALL estimate labor hours for each repair candidate
3. THE AI_Estimator SHALL suggest required Parts for each repair candidate
4. THE AI_Estimator SHALL calculate estimated total cost including labor and parts
5. THE AI_Estimator SHALL provide confidence level for each repair candidate
6. THE Garage_OS SHALL allow Service_Advisor to edit AI-generated Estimates before sending to Customer

### Requirement 9: 見積書作成

**User Story:** As a Service_Advisor, I want to create estimates, so that I can provide cost breakdown to customers.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Service_Advisor to create an Estimate for a Work_Order
2. THE Estimate SHALL include line items for labor, parts, and other charges
3. THE Garage_OS SHALL calculate subtotal, tax, and total amount for the Estimate
4. THE Garage_OS SHALL allow Service_Advisor to apply discounts to the Estimate
5. WHEN an Estimate is finalized, THE Garage_OS SHALL send the Estimate to the Customer via email or print
6. THE Garage_OS SHALL store Estimate history for each Work_Order

### Requirement 10: 作業ステータス管理

**User Story:** As a Mechanic, I want to update work status, so that the service advisor and customer can track progress.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Mechanic to update Work_Status (予約済み, 入庫, 作業中, 完了, 引渡し済み)
2. WHEN Work_Status is updated, THE Garage_OS SHALL record timestamp and Mechanic identifier
3. THE Garage_OS SHALL allow Service_Advisor to view current Work_Status for all Work_Orders
4. WHERE customer notification is enabled, THE Garage_OS SHALL send notification when Work_Status changes to 完了
5. THE Garage_OS SHALL display Work_Status history for each Work_Order

### Requirement 11: 作業写真・動画添付

**User Story:** As a Mechanic, I want to attach photos and videos to work orders, so that I can document work performed and communicate issues to customers.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Mechanic to upload photos to a Work_Order
2. THE Garage_OS SHALL allow Mechanic to upload videos to a Work_Order
3. THE Garage_OS SHALL store uploaded photos and videos in cloud storage
4. THE Garage_OS SHALL allow Mechanic to add captions to photos and videos
5. THE Garage_OS SHALL allow Service_Advisor to share selected photos and videos with the Customer
6. THE Garage_OS SHALL compress photos and videos to reduce storage costs while maintaining acceptable quality

### Requirement 12: 作業チェックリスト

**User Story:** As a Mechanic, I want to follow checklists during work, so that I can ensure all required steps are completed.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Administrator to create checklists for different service types
2. THE Garage_OS SHALL display the appropriate checklist when a Mechanic starts a Work_Order
3. THE Garage_OS SHALL allow Mechanic to mark checklist items as completed
4. THE Garage_OS SHALL record timestamp when each checklist item is completed
5. WHEN all checklist items are completed, THE Garage_OS SHALL allow Mechanic to mark the Work_Order as completed

### Requirement 13: 作業時間記録

**User Story:** As a Mechanic, I want to record actual work time, so that the system can track labor costs and improve future estimates.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Mechanic to start a timer when beginning work on a Work_Order
2. THE Garage_OS SHALL allow Mechanic to pause and resume the timer
3. WHEN work is completed, THE Garage_OS SHALL record total elapsed time
4. THE Garage_OS SHALL compare actual work time with estimated work time
5. THE Garage_OS SHALL use historical work time data to improve future labor estimates

### Requirement 14: 部品在庫管理

**User Story:** As a Mechanic, I want to check parts inventory, so that I can confirm parts availability before starting work.

#### Acceptance Criteria

1. THE Garage_OS SHALL maintain an Inventory of Parts with quantity on hand
2. THE Garage_OS SHALL allow Mechanic to search Parts by part number, name, or vehicle compatibility
3. WHEN a Part is used in a Work_Order, THE Garage_OS SHALL decrement the Inventory quantity
4. WHEN Inventory quantity falls below minimum threshold, THE Garage_OS SHALL generate a reorder alert
5. THE Garage_OS SHALL display Parts usage history for each Part

### Requirement 15: 部品発注管理

**User Story:** As a Service_Advisor, I want to order parts from suppliers, so that I can replenish inventory and obtain parts for specific jobs.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Service_Advisor to create purchase orders for Parts
2. THE Garage_OS SHALL maintain a list of suppliers with contact information
3. THE Garage_OS SHALL allow Service_Advisor to send purchase orders to suppliers via email
4. WHEN a purchase order is created, THE Garage_OS SHALL record expected delivery date
5. WHEN Parts are received, THE Garage_OS SHALL allow Service_Advisor to update Inventory quantities

### Requirement 16: 請求書生成

**User Story:** As a Service_Advisor, I want to convert estimates to invoices, so that I can bill customers for completed work.

#### Acceptance Criteria

1. WHEN a Work_Order is completed, THE Garage_OS SHALL allow Service_Advisor to convert the Estimate to an Invoice
2. THE Invoice SHALL include all line items from the Estimate plus any additional charges
3. THE Garage_OS SHALL calculate subtotal, tax, and total amount for the Invoice
4. THE Garage_OS SHALL generate a unique invoice number for each Invoice
5. THE Garage_OS SHALL allow Service_Advisor to send the Invoice to the Customer via email or print

### Requirement 17: 決済処理

**User Story:** As a Service_Advisor, I want to process payments, so that customers can pay using multiple payment methods.

#### Acceptance Criteria

1. THE Garage_OS SHALL integrate with Payment_Gateway to process credit card payments
2. THE Garage_OS SHALL generate QR codes for QR payment methods
3. WHEN a payment is processed, THE Garage_OS SHALL record payment method, amount, and timestamp
4. THE Garage_OS SHALL allow partial payments and track remaining balance
5. WHEN full payment is received, THE Garage_OS SHALL mark the Invoice as paid
6. WHERE installment payment is enabled, THE Garage_OS SHALL create a payment schedule

### Requirement 18: KPIダッシュボード

**User Story:** As a Manager, I want to view business metrics, so that I can monitor business performance and make data-driven decisions.

#### Acceptance Criteria

1. THE KPI_Dashboard SHALL display total revenue for selected time period
2. THE KPI_Dashboard SHALL calculate and display profit margin
3. THE KPI_Dashboard SHALL calculate and display mechanic utilization rate
4. THE KPI_Dashboard SHALL display revenue by Mechanic
5. THE KPI_Dashboard SHALL calculate and display customer return rate
6. THE KPI_Dashboard SHALL display average invoice amount
7. THE KPI_Dashboard SHALL calculate and display vehicle inspection renewal rate
8. THE KPI_Dashboard SHALL allow Manager to filter metrics by date range

### Requirement 19: 整備履歴管理

**User Story:** As a Service_Advisor, I want to view vehicle service history, so that I can understand past work and recommend future maintenance.

#### Acceptance Criteria

1. THE Garage_OS SHALL record all completed Work_Orders in the Inspection_History for each Vehicle
2. THE Inspection_History SHALL include service date, service type, parts replaced, and total cost
3. THE Garage_OS SHALL allow Service_Advisor to view Inspection_History sorted by date
4. THE Garage_OS SHALL allow Service_Advisor to search Inspection_History by service type or part name
5. THE Garage_OS SHALL display recommended maintenance based on Inspection_History and vehicle mileage

### Requirement 20: 故障推定AI

**User Story:** As a Service_Advisor, I want AI to suggest likely failures based on symptoms, so that I can provide faster diagnosis without deep technical expertise.

#### Acceptance Criteria

1. WHEN a Service_Advisor inputs symptoms and error codes, THE Garage_OS SHALL query the AI model for failure candidates
2. THE Garage_OS SHALL display failure candidates ranked by probability
3. THE Garage_OS SHALL provide explanation for each failure candidate
4. THE Garage_OS SHALL suggest diagnostic steps for each failure candidate
5. THE Garage_OS SHALL learn from confirmed diagnoses to improve future predictions

### Requirement 21: 整備ナレッジ検索

**User Story:** As a Mechanic, I want to search service manuals and past service records, so that I can find solutions to technical problems.

#### Acceptance Criteria

1. THE RAG_System SHALL index service manuals, technical bulletins, and Inspection_History
2. WHEN a Mechanic enters a search query, THE RAG_System SHALL return relevant documents and past cases
3. THE RAG_System SHALL rank search results by relevance
4. THE RAG_System SHALL highlight matching text in search results
5. THE RAG_System SHALL allow Mechanic to filter search results by vehicle make and model

### Requirement 22: 写真解析AI

**User Story:** As a Mechanic, I want AI to analyze photos of vehicle parts, so that I can detect damage and wear automatically.

#### Acceptance Criteria

1. WHEN a Mechanic uploads a photo of a vehicle part, THE Photo_Analysis_AI SHALL analyze the photo
2. THE Photo_Analysis_AI SHALL detect visible damage such as scratches, dents, and cracks
3. THE Photo_Analysis_AI SHALL detect wear indicators such as brake pad thickness and tire tread depth
4. THE Photo_Analysis_AI SHALL highlight detected issues on the photo
5. THE Photo_Analysis_AI SHALL provide severity assessment for each detected issue

### Requirement 23: 工数最適化

**User Story:** As a Manager, I want the system to estimate standard labor hours based on historical data, so that estimates become more accurate over time.

#### Acceptance Criteria

1. THE Garage_OS SHALL collect actual labor hours for each service type and vehicle model
2. THE Garage_OS SHALL calculate average labor hours for each service type and vehicle model
3. WHEN creating an Estimate, THE Garage_OS SHALL suggest labor hours based on historical averages
4. THE Garage_OS SHALL identify outliers where actual time significantly differs from estimated time
5. THE Garage_OS SHALL allow Administrator to review and adjust standard labor hours

### Requirement 24: 音声入力

**User Story:** As a Mechanic, I want to input information using voice, so that I can update work orders hands-free while working.

#### Acceptance Criteria

1. THE Voice_Input SHALL allow Mechanic to dictate notes and observations
2. THE Voice_Input SHALL convert speech to text with acceptable accuracy
3. THE Voice_Input SHALL support technical automotive terminology
4. THE Garage_OS SHALL allow Mechanic to review and edit voice-transcribed text before saving
5. THE Voice_Input SHALL function in noisy workshop environments with acceptable accuracy

### Requirement 25: 権限管理

**User Story:** As an Administrator, I want to control user permissions, so that users can only access functions appropriate to their role.

#### Acceptance Criteria

1. THE Garage_OS SHALL support role-based access control with roles: Administrator, Manager, Service_Advisor, Mechanic
2. THE Garage_OS SHALL allow Administrator to assign roles to users
3. THE Garage_OS SHALL restrict Mechanic access to work-related functions only
4. THE Garage_OS SHALL restrict Service_Advisor access to customer and reservation functions
5. THE Garage_OS SHALL allow Manager to view KPI_Dashboard but not modify operational data
6. THE Garage_OS SHALL allow Administrator to access all functions

### Requirement 26: 認証とセキュリティ

**User Story:** As an Administrator, I want secure user authentication, so that only authorized users can access the system.

#### Acceptance Criteria

1. THE Garage_OS SHALL authenticate users using OAuth2 protocol
2. THE Garage_OS SHALL require password complexity meeting industry standards (minimum 8 characters, mixed case, numbers, special characters)
3. WHEN a user fails authentication 5 times, THE Garage_OS SHALL lock the account for 15 minutes
4. THE Garage_OS SHALL encrypt sensitive data at rest and in transit
5. THE Garage_OS SHALL log all authentication attempts and access to sensitive data

### Requirement 27: データバックアップ

**User Story:** As an Administrator, I want automatic data backups, so that data can be recovered in case of system failure.

#### Acceptance Criteria

1. THE Garage_OS SHALL perform automated daily backups of the PostgreSQL database
2. THE Garage_OS SHALL retain daily backups for 30 days
3. THE Garage_OS SHALL perform automated weekly backups retained for 90 days
4. THE Garage_OS SHALL store backups in geographically separate AWS region
5. THE Garage_OS SHALL allow Administrator to initiate manual backup at any time
6. THE Garage_OS SHALL verify backup integrity after each backup operation

### Requirement 28: システム可用性

**User Story:** As a Manager, I want the system to be highly available, so that business operations are not disrupted by system downtime.

#### Acceptance Criteria

1. THE Garage_OS SHALL achieve 99.5% uptime measured monthly
2. WHEN a system component fails, THE Garage_OS SHALL automatically failover to redundant component within 60 seconds
3. THE Garage_OS SHALL perform scheduled maintenance during off-peak hours (midnight to 5am JST)
4. WHEN scheduled maintenance is planned, THE Garage_OS SHALL notify users at least 48 hours in advance
5. THE Garage_OS SHALL monitor system health and alert Administrator when performance degrades

### Requirement 29: マルチテナント対応

**User Story:** As a SaaS provider, I want to support multiple garage tenants, so that each garage has isolated data and configuration.

#### Acceptance Criteria

1. THE Garage_OS SHALL isolate data for each garage tenant
2. THE Garage_OS SHALL prevent users from one tenant accessing data from another tenant
3. THE Garage_OS SHALL allow each tenant to configure their own branding (logo, colors)
4. THE Garage_OS SHALL allow each tenant to configure their own business hours and service types
5. THE Garage_OS SHALL track resource usage per tenant for billing purposes

### Requirement 30: 料金プラン管理

**User Story:** As a SaaS provider, I want to manage subscription plans, so that garages can subscribe to appropriate service tiers.

#### Acceptance Criteria

1. THE Garage_OS SHALL support multiple subscription plans (Small, Standard, Enterprise)
2. THE Garage_OS SHALL enforce feature limits based on subscription plan
3. THE Garage_OS SHALL allow tenant to upgrade or downgrade subscription plan
4. WHEN a tenant upgrades, THE Garage_OS SHALL enable additional features immediately
5. WHEN a tenant downgrades, THE Garage_OS SHALL disable features at the end of the current billing period
6. THE Garage_OS SHALL track usage of metered features (AI estimates, SMS notifications) for billing

### Requirement 31: API提供

**User Story:** As a third-party developer, I want to access Garage OS data via API, so that I can build integrations and extensions.

#### Acceptance Criteria

1. THE Garage_OS SHALL provide RESTful API for customer, vehicle, reservation, and work order data
2. THE Garage_OS SHALL authenticate API requests using API keys
3. THE Garage_OS SHALL rate-limit API requests to prevent abuse (1000 requests per hour per tenant)
4. THE Garage_OS SHALL return API responses in JSON format
5. THE Garage_OS SHALL provide API documentation with examples
6. WHERE API access is enabled for a tenant, THE Garage_OS SHALL log all API requests for audit purposes

### Requirement 32: モバイルアプリ対応

**User Story:** As a Mechanic, I want to use the system on a mobile device, so that I can update work orders from the workshop floor.

#### Acceptance Criteria

1. THE Garage_OS SHALL provide a mobile application built with Flutter for iOS and Android
2. THE mobile application SHALL support core functions: view work orders, update status, upload photos, record time
3. THE mobile application SHALL synchronize data with the backend when network connectivity is available
4. WHERE network connectivity is unavailable, THE mobile application SHALL queue updates for later synchronization
5. THE mobile application SHALL support barcode scanning for part lookup

### Requirement 33: レスポンシブWebデザイン

**User Story:** As a Service_Advisor, I want to use the system on various devices, so that I can access the system from desktop, tablet, or mobile browser.

#### Acceptance Criteria

1. THE Garage_OS web interface SHALL adapt layout for screen sizes from 320px to 2560px width
2. THE Garage_OS web interface SHALL remain functional on touch-screen devices
3. THE Garage_OS web interface SHALL load within 3 seconds on standard broadband connection
4. THE Garage_OS web interface SHALL support modern browsers (Chrome, Firefox, Safari, Edge) released within the past 2 years
5. THE Garage_OS web interface SHALL meet WCAG 2.1 Level AA accessibility standards

### Requirement 34: 多言語対応

**User Story:** As a garage owner, I want to use the system in my preferred language, so that my staff can use the system effectively.

#### Acceptance Criteria

1. THE Garage_OS SHALL support Japanese and English user interfaces
2. THE Garage_OS SHALL allow each user to select their preferred language
3. THE Garage_OS SHALL display all system messages, labels, and help text in the selected language
4. THE Garage_OS SHALL format dates, times, and currency according to the selected locale
5. WHERE AI features are used, THE Garage_OS SHALL accept input and provide output in the selected language

### Requirement 35: 通知設定管理

**User Story:** As a user, I want to control notification preferences, so that I receive relevant notifications without being overwhelmed.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow each user to configure notification preferences for email, SMS, and push notifications
2. THE Garage_OS SHALL allow users to enable or disable notifications by category (reservations, work status, reminders, system alerts)
3. THE Garage_OS SHALL allow users to set quiet hours during which non-urgent notifications are suppressed
4. WHEN a user disables a notification category, THE Garage_OS SHALL not send notifications in that category to that user
5. THE Garage_OS SHALL provide a notification history showing recent notifications sent to the user

### Requirement 36: レポート生成

**User Story:** As a Manager, I want to generate business reports, so that I can analyze performance and share results with stakeholders.

#### Acceptance Criteria

1. THE Garage_OS SHALL allow Manager to generate reports for revenue, customer acquisition, service types, and mechanic performance
2. THE Garage_OS SHALL allow Manager to specify date range for reports
3. THE Garage_OS SHALL export reports in PDF and Excel formats
4. THE Garage_OS SHALL allow Manager to schedule automatic report generation and email delivery
5. THE Garage_OS SHALL include charts and graphs in reports for visual analysis

### Requirement 37: 顧客ポータル

**User Story:** As a Customer, I want to view my service history and invoices online, so that I can track my vehicle maintenance.

#### Acceptance Criteria

1. THE Garage_OS SHALL provide a customer portal accessible via web browser
2. THE customer portal SHALL allow Customer to view their Vehicles and Inspection_History
3. THE customer portal SHALL allow Customer to view and download Invoices
4. THE customer portal SHALL allow Customer to view upcoming Reservations
5. THE customer portal SHALL allow Customer to update contact information
6. THE Garage_OS SHALL authenticate customer portal users using email and password

### Requirement 38: AWS インフラストラクチャ

**User Story:** As a SaaS provider, I want to deploy on AWS infrastructure, so that the system is scalable, reliable, and cost-effective.

#### Acceptance Criteria

1. THE Garage_OS SHALL deploy backend services on AWS ECS or EKS
2. THE Garage_OS SHALL use AWS RDS for PostgreSQL database with Multi-AZ deployment
3. THE Garage_OS SHALL use AWS S3 for storing photos, videos, and documents
4. THE Garage_OS SHALL use AWS CloudFront for content delivery
5. THE Garage_OS SHALL use AWS Cognito or third-party OAuth2 provider for authentication
6. THE Garage_OS SHALL use AWS CloudWatch for monitoring and logging
7. THE Garage_OS SHALL use AWS Lambda for serverless functions where appropriate
8. THE Garage_OS SHALL implement auto-scaling for backend services based on load

### Requirement 39: コスト最適化

**User Story:** As a SaaS provider, I want to optimize AWS costs, so that the service remains profitable.

#### Acceptance Criteria

1. THE Garage_OS SHALL use S3 lifecycle policies to move infrequently accessed photos and videos to S3 Glacier after 90 days
2. THE Garage_OS SHALL use AWS Reserved Instances or Savings Plans for predictable workloads
3. THE Garage_OS SHALL implement database connection pooling to reduce RDS costs
4. THE Garage_OS SHALL compress and optimize images before storing in S3
5. THE Garage_OS SHALL monitor AWS costs using AWS Cost Explorer and alert when costs exceed budget thresholds

### Requirement 40: 災害復旧計画

**User Story:** As a SaaS provider, I want a disaster recovery plan, so that service can be restored quickly after a major outage.

#### Acceptance Criteria

1. THE Garage_OS SHALL maintain a documented disaster recovery plan with Recovery Time Objective (RTO) of 4 hours
2. THE Garage_OS SHALL maintain a documented disaster recovery plan with Recovery Point Objective (RPO) of 1 hour
3. THE Garage_OS SHALL perform disaster recovery drills quarterly
4. THE Garage_OS SHALL maintain infrastructure-as-code (Terraform or CloudFormation) for rapid environment recreation
5. THE Garage_OS SHALL store disaster recovery documentation in a location separate from primary infrastructure

