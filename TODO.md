# Repart System Implementation Status

## 1. Repart Mobile Application

### 1.1 User System

#### 1.1.1 Sign System (Auth)

- [x] **1.1.1.1 Sign up**
  - [x] 1.1.1.1.1 Enter Phone Number
  - [x] 1.1.1.1.2 Verify OTP (SMS) using Firebase (Implemented as 2FA/Passkey in Profile)
  - [x] 1.1.1.1.3 Set Password
  - [x] 1.1.1.1.4 Agree to Terms & Conditions
- [ ] **1.1.1.2 Login**
  - [x] 1.1.1.2.1 Login with Phone & Password
  - [x] 1.1.1.2.2 Login with Biometric (FaceID/TouchID)
- [x] **1.1.1.3 Forgot Password**
  - [x] 1.1.1.3.1 Request Reset OTP
  - [x] 1.1.1.3.2 Set New Password

#### 1.1.2 Profile Management

- [x] **1.1.2.1 View Profile**
- [x] **1.1.2.2 Edit Profile Info (Name, Surname, Avatar)**
- [x] **1.1.2.3 Address Management**
  - [x] 1.1.2.3.1 Add New Address (Map Pin + Text)
  - [x] 1.1.2.3.2 Edit/Delete Address
- [x] **1.1.2.4 Payout Settings (Gəlir Kartı)**
  - [x] 1.1.2.4.1 Add Bank Card (16 Digits)
  - [x] 1.1.2.4.2 Set Primary Card for Receiving Payments

#### 1.1.3 Selling System (Listing Module)

- [x] **1.1.3.1 Create New Listing**
  - [x] 1.1.3.1.1 Search Device Model (Database)
  - [x] 1.1.3.1.2 Fault Tree Survey (Dynamic Form)
  - [x] 1.1.3.1.3 Upload Photos (Overlay, OCR)
  - [x] 1.1.3.1.4 Price Estimation & Setting
  - [x] 1.1.3.1.5 Publish Listing
- [x] **1.1.3.2 Manage Listings**
  - [x] 1.1.3.2.1 Edit Listing (Basic)
  - [x] 1.1.3.2.2 Deactivate/Delete Listing
  - [x] 1.1.3.2.3 View Listing Stats (Views/Offers)

#### 1.1.4 Buying System (Marketplace)

- [x] **1.1.4.1 Search Engine**
  - [x] 1.1.4.1.1 Search by Text (Model Name)
- [x] **1.1.4.2 Filtering System**
  - [x] 1.1.4.2.1 Filter by Part Condition
  - [ ] 1.1.4.2.2 Filter by Location
  - [ ] 1.1.4.2.3 Filter by Price Range
- [x] **1.1.4.3 Product Detail View**
  - [x] 1.1.4.3.1 View Photos
  - [x] 1.1.4.3.2 Check Compatibility List (Implied by Model)
  - [x] 1.1.4.3.3 Ask Question (Chat)
- [x] **1.1.4.4 Shopping Actions**
  - [x] 1.1.4.4.1 Make an Offer
  - [x] 1.1.4.4.2 Add to Cart
  - [x] 1.1.4.4.3 Buy Now

#### 1.1.5 Transaction & Logistics System

- [x] **1.1.5.1 Checkout**
  - [x] 1.1.5.1.1 Select Delivery Address
  - [x] 1.1.5.1.2 Payment (Buyer enters Card Info)
- [x] **1.1.5.2 Order Tracking**
  - [x] 1.1.5.2.1 View Order Status
  - [x] 1.1.5.2.2 Track Cargo (Simulated)
- [x] **1.1.5.3 Confirmation Process (24h Timer)**
  - [x] 1.1.5.3.1 Confirm Receipt
  - [x] 1.1.5.3.2 Report Issue (Open Dispute)

#### 1.1.6 Dispute Resolution System

- [x] **1.1.6.1 Create Dispute Ticket**
  - [x] 1.1.6.1.1 Select Reason
  - [x] 1.1.6.1.2 Upload Proof Video
  - [x] 1.1.6.1.3 Add Description
- [x] **1.1.6.2 View Dispute Status**

### 1.2 Admin System (Web Dashboard)

#### 1.2.1 User Administration

- [ ] 1.2.1.1 User List
- [ ] 1.2.1.2 Ban/Unban User
- [ ] 1.2.1.3 View User Activity Logs

#### 1.2.2 Listing & Content Management

- [ ] 1.2.2.1 Review Suspicious Listings
- [ ] 1.2.2.2 Manage Device Database
- [ ] 1.2.2.3 Edit Categories

#### 1.2.3 Financial Management

- [ ] 1.2.3.1 View Escrow Pool Balance
- [ ] 1.2.3.2 Execute Payouts
- [ ] 1.2.3.3 View Commission Reports
- [ ] 1.2.3.4 Refund Processor

#### 1.2.4 Dispute Management Center

- [x] 1.2.4.1 View Active Disputes
- [x] 1.2.4.2 Watch Evidence Videos
- [x] 1.2.4.3 Compare with Listing Photos
- [x] 1.2.4.4 Decision Making

#### 1.2.5 System Notifications

- [ ] 1.2.5.1 Send Push Notification
- [ ] 1.2.5.2 Send SMS Alert

### 1.3 Backend Subsystem

- [x] 1.3.1 Authentication Service (JWT/Session)
- [x] 1.3.2 Image Processing Service (OCR)
- [ ] 1.3.3 Notification Service
- [x] 1.3.4 Payment Gateway Integration (Simulated)
- [x] 1.3.5 Logistics Aggregator Service (Simulated)
- [x] 1.3.6 Cron Job Scheduler (Lazy Check)
