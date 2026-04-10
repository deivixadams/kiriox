export async function GET() {
  return Response.json(
    {
      ok: false,
      message: 'License Management está deshabilitado temporalmente.',
    },
    { status: 410 }
  );
}
