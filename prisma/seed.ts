import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { calcAge } from '../lib/calculations'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing seed data
  await prisma.quarterlyReport.deleteMany()
  await prisma.account.deleteMany()
  await prisma.liability.deleteMany()
  await prisma.client.deleteMany()

  const c1Dob = '1978-03-15'
  const c2Dob = '1976-09-22'

  const thompson = await prisma.client.create({
    data: {
      isMarried: true,
      c1FirstName: 'Sarah',
      c1LastName: 'Thompson',
      c1Dob,
      c1Age: calcAge(c1Dob),
      c1SsnLast4: '4521',
      c2FirstName: 'Michael',
      c2LastName: 'Thompson',
      c2Dob,
      c2Age: calcAge(c2Dob),
      c2SsnLast4: '8834',
      monthlySalaryC1: 8000,
      monthlySalaryC2: 7000,
      monthlyExpenseBudget: 12000,
      insuranceDeductibles: 3500,
      trustEnabled: true,
      trustPropertyAddress: '4521 Peachtree Rd NE Atlanta GA 30305',
      trustPropertyValue: 485000,
      accounts: {
        create: [
          {
            owner: 'client1',
            category: 'retirement',
            accountType: 'Roth IRA',
            institutionName: 'Charles Schwab',
            accountNumberLast4: '7823',
          },
          {
            owner: 'client2',
            category: 'retirement',
            accountType: 'IRA',
            institutionName: 'Charles Schwab',
            accountNumberLast4: '4491',
          },
          {
            owner: 'client2',
            category: 'retirement',
            accountType: '401K',
            institutionName: 'Fidelity',
            accountNumberLast4: '2267',
          },
          {
            owner: 'joint',
            category: 'non-retirement',
            accountType: 'Brokerage',
            institutionName: 'Charles Schwab',
            accountNumberLast4: '9934',
          },
          {
            owner: 'client1',
            category: 'non-retirement',
            accountType: 'Checking',
            institutionName: 'Pinnacle Bank',
            accountNumberLast4: '1122',
          },
          {
            owner: 'client1',
            category: 'non-retirement',
            accountType: 'HYSA',
            institutionName: 'Pinnacle Bank',
            accountNumberLast4: '3344',
          },
        ],
      },
      liabilities: {
        create: [
          {
            liabilityType: 'Primary Mortgage',
            interestRate: 4.75,
            balance: 312000,
          },
          {
            liabilityType: 'Auto Loan (Mercedes)',
            interestRate: 3.9,
            balance: 28500,
          },
        ],
      },
    },
  })

  console.log(`Created client: ${thompson.c1FirstName} & ${thompson.c2FirstName} ${thompson.c1LastName} (${thompson.id})`)
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
