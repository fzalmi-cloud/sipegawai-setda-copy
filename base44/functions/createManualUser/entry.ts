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
    const { nama_lengkap, nip, email, role, unit_id, nama_unit, jabatan, no_hp } = body;

    if (!nama_lengkap) return Response.json({ error: 'Nama lengkap is required' }, { status: 400 });

    // Generate email if not provided
    const finalEmail = email || `${nama_lengkap.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@setda.sumbarprov.go.id`;

    // Check for duplicate email
    const existing = await base44.asServiceRole.entities.User.filter({ email: finalEmail });
    if (existing.length > 0) {
      return Response.json({ error: 'Email sudah digunakan' }, { status: 409 });
    }

    // Create user directly via service role
    const newUser = await base44.asServiceRole.entities.User.create({
      email: finalEmail,
      full_name: nama_lengkap,
      nama_lengkap,
      nip: nip || '',
      role: role || 'pegawai',
      unit_id: unit_id || '',
      nama_unit: nama_unit || '',
      jabatan: jabatan || '',
      no_hp: no_hp || '',
      default_password: '12345678',
      password_changed: false,
    });

    return Response.json({ success: true, user_id: newUser.id, email: finalEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});