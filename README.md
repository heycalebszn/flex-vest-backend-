# 💸 StableSave Backend

A Node.js/Express.js backend powering a crypto-enabled savings platform that allows users to securely save in **stablecoins** like USDT/USDC, while offering flexible, goal-based, and fixed savings plans — with fiat on/off ramps, analytics, and referral rewards.

---

## 🚀 Features

### 🔐 Authentication
- Sign up & login using **email or phone number**
- **Optional Web3 wallet connect** (Phantom, Metamask)
- **Two-Factor Authentication (2FA)**
- **Password reset** functionality

### 📊 User Dashboard
- View **total stablecoin balance** with real-time **USD/Naira** equivalent
- Savings summary:
  - **Flex Save** – withdraw anytime
  - **Goal Save** – set a savings goal
  - **Fixed Save** – lock funds for higher yield
- Recent transactions and account activities

### 💰 Savings Plans
#### Flex Save
- Deposit/withdraw stablecoins anytime

#### Goal Save
- Set savings target & deadline
- View progress bar

#### Fixed Save
- Lock stablecoins for a higher interest yield
- View interest rate and maturity date

_All plans support:_
- ✅ Deposits (wallet or fiat)
- ✅ Withdrawals (wallet or bank)
- ✅ Full transaction history

### 💳 Deposit & Withdraw
- **Deposit Methods:**
  - Web3 Wallets (Metamask, Phantom)
  - Bank Transfer (Naira → Stablecoin via API)
- **Withdraw Methods:**
  - Crypto wallet
  - Linked Naira bank account (Stablecoin → Naira)

### 📈 Analytics
- Real-time **growth charts** in stablecoin & Naira
- **Interest earned** tracking
- **Exchange rate tracker**

### 🔔 Notifications
- Reminders to top-up savings
- Interest & maturity alerts
- Withdrawal and transaction alerts

### 👤 Profile & Settings
- Wallet address management
- Link and manage bank accounts
- Configure 2FA for extra security

### 🎁 Referral Program
- Invite friends, earn **stablecoin bonuses**
- Track referrals and rewards

---

## 🧱 Tech Stack

- **Node.js** / **Express.js**
- JWT + 2FA (TOTP-based)
- MongoDB or PostgreSQL
- Web3.js / Ethers.js
- External APIs for:
  - Stablecoin conversion
  - Exchange rates
  - SMS/email
  - Bank verification

---

## 📂 Project Structure
src/
├── controllers/
├── routes/
├── models/
├── middlewares/
├── services/
├── utils/
└── config/


---

## 🛠️ Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/stablesave-backend.git
cd stablesave-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev

✅ Roadmap
 User authentication (email/phone, 2FA, wallet connect)

 Savings logic for Flex, Goal, and Fixed

 Bank and wallet integrations

 Transaction tracking

 Analytics endpoints

 Notification service

 Referral module

🤝 Contributing
Pull requests are welcome! To contribute:

Fork the repo

Create a new branch

Commit your changes

Open a PR

📧 Contact
Built with 💙 by Caleb Kalejaiye

DM on Twitter: @heycalebszn
