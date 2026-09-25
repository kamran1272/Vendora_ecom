import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import * as path from 'path'

for (const envPath of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')]) {
  dotenv.config({ path: envPath })
}

function requireEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing ${name} environment variable.`)
  return value
}

async function main() {
  const email = requireEnvironmentVariable('ADMIN_INITIAL_EMAIL').toLowerCase()
  const password = requireEnvironmentVariable('ADMIN_INITIAL_PASSWORD')
  const prisma = new PrismaClient()

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new Error(`An account already exists for ${email}; refusing to change its password.`)
    }

    await prisma.user.create({
      data: {
        name: 'Vendora Admin',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    })

    console.log(`✅ Admin account created: ${email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
