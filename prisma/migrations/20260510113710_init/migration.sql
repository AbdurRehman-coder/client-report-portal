-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isMarried" BOOLEAN NOT NULL DEFAULT false,
    "c1FirstName" TEXT NOT NULL,
    "c1LastName" TEXT NOT NULL,
    "c1Dob" TEXT NOT NULL,
    "c1Age" INTEGER NOT NULL DEFAULT 0,
    "c1SsnLast4" TEXT NOT NULL,
    "c2FirstName" TEXT,
    "c2LastName" TEXT,
    "c2Dob" TEXT,
    "c2Age" INTEGER,
    "c2SsnLast4" TEXT,
    "monthlySalaryC1" REAL NOT NULL DEFAULT 0,
    "monthlySalaryC2" REAL NOT NULL DEFAULT 0,
    "monthlyExpenseBudget" REAL NOT NULL DEFAULT 0,
    "insuranceDeductibles" REAL NOT NULL DEFAULT 0,
    "trustEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trustPropertyAddress" TEXT,
    "trustPropertyValue" REAL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountNumberLast4" TEXT,
    "institutionName" TEXT,
    CONSTRAINT "Account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "liabilityType" TEXT NOT NULL,
    "interestRate" REAL NOT NULL,
    "balance" REAL NOT NULL,
    CONSTRAINT "Liability_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuarterlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "reportDate" TEXT NOT NULL,
    "quarterLabel" TEXT NOT NULL,
    "inflowMonthly" REAL NOT NULL,
    "outflowMonthly" REAL NOT NULL,
    "excessMonthly" REAL NOT NULL,
    "privateReserveBalance" REAL NOT NULL,
    "privateReserveTarget" REAL NOT NULL,
    "investmentAccountBalance" REAL NOT NULL DEFAULT 0,
    "trustValueThisQuarter" REAL NOT NULL DEFAULT 0,
    "retirementTotalC1" REAL NOT NULL DEFAULT 0,
    "retirementTotalC2" REAL NOT NULL DEFAULT 0,
    "nonRetirementTotal" REAL NOT NULL DEFAULT 0,
    "grandTotalNetWorth" REAL NOT NULL DEFAULT 0,
    "totalLiabilities" REAL NOT NULL DEFAULT 0,
    "accountBalancesJson" TEXT NOT NULL DEFAULT '[]',
    "liabilityBalancesJson" TEXT NOT NULL DEFAULT '[]',
    "pdfUrl" TEXT,
    CONSTRAINT "QuarterlyReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
