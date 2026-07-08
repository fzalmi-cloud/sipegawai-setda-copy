import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { email, nama_lengkap, role, nip, unit_id, nama_unit, jabatan } = body;

    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    // Use service role to find and update the invited user
    const matches = await base44.asServiceRole.entities.User.filter({ email });
    if (matches.length === 0) {
      return Response.json({ error: 'User not found — may still be processing' }, { status: 404 });
    }

    const targetUser = matches[0];
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      role,
      nama_lengkap,
      nip,
      unit_id,
      nama_unit,
      jabatan,
      default_password: '12345678',
      password_changed: false,
    });

    return Response.json({ success: true, user_id: targetUser.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});