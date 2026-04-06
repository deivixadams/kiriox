import { NextRequest, NextResponse } from "next/server";
import { PrismaSimulationGraphRepository } from "@/modules/simulation/infrastructure/repositories/PrismaSimulationGraphRepository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const framework = searchParams.get("framework") || "AML";

  console.log(`[Simulation API] Fetching real topology for framework: ${framework}`);

  const repo = new PrismaSimulationGraphRepository();
  
  try {
    const topology = await repo.getSimulationTopology(framework);
    
    // Add lightweight cache header for stability during simulation
    return NextResponse.json(topology, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error(`[Simulation API] Error fetching topology:`, error);
    return NextResponse.json(
      { error: "Failed to fetch simulation topology", details: error.message }, 
      { status: 500 }
    );
  }
}
