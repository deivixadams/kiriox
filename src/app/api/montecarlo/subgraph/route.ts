import { NextRequest, NextResponse } from "next/server";
import { PrismaMonteCarloRepository } from "@/modules/monte-carlo/infrastructure/repositories/PrismaMonteCarloRepository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reino = searchParams.get("reino") || "AML";
  const seedLimitRaw = Number(searchParams.get("seedLimit") || "30");
  const allowedSeedLimits = new Set([5, 10, 15, 20, 30, 50]);
  const seedLimit = allowedSeedLimits.has(seedLimitRaw) ? seedLimitRaw : 30;

  console.log(`[MonteCarlo API] Fetching subgraph for reino: ${reino}`);

  const repo = new PrismaMonteCarloRepository();
  
  try {
    const subgraph = await repo.getSimulationSubgraph(reino, seedLimit);
    
    return NextResponse.json(subgraph, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (error: any) {
    console.error(`[MonteCarlo API] Error fetching subgraph:`, error);
    return NextResponse.json(
      { error: "Failed to fetch Monte Carlo subgraph", details: error.message }, 
      { status: 500 }
    );
  }
}
