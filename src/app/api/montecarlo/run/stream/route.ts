import { NextRequest, NextResponse } from "next/server";
import { PrismaMonteCarloRepository } from "@/modules/monte-carlo/infrastructure/repositories/PrismaMonteCarloRepository";
import { runMonteCarlo } from "@/modules/monte-carlo/lib/runMonteCarlo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reino = "AML", iterations = 2000, seed = "kiriox-v1-default", seedLimit = 30 } = body;
    const allowedSeedLimits = new Set([5, 10, 15, 20, 30, 50]);
    const safeSeedLimit = allowedSeedLimits.has(Number(seedLimit)) ? Number(seedLimit) : 30;

    const repo = new PrismaMonteCarloRepository();
    const subgraph = await repo.getSimulationSubgraph(reino, safeSeedLimit);

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const send = (data: any) => {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        send({ type: "start", iteration: 0, total: iterations });

        const { summary } = runMonteCarlo(subgraph, iterations, seed, {
          reportEvery: Math.max(10, Math.floor(iterations / 60)),
          onProgress: (progress) => {
            send({ type: "progress", ...progress });
          }
        });

        send({
          type: "done",
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
          }
        });

        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to execute Monte Carlo simulation", details: error.message },
      { status: 500 }
    );
  }
}
