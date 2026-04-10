export async function POST() {
  return Response.json(
    {
      ok: false,
      message: 'License Management está deshabilitado temporalmente.',
    },
    { status: 410 }
  );
}
