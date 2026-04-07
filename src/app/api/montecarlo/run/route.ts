import { NextRequest, NextResponse } from "next/server";
import { PrismaMonteCarloRepository } from "@/modules/monte-carlo/infrastructure/repositories/PrismaMonteCarloRepository";
import { runMonteCarlo } from "@/modules/monte-carlo/lib/runMonteCarlo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reino = "AML", iterations = 2000, seed = "kiriox-v1-default", seedLimit = 30 } = body;
    const allowedSeedLimits = new Set([5, 10, 15, 20, 30, 50]);
    const safeSeedLimit = allowedSeedLimits.has(Number(seedLimit)) ? Number(seedLimit) : 30;

    console.log(`[MonteCarlo API] Starting simulation: reino=${reino}, iterations=${iterations}`);

    const repo = new PrismaMonteCarloRepository();
    const subgraph = await repo.getSimulationSubgraph(reino, safeSeedLimit);

    // TODO: Apply optional subgraph filters from body if provided

    const { summary, iterations: iterationResults } = runMonteCarlo(subgraph, iterations, seed);

    return NextResponse.json({
      summary,
      run_metadata: {
        reino,
        iterations,
        seed_limit: safeSeedLimit,
        seed,
        timestamp: new Date().toISOString(),
        node_count: subgraph.nodes.length,
        edge_count: subgraph.edges.length,
        score_source: subgraph.score_source ?? 'baseline',
        score_count: subgraph.score_count ?? 0
      },
      // In V1, we only return the summary and metadata to keep payload small. 
      // Detail results can be requested or streamed if needed.
    });
  } catch (error: any) {
    console.error(`[MonteCarlo API] Run Error:`, error);
    return NextResponse.json(
      { error: "Failed to execute Monte Carlo simulation", details: error.message }, 
      { status: 500 }
    );
  }
}
