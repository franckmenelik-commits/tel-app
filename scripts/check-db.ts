import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.memoryInsight.count()
    console.log(`[DB Check] Number of MemoryInsight records: ${count}`)
    if (count > 0) {
      const samples = await prisma.memoryInsight.findMany({ take: 5 })
      console.log('[DB Check] Sample records:', samples)
    }
  } catch (err) {
    console.error('[DB Check] Error querying database:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
