export function getRequestMeta(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    return {
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
    };
}
